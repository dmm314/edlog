import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStartOfMonth } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json(
        { error: "No region assigned" },
        { status: 400 }
      );
    }

    const startOfMonth = getStartOfMonth();

    const [
      totalSchools,
      activeSchools,
      pendingSchools,
      totalTeachers,
      totalEntries,
      entriesThisMonth,
    ] = await Promise.all([
      db.school.count({
        where: { regionId: user.regionId },
      }),
      db.school.count({
        where: { regionId: user.regionId, status: "ACTIVE" },
      }),
      db.school.count({
        where: { regionId: user.regionId, status: "PENDING" },
      }),
      db.user.count({
        where: {
          role: "TEACHER",
          school: { regionId: user.regionId },
        },
      }),
      db.logbookEntry.count({
        where: {
          teacher: { school: { regionId: user.regionId } },
        },
      }),
      db.logbookEntry.count({
        where: {
          teacher: { school: { regionId: user.regionId } },
          date: { gte: startOfMonth },
        },
      }),
    ]);

    // Calculate compliance rate: entries this month / (teachers * expected entries per month)
    const expectedPerTeacher = 20;
    const complianceRate =
      totalTeachers > 0
        ? Math.round(
            (entriesThisMonth / (totalTeachers * expectedPerTeacher)) * 100
          )
        : 0;

    // Get school rankings with teacher and entry counts
    const schools = await db.school.findMany({
      where: { regionId: user.regionId },
      include: {
        _count: {
          select: {
            teachers: { where: { role: "TEACHER" } },
          },
        },
        teachers: {
          where: { role: "TEACHER" },
          select: {
            _count: {
              select: { entries: true },
            },
            entries: {
              where: { date: { gte: startOfMonth } },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const schoolRankings = schools
      .map((school) => {
        const teacherCount = school._count.teachers;
        const entryCount = school.teachers.reduce(
          (sum, t) => sum + t._count.entries,
          0
        );
        const monthlyEntries = school.teachers.reduce(
          (sum, t) => sum + t.entries.length,
          0
        );
        const schoolCompliance =
          teacherCount > 0
            ? Math.round(
                (monthlyEntries / (teacherCount * expectedPerTeacher)) * 100
              )
            : 0;

        return {
          id: school.id,
          name: school.name,
          code: school.code,
          teacherCount,
          entryCount,
          complianceRate: Math.min(schoolCompliance, 100),
        };
      })
      .sort((a, b) => b.complianceRate - a.complianceRate);

    return NextResponse.json({
      totalSchools,
      activeSchools,
      pendingSchools,
      totalTeachers,
      totalEntries,
      entriesThisMonth,
      complianceRate: Math.min(complianceRate, 100),
      schoolRankings,
    });
  } catch (error) {
    console.error("GET /api/regional/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch regional stats" },
      { status: 500 }
    );
  }
}
