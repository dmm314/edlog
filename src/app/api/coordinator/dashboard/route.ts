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

    // Find the active coordinator record for this user at their school
    const coordinator = await db.levelCoordinator.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        school: { select: { id: true, name: true } },
      },
    });

    if (!coordinator) {
      return NextResponse.json({ error: "No active coordinator role found" }, { status: 403 });
    }

    // Find all classes at the coordinator's assigned levels in their school
    const coordinatorClasses = await db.class.findMany({
      where: {
        schoolId: coordinator.schoolId,
        level: { in: coordinator.levels },
      },
      select: { id: true },
    });
    const classIds = coordinatorClasses.map((c) => c.id);

    // Date range: current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Run all stat queries in parallel
    const [
      totalTeachers,
      totalEntries,
      pendingVerification,
      verifiedCount,
      recentEntries,
    ] = await Promise.all([
      // COUNT distinct teachers with assignments in these classes
      db.teacherAssignment.findMany({
        where: { classId: { in: classIds }, schoolId: coordinator.schoolId },
        select: { teacherId: true },
        distinct: ["teacherId"],
      }).then((rows) => rows.length),

      // COUNT entries this month for these classes
      db.logbookEntry.count({
        where: {
          classId: { in: classIds },
          date: { gte: monthStart, lte: monthEnd },
        },
      }),

      // COUNT entries with status SUBMITTED (pending verification)
      db.logbookEntry.count({
        where: {
          classId: { in: classIds },
          status: "SUBMITTED",
        },
      }),

      // COUNT entries verified this month (falls back to 0 if verifiedAt column missing)
      db.logbookEntry.count({
        where: {
          classId: { in: classIds },
          status: "VERIFIED",
          verifiedAt: { gte: monthStart, lte: monthEnd },
        },
      }).catch(() => db.logbookEntry.count({
        where: { classId: { in: classIds }, status: "VERIFIED" },
      })),

      // Latest 10 entries for these classes
      db.logbookEntry.findMany({
        where: { classId: { in: classIds } },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
          class: { select: { id: true, name: true, level: true } },
          topics: { include: { subject: { select: { id: true, name: true } } } },
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      coordinator: {
        id: coordinator.id,
        title: coordinator.title,
        levels: coordinator.levels,
        canVerify: coordinator.canVerify,
        canRemark: coordinator.canRemark,
        schoolName: coordinator.school.name,
        schoolId: coordinator.schoolId,
      },
      stats: {
        totalTeachers,
        totalEntries,
        pendingVerification,
        verifiedCount,
      },
      recentEntries,
    });
  } catch (error) {
    console.error("GET /api/coordinator/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch coordinator dashboard" }, { status: 500 });
  }
}
