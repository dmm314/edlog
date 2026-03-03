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
      pendingTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
    ] = await Promise.all([
      // Count all teachers linked via TeacherSchool (ACTIVE)
      db.teacherSchool.count({
        where: { schoolId: user.schoolId!, status: "ACTIVE" },
      }),
      db.user.count({
        where: {
          OR: [
            { schoolId: user.schoolId, role: "TEACHER", isVerified: true },
            { teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } }, role: "TEACHER", isVerified: true },
          ],
        },
      }),
      // Count pending teacher requests
      db.teacherSchool.count({
        where: { schoolId: user.schoolId!, status: "PENDING" },
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

    // Entries by subject (use assignment's subject, fall back to topics)
    const entries = await db.logbookEntry.findMany({
      where: { teacher: { schoolId: user.schoolId } },
      include: {
        assignment: { include: { subject: true } },
        topics: { include: { subject: true } },
      },
    });

    const subjectCounts: Record<string, number> = {};
    const weekCounts: Record<string, number> = {};

    for (const entry of entries) {
      // Prefer assignment subject, fall back to topics
      const subjectName = entry.assignment?.subject?.name
        || entry.topics?.[0]?.subject?.name;
      if (subjectName) {
        subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
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
      pendingTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
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
