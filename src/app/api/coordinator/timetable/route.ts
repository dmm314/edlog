export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coordinator = await db.levelCoordinator.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    if (!coordinator) {
      return NextResponse.json({ error: "No active coordinator role found" }, { status: 403 });
    }

    // Get all classes at the coordinator's levels
    const classes = await db.class.findMany({
      where: {
        schoolId: coordinator.schoolId,
        level: { in: coordinator.levels },
      },
      select: { id: true, name: true, level: true },
    });
    const classIds = classes.map((c) => c.id);

    // Fetch timetable slots for those classes
    const slots = await db.timetableSlot.findMany({
      where: {
        schoolId: coordinator.schoolId,
        assignment: { classId: { in: classIds } },
      },
      include: {
        assignment: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            class: { select: { id: true, name: true, level: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      slots: slots.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        periodLabel: s.periodLabel,
        teacher: `${s.assignment.teacher.firstName} ${s.assignment.teacher.lastName}`,
        teacherId: s.assignment.teacher.id,
        className: s.assignment.class.name,
        classId: s.assignment.class.id,
        level: s.assignment.class.level,
        subject: s.assignment.subject.name,
        subjectId: s.assignment.subject.id,
      })),
      levels: coordinator.levels,
      classes: classes.map((c) => ({ id: c.id, name: c.name, level: c.level })),
    });
  } catch (error) {
    console.error("GET /api/coordinator/timetable error:", error);
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}
