export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { TeacherSchoolStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStartOfWeek, getStartOfMonth, getWeekNumber } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const startOfWeek = getStartOfWeek();
    const startOfMonth = getStartOfMonth();

    const teacherAtSchool = {
      role: "TEACHER" as const,
      OR: [
        { schoolId: user.schoolId! },
        {
          teacherSchools: {
            some: {
              schoolId: user.schoolId!,
              status: TeacherSchoolStatus.ACTIVE,
            },
          },
        },
      ],
    };

    const [
      totalTeachers,
      pendingTeachers,
      verifiedTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      verifiedEntries,
      flaggedEntries,
      verifiedEntriesThisMonth,
      flaggedEntriesThisMonth,
      pendingEntriesThisMonth,
      activeCoordinators,
    ] = await Promise.all([
      db.user.count({ where: teacherAtSchool }),
      db.teacherSchool.count({ where: { schoolId: user.schoolId!, status: TeacherSchoolStatus.PENDING } }).catch(() => 0),
      db.user.count({ where: { ...teacherAtSchool, isVerified: true } }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId } },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, date: { gte: startOfMonth } },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, date: { gte: startOfWeek } },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, status: "VERIFIED" },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, status: "FLAGGED" },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, date: { gte: startOfMonth }, status: "VERIFIED" },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, date: { gte: startOfMonth }, status: "FLAGGED" },
      }),
      db.logbookEntry.count({
        where: { class: { schoolId: user.schoolId }, date: { gte: startOfMonth }, status: "SUBMITTED" },
      }),
      db.levelCoordinator.findMany({
        where: { schoolId: user.schoolId, isActive: true },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const unverifiedTeachers = totalTeachers - verifiedTeachers;

    // Entries by subject — try with assignment, handle gracefully
    let entriesBySubject: { subject: string; count: number }[] = [];
    let entriesByWeek: { week: string; count: number }[] = [];

    try {
      const entries = await db.logbookEntry.findMany({
        where: { class: { schoolId: user.schoolId } },
        include: {
          assignment: { include: { subject: true } },
          topics: { include: { subject: true } },
        },
      });

      const subjectCounts: Record<string, number> = {};
      const weekCounts: Record<string, number> = {};

      for (const entry of entries) {
        const subjectName = entry.assignment?.subject?.name
          || entry.topics?.[0]?.subject?.name;
        if (subjectName) {
          subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
        }

        const week = getWeekNumber(entry.date);
        weekCounts[week] = (weekCounts[week] || 0) + 1;
      }

      entriesBySubject = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      entriesByWeek = Object.entries(weekCounts)
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-4);
    } catch (e) {
      console.warn("Entry stats query failed:", (e as Error).message);
    }

    // Pro-rata compliance: actual timetable slots × (days elapsed this week / 5)
    const totalSlotsPerWeek = await db.timetableSlot.count({
      where: { schoolId: user.schoolId },
    });
    const todayDow = new Date().getDay(); // 0=Sun … 6=Sat
    const daysElapsed = Math.min(todayDow === 0 ? 5 : todayDow, 5);
    const expectedThisWeek = totalSlotsPerWeek > 0
      ? Math.round(totalSlotsPerWeek * (daysElapsed / 5))
      : totalTeachers * 4;
    const complianceRate = expectedThisWeek > 0
      ? Math.round((entriesThisWeek / expectedThisWeek) * 100)
      : 0;
    // Single raw query to get counts by level + status (replaces N+1 loop of 4×N queries)
    const allCoordinatorLevels = activeCoordinators.flatMap((c) => c.levels);
    const vpEntryCounts = allCoordinatorLevels.length > 0
      ? await db.$queryRawUnsafe<{ level: string; status: string; cnt: bigint }[]>(
          `SELECT c.level, le.status, COUNT(le.id) as cnt
           FROM "LogbookEntry" le
           JOIN "Class" c ON c.id = le."classId"
           WHERE c."schoolId" = $1 AND c.level = ANY($2) AND le.date >= $3
           GROUP BY c.level, le.status`,
          user.schoolId,
          allCoordinatorLevels,
          startOfMonth,
        ).catch(() => [])
      : [];

    // Build lookup: level -> status -> count
    const levelStatusMap = new Map<string, Map<string, number>>();
    for (const row of vpEntryCounts) {
      if (!levelStatusMap.has(row.level)) levelStatusMap.set(row.level, new Map());
      levelStatusMap.get(row.level)!.set(row.status, Number(row.cnt));
    }

    const vpBreakdown = activeCoordinators.map((coordinator) => {
      let total = 0, verified = 0, flagged = 0, pending = 0;
      for (const level of coordinator.levels) {
        const statusMap = levelStatusMap.get(level);
        if (statusMap) {
          statusMap.forEach((count, status) => {
            total += count;
            if (status === "VERIFIED") verified += count;
            else if (status === "FLAGGED") flagged += count;
            else if (status === "SUBMITTED") pending += count;
          });
        }
      }
      return {
        id: coordinator.id,
        title: coordinator.title,
        levels: coordinator.levels,
        name: `${coordinator.user.firstName} ${coordinator.user.lastName}`,
        entriesThisMonth: total,
        verifiedEntriesThisMonth: verified,
        pendingEntriesThisMonth: pending,
        flaggedEntriesThisMonth: flagged,
      };
    });

    return NextResponse.json({
      totalTeachers,
      verifiedTeachers,
      unverifiedTeachers,
      pendingTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      verifiedEntries,
      flaggedEntries,
      verifiedEntriesThisMonth,
      flaggedEntriesThisMonth,
      pendingEntriesThisMonth,
      vpBreakdown,
      complianceRate: Math.min(complianceRate, 100),
      entriesBySubject,
      entriesByWeek,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
