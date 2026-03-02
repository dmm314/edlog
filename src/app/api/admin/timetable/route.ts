import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    // Get all timetable slots for the school
    const slots = await db.timetableSlot.findMany({
      where: { schoolId: user.schoolId },
      include: {
        assignment: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            class: { select: { id: true, name: true } },
            subject: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Get all assignments for creating new slots
    const assignments = await db.teacherAssignment.findMany({
      where: { schoolId: user.schoolId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
      orderBy: [{ teacher: { lastName: "asc" } }],
    });

    // Get period schedule — auto-seed defaults if none exist
    let periods = await db.periodSchedule.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { periodNum: "asc" },
    });

    if (periods.length === 0) {
      const defaults = [
        { periodNum: 1, label: "Period 1", startTime: "07:30", endTime: "08:20" },
        { periodNum: 2, label: "Period 2", startTime: "08:20", endTime: "09:10" },
        { periodNum: 3, label: "Period 3", startTime: "09:10", endTime: "10:00" },
        { periodNum: 4, label: "Period 4", startTime: "10:30", endTime: "11:20" },
        { periodNum: 5, label: "Period 5", startTime: "11:20", endTime: "12:10" },
        { periodNum: 6, label: "Period 6", startTime: "12:10", endTime: "13:00" },
        { periodNum: 7, label: "Period 7", startTime: "14:00", endTime: "14:50" },
        { periodNum: 8, label: "Period 8", startTime: "14:50", endTime: "15:40" },
        { periodNum: 9, label: "Period 9", startTime: "15:40", endTime: "16:30" },
      ];
      await db.periodSchedule.createMany({
        data: defaults.map((d) => ({ ...d, schoolId: user.schoolId! })),
        skipDuplicates: true,
      });
      periods = await db.periodSchedule.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { periodNum: "asc" },
      });
    }

    // Get all classes with counts
    const classes = await db.class.findMany({
      where: { schoolId: user.schoolId },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const result = slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      periodLabel: slot.periodLabel,
      assignmentId: slot.assignmentId,
      teacher: `${slot.assignment.teacher.firstName} ${slot.assignment.teacher.lastName}`,
      className: slot.assignment.class.name,
      classId: slot.assignment.class.id,
      subject: slot.assignment.division
        ? `${slot.assignment.subject.name} (${slot.assignment.division.name})`
        : slot.assignment.subject.name,
    }));

    const assignmentOptions = assignments.map((a) => ({
      id: a.id,
      teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
      className: a.class.name,
      classId: a.class.id,
      subject: a.division
        ? `${a.subject.name} (${a.division.name})`
        : a.subject.name,
    }));

    const classOptions = classes.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      slotCount: result.filter((s) => s.classId === c.id).length,
      teacherCount: c._count.assignments,
    }));

    return NextResponse.json({
      slots: result,
      assignments: assignmentOptions,
      periods,
      classes: classOptions,
    });
  } catch (error) {
    console.error("GET /api/admin/timetable error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { assignmentId, dayOfWeek, startTime, endTime, periodLabel } = body;

    if (!assignmentId || !dayOfWeek || !startTime || !endTime || !periodLabel) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify assignment belongs to this school
    const assignment = await db.teacherAssignment.findFirst({
      where: { id: assignmentId, schoolId: user.schoolId },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Double-booking prevention: check if this teacher already has a slot at this day/time
    const teacherConflict = await db.timetableSlot.findFirst({
      where: {
        dayOfWeek: parseInt(dayOfWeek),
        assignment: { teacherId: assignment.teacherId },
        OR: [
          // Overlapping time check: new slot starts during existing slot
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          // New slot ends during existing slot
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          // New slot fully contains existing slot
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
        ],
      },
      include: {
        assignment: {
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
    });

    if (teacherConflict) {
      const conflictTeacher = teacherConflict.assignment;
      return NextResponse.json(
        {
          error: `Double-booking conflict: This teacher is already assigned to ${conflictTeacher.subject.name} (${conflictTeacher.class.name}) on ${DAYS[parseInt(dayOfWeek) - 1] || `Day ${dayOfWeek}`} at ${teacherConflict.startTime}-${teacherConflict.endTime}. A teacher cannot teach two classes at the same time.`,
        },
        { status: 409 }
      );
    }

    // Also check if the same class already has a slot at this time
    const classConflict = await db.timetableSlot.findFirst({
      where: {
        dayOfWeek: parseInt(dayOfWeek),
        assignment: { classId: assignment.classId },
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
        ],
      },
      include: {
        assignment: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (classConflict) {
      const cc = classConflict.assignment;
      return NextResponse.json(
        {
          error: `Class conflict: ${assignment.class.name} already has ${cc.subject.name} with ${cc.teacher.firstName} ${cc.teacher.lastName} at ${classConflict.startTime}-${classConflict.endTime} on this day.`,
        },
        { status: 409 }
      );
    }

    const slot = await db.timetableSlot.create({
      data: {
        assignmentId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        periodLabel,
        schoolId: user.schoolId,
      },
      include: {
        assignment: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            class: { select: { id: true, name: true } },
            subject: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      periodLabel: slot.periodLabel,
      assignmentId: slot.assignmentId,
      teacher: `${slot.assignment.teacher.firstName} ${slot.assignment.teacher.lastName}`,
      className: slot.assignment.class.name,
      classId: slot.assignment.class.id,
      subject: slot.assignment.division
        ? `${slot.assignment.subject.name} (${slot.assignment.division.name})`
        : slot.assignment.subject.name,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/timetable error:", error);
    return NextResponse.json(
      { error: "Failed to create timetable slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("id");

    if (!slotId) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    // Verify slot belongs to this school
    const slot = await db.timetableSlot.findFirst({
      where: { id: slotId, schoolId: user.schoolId },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    await db.timetableSlot.delete({ where: { id: slotId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/timetable error:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable slot" },
      { status: 500 }
    );
  }
}
