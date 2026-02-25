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
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      unverifiedTeachers,
    ] = await Promise.all([
      db.user.count({
        where: { schoolId: user.schoolId, role: "TEACHER" },
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
      db.user.count({
        where: {
          schoolId: user.schoolId,
          role: "TEACHER",
          isVerified: false,
        },
      }),
    ]);

    // Entries by subject
    const entries = await db.logbookEntry.findMany({
      where: { teacher: { schoolId: user.schoolId } },
      include: { topic: { include: { subject: true } } },
    });

    const subjectCounts: Record<string, number> = {};
    const weekCounts: Record<string, number> = {};

    for (const entry of entries) {
      const subjectName = entry.topic.subject.name;
      subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;

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

    return NextResponse.json({
      totalTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      unverifiedTeachers,
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
