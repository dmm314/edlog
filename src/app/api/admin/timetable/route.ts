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

    // Try fetching slots and assignments with division, fall back without if table missing
    let slots: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      periodLabel: string;
      assignmentId: string;
      assignment: {
        teacher: { firstName: string; lastName: string };
        class: { id: string; name: string };
        subject: { name: string };
        division?: { name: string } | null;
      };
    }> = [];

    let assignments: Array<{
      id: string;
      teacher: { id: string; firstName: string; lastName: string };
      class: { id: string; name: string };
      subject: { id: string; name: string };
      division?: { id: string; name: string } | null;
    }> = [];

    try {
      slots = await db.timetableSlot.findMany({
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

      assignments = await db.teacherAssignment.findMany({
        where: { schoolId: user.schoolId },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
        orderBy: [{ teacher: { lastName: "asc" } }],
      });
    } catch (e) {
      // Division table might not exist — retry without division include
      console.warn("Timetable query with division failed, retrying without:", (e as Error).message);
      try {
        const rawSlots = await db.timetableSlot.findMany({
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
        slots = rawSlots.map((s) => ({
          ...s,
          assignment: { ...s.assignment, division: null },
        }));

        const rawAssignments = await db.teacherAssignment.findMany({
          where: { schoolId: user.schoolId },
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
          orderBy: [{ teacher: { lastName: "asc" } }],
        });
        assignments = rawAssignments.map((a) => ({
          ...a,
          division: null,
        }));
      } catch (e2) {
        console.error("Timetable query fallback also failed:", (e2 as Error).message);
        // Continue with empty arrays — at least show classes
      }
    }

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
    let classes;
    try {
      classes = await db.class.findMany({
        where: { schoolId: user.schoolId },
        include: {
          _count: { select: { assignments: true } },
        },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      });
    } catch {
      // Assignments count might fail if table has issues — fetch without count
      const rawClasses = await db.class.findMany({
        where: { schoolId: user.schoolId },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      });
      classes = rawClasses.map((c) => ({ ...c, _count: { assignments: 0 } }));
    }

    // Build a lookup of teacher+day+time -> classes for joint class detection
    const teacherSlotMap = new Map<string, { className: string; classId: string; slotId: string }[]>();
    for (const slot of slots) {
      const teacherName = `${slot.assignment.teacher.firstName} ${slot.assignment.teacher.lastName}`;
      const key = `${teacherName}|${slot.dayOfWeek}|${slot.startTime}`;
      if (!teacherSlotMap.has(key)) teacherSlotMap.set(key, []);
      teacherSlotMap.get(key)!.push({
        className: slot.assignment.class.name,
        classId: slot.assignment.class.id,
        slotId: slot.id,
      });
    }

    const slotsResult = slots.map((slot) => {
      const teacherName = `${slot.assignment.teacher.firstName} ${slot.assignment.teacher.lastName}`;
      const key = `${teacherName}|${slot.dayOfWeek}|${slot.startTime}`;
      const sameTimeSlots = teacherSlotMap.get(key) || [];
      const jointClasses = sameTimeSlots
        .filter((s) => s.slotId !== slot.id)
        .map((s) => s.className);

      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        periodLabel: slot.periodLabel,
        assignmentId: slot.assignmentId,
        teacher: teacherName,
        className: slot.assignment.class.name,
        classId: slot.assignment.class.id,
        subject: slot.assignment.division
          ? `${slot.assignment.subject.name} (${slot.assignment.division.name})`
          : slot.assignment.subject.name,
        jointWith: jointClasses.length > 0 ? jointClasses : undefined,
      };
    });

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
      level: (c as Record<string, unknown>).level as string,
      slotCount: slotsResult.filter((s) => s.classId === c.id).length,
      teacherCount: c._count.assignments,
    }));

    return NextResponse.json({
      slots: slotsResult,
      assignments: assignmentOptions,
      periods,
      classes: classOptions,
    });
  } catch (error) {
    console.error("GET /api/admin/timetable error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable data. Please ensure the database schema is up to date." },
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

    // Double/triple-booking check
    const teacherConflicts = await db.timetableSlot.findMany({
      where: {
        dayOfWeek: parseInt(dayOfWeek),
        assignment: { teacherId: assignment.teacherId },
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
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

    if (teacherConflicts.length >= 2) {
      const existing = teacherConflicts.map((c) =>
        `${c.assignment.subject.name} (${c.assignment.class.name}) at ${c.startTime}-${c.endTime}`
      ).join("; ");
      return NextResponse.json(
        {
          error: `Triple-booking blocked: This teacher already has 2 classes at this time — ${existing}. A teacher cannot teach more than 2 classes simultaneously.`,
        },
        { status: 409 }
      );
    }

    const forceDoubleBook = body.forceDoubleBook === true;
    if (teacherConflicts.length === 1 && !forceDoubleBook) {
      const conflict = teacherConflicts[0].assignment;
      return NextResponse.json(
        {
          warning: true,
          error: `This teacher is already teaching ${conflict.subject.name} in ${conflict.class.name} on ${DAYS[parseInt(dayOfWeek) - 1] || `Day ${dayOfWeek}`} at ${teacherConflicts[0].startTime}-${teacherConflicts[0].endTime}. If you proceed, this will create a joint class — ${conflict.class.name} and ${assignment.class.name} will share this teacher at the same time.`,
        },
        { status: 409 }
      );
    }

    // Class conflict check
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
