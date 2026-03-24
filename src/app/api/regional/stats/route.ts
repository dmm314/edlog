export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStartOfMonth } from "@/lib/utils";
import { Prisma } from "@prisma/client";

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
          OR: [
            { school: { regionId: user.regionId } },
            { teacherSchools: { some: { school: { regionId: user.regionId }, status: "ACTIVE" } } },
          ],
        },
      }),
      db.logbookEntry.count({
        where: {
          class: { school: { regionId: user.regionId } },
        },
      }),
      db.logbookEntry.count({
        where: {
          class: { school: { regionId: user.regionId } },
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
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    const schoolIds = schools.map((s) => s.id);

    // Count teachers per school via TeacherSchool (includes both direct + invited)
    const teacherSchoolCounts = await db.teacherSchool.groupBy({
      by: ["schoolId"],
      where: { schoolId: { in: schoolIds }, status: "ACTIVE" },
      _count: { teacherId: true },
    });
    const teacherCountBySchool = new Map(
      teacherSchoolCounts.map((r) => [r.schoolId, r._count.teacherId])
    );

    // Count total + monthly entries per school via class.schoolId (skip if no schools)
    const entryCountBySchool = new Map<string, number>();
    const monthlyEntryBySchool = new Map<string, number>();

    if (schoolIds.length > 0) {
      const idList = Prisma.join(schoolIds.map((id) => Prisma.sql`${id}`));

      const entryCountRows = await db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le
         JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList})
         GROUP BY c."schoolId"`
      );
      for (const r of entryCountRows) entryCountBySchool.set(r.school_id, Number(r.cnt));

      const monthlyEntryRows = await db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le
         JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.date >= ${startOfMonth}
         GROUP BY c."schoolId"`
      );
      for (const r of monthlyEntryRows) monthlyEntryBySchool.set(r.school_id, Number(r.cnt));
    }

    // Count verified/flagged entries for performance metrics
    let verifiedBySchool = new Map<string, number>();
    let flaggedBySchool = new Map<string, number>();
    if (schoolIds.length > 0) {
      const idList = Prisma.join(schoolIds.map((id) => Prisma.sql`${id}`));
      const verifiedRows = await db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.status = 'VERIFIED'
         GROUP BY c."schoolId"`
      );
      for (const r of verifiedRows) verifiedBySchool.set(r.school_id, Number(r.cnt));

      const flaggedRows = await db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.status = 'FLAGGED'
         GROUP BY c."schoolId"`
      );
      for (const r of flaggedRows) flaggedBySchool.set(r.school_id, Number(r.cnt));
    }

    const schoolRankings = schools
      .map((school) => {
        const teacherCount = teacherCountBySchool.get(school.id) ?? 0;
        const entryCount = entryCountBySchool.get(school.id) ?? 0;
        const monthlyEntries = monthlyEntryBySchool.get(school.id) ?? 0;
        const verifiedEntries = verifiedBySchool.get(school.id) ?? 0;
        const flaggedEntries = flaggedBySchool.get(school.id) ?? 0;
        const schoolCompliance =
          teacherCount > 0
            ? Math.round(
                (monthlyEntries / (teacherCount * expectedPerTeacher)) * 100
              )
            : 0;
        const verificationRate = entryCount > 0 ? Math.round((verifiedEntries / entryCount) * 100) : 0;

        return {
          id: school.id,
          name: school.name,
          code: school.code,
          teacherCount,
          entryCount,
          monthlyEntries,
          verifiedEntries,
          flaggedEntries,
          verificationRate,
          complianceRate: Math.min(schoolCompliance, 100),
        };
      })
      .sort((a, b) => b.complianceRate - a.complianceRate);

    // Performance tier summary
    const performanceTiers = {
      excellent: schoolRankings.filter((s) => s.complianceRate >= 80).length,
      good: schoolRankings.filter((s) => s.complianceRate >= 50 && s.complianceRate < 80).length,
      needsAttention: schoolRankings.filter((s) => s.complianceRate >= 20 && s.complianceRate < 50).length,
      critical: schoolRankings.filter((s) => s.complianceRate < 20).length,
    };

    // Fetch filter options for reports
    const [regionSubjects, regionClasses, regionModules] = await Promise.all([
      db.subject.findMany({
        where: {
          schools: { some: { school: { regionId: user.regionId } } },
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }).catch(() => []),
      db.class.findMany({
        where: { school: { regionId: user.regionId } },
        select: { id: true, name: true, level: true, school: { select: { name: true } } },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      }).catch(() => []),
      db.logbookEntry.findMany({
        where: {
          class: { school: { regionId: user.regionId } },
          moduleName: { not: null },
        },
        select: { moduleName: true },
        distinct: ["moduleName"],
        orderBy: { moduleName: "asc" },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      totalSchools,
      activeSchools,
      pendingSchools,
      totalTeachers,
      totalEntries,
      entriesThisMonth,
      complianceRate: Math.min(complianceRate, 100),
      schoolRankings,
      performanceTiers,
      filterOptions: {
        subjects: regionSubjects,
        classes: regionClasses.map((c) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          schoolName: c.school.name,
        })),
        schools: schools.map((s) => ({ id: s.id, name: s.name, code: s.code })),
        modules: regionModules
          .map((m) => m.moduleName as string)
          .filter(Boolean),
      },
    });
  } catch (error) {
    console.error("GET /api/regional/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch regional stats" },
      { status: 500 }
    );
  }
}
