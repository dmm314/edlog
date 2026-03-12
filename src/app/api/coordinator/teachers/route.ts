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

    // Find the active coordinator record for this user
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

    // Find all classes at the coordinator's levels
    const coordinatorClasses = await db.class.findMany({
      where: {
        schoolId: coordinator.schoolId,
        level: { in: coordinator.levels },
      },
      select: { id: true, name: true, level: true, section: true },
    });
    const classIds = coordinatorClasses.map((c) => c.id);
    const classMap = new Map(coordinatorClasses.map((c) => [c.id, c]));

    // Get all teacher assignments for these classes
    const assignments = await db.teacherAssignment.findMany({
      where: { classId: { in: classIds }, schoolId: coordinator.schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    // Date range: current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count entries per teacher this month (scoped to coordinator's classes)
    const entryCountRows = await db.logbookEntry.groupBy({
      by: ["teacherId"],
      where: {
        classId: { in: classIds },
        date: { gte: monthStart, lte: monthEnd },
      },
      _count: { id: true },
    });
    const entryCountMap = new Map(
      entryCountRows.map((r) => [r.teacherId, r._count.id])
    );

    // Group assignments by teacher
    const teacherMap = new Map<
      string,
      {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        photoUrl: string | null;
        subjects: { id: string; name: string; code: string }[];
        classes: { id: string; name: string; level: string }[];
        entryCountThisMonth: number;
      }
    >();

    for (const assignment of assignments) {
      const { teacher, subject, class: cls } = assignment;
      if (!teacherMap.has(teacher.id)) {
        teacherMap.set(teacher.id, {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          photoUrl: teacher.photoUrl,
          subjects: [],
          classes: [],
          entryCountThisMonth: entryCountMap.get(teacher.id) ?? 0,
        });
      }

      const entry = teacherMap.get(teacher.id)!;

      // Add subject if not already listed
      if (!entry.subjects.some((s) => s.id === subject.id)) {
        entry.subjects.push(subject);
      }

      // Add class if not already listed (only classes within coordinator's scope)
      if (classMap.has(cls.id) && !entry.classes.some((c) => c.id === cls.id)) {
        entry.classes.push(cls);
      }
    }

    const teachers = Array.from(teacherMap.values()).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    );

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("GET /api/coordinator/teachers error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
