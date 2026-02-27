import { NextResponse } from "next/server";
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

    const [
      totalTeachers,
      verifiedTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
    ] = await Promise.all([
      db.user.count({
        where: { schoolId: user.schoolId, role: "TEACHER" },
      }),
      db.user.count({
        where: { schoolId: user.schoolId, role: "TEACHER", isVerified: true },
      }),
      db.logbookEntry.count({
        where: { teacher: { schoolId: user.schoolId } },
      }),
      db.logbookEntry.count({
        where: {
          teacher: { schoolId: user.schoolId },
          date: { gte: startOfMonth },
        },
      }),
      db.logbookEntry.count({
        where: {
          teacher: { schoolId: user.schoolId },
          date: { gte: startOfWeek },
        },
      }),
    ]);

    const unverifiedTeachers = totalTeachers - verifiedTeachers;

    // Entries by subject (using m2m topics)
    const entries = await db.logbookEntry.findMany({
      where: { teacher: { schoolId: user.schoolId } },
      include: { topics: { include: { subject: true } } },
    });

    const subjectCounts: Record<string, number> = {};
    const weekCounts: Record<string, number> = {};

    for (const entry of entries) {
      const seenSubjects = new Set<string>();
      for (const topic of entry.topics) {
        const subjectName = topic.subject.name;
        if (!seenSubjects.has(subjectName)) {
          subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
          seenSubjects.add(subjectName);
        }
      }

      const week = getWeekNumber(entry.date);
      weekCounts[week] = (weekCounts[week] || 0) + 1;
    }

    const entriesBySubject = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const entriesByWeek = Object.entries(weekCounts)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-4);

    const expectedPerTeacher = 20;
    const complianceRate = totalTeachers > 0
      ? Math.round((entriesThisMonth / (totalTeachers * expectedPerTeacher)) * 100)
      : 0;

    return NextResponse.json({
      totalTeachers,
      verifiedTeachers,
      unverifiedTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      complianceRate: Math.min(complianceRate, 100),
      entriesBySubject,
      entriesByWeek,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch stats: ${msg}` },
      { status: 500 }
    );
  }
}
