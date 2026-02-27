import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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
      },
      orderBy: [{ teacher: { lastName: "asc" } }],
    });

    // Get period schedule
    const periods = await db.periodSchedule.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { periodNum: "asc" },
    });

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
      subject: slot.assignment.subject.name,
    }));

    const assignmentOptions = assignments.map((a) => ({
      id: a.id,
      teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
      className: a.class.name,
      classId: a.class.id,
      subject: a.subject.name,
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
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch timetable: ${msg}` },
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
      subject: slot.assignment.subject.name,
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
