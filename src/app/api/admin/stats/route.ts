export const dynamic = "force-dynamic";
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

    // Try TeacherSchool-based counts, fall back to direct schoolId
    let totalTeachers = 0;
    let pendingTeachers = 0;

    try {
      [totalTeachers, pendingTeachers] = await Promise.all([
        db.teacherSchool.count({
          where: { schoolId: user.schoolId!, status: "ACTIVE" },
        }),
        db.teacherSchool.count({
          where: { schoolId: user.schoolId!, status: "PENDING" },
        }),
      ]);
      // If TeacherSchool returns 0, also check direct schoolId
      if (totalTeachers === 0) {
        const directCount = await db.user.count({
          where: { schoolId: user.schoolId, role: "TEACHER" },
        });
        totalTeachers = Math.max(totalTeachers, directCount);
      }
    } catch {
      // TeacherSchool table doesn't exist — use direct count
      totalTeachers = await db.user.count({
        where: { schoolId: user.schoolId, role: "TEACHER" },
      });
      pendingTeachers = 0;
    }

    const [
      verifiedTeachers,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      verifiedEntries,
      flaggedEntries,
    ] = await Promise.all([
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
      db.logbookEntry.count({
        where: { teacher: { schoolId: user.schoolId }, status: "VERIFIED" },
      }),
      db.logbookEntry.count({
        where: { teacher: { schoolId: user.schoolId }, status: "FLAGGED" },
      }),
    ]);

    const unverifiedTeachers = totalTeachers - verifiedTeachers;

    // Entries by subject — try with assignment, handle gracefully
    let entriesBySubject: { subject: string; count: number }[] = [];
    let entriesByWeek: { week: string; count: number }[] = [];

    try {
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
      verifiedEntries,
      flaggedEntries,
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
