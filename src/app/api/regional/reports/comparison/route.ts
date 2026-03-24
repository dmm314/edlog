export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Cross-school comparison endpoint.
 * Query: ?schools=id1,id2,id3 (2-6 school IDs)
 * Returns side-by-side metrics for each school.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const schoolIdsParam = request.nextUrl.searchParams.get("schools");
    if (!schoolIdsParam) {
      return NextResponse.json({ error: "schools parameter is required (comma-separated IDs)" }, { status: 400 });
    }

    const schoolIds = schoolIdsParam.split(",").filter(Boolean).slice(0, 6);
    if (schoolIds.length < 2) {
      return NextResponse.json({ error: "At least 2 schools required for comparison" }, { status: 400 });
    }

    // Verify all schools belong to this region
    const schools = await db.school.findMany({
      where: { id: { in: schoolIds }, regionId: user.regionId },
      select: { id: true, name: true, code: true, schoolType: true },
    });

    if (schools.length !== schoolIds.length) {
      return NextResponse.json({ error: "One or more schools not found in your region" }, { status: 400 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const idList = Prisma.join(schoolIds.map((id) => Prisma.sql`${id}`));

    // Fetch all metrics in parallel with raw queries for performance
    const [
      teacherCounts,
      totalEntries,
      monthlyEntries,
      weeklyEntries,
      verifiedEntries,
      flaggedEntries,
      subjectCounts,
      classCounts,
    ] = await Promise.all([
      // Teacher count per school
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT "schoolId" as school_id, COUNT("teacherId") as cnt
         FROM "TeacherSchool" WHERE "schoolId" IN (${idList}) AND status = 'ACTIVE'
         GROUP BY "schoolId"`
      ),
      // Total entries per school
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList})
         GROUP BY c."schoolId"`
      ),
      // Monthly entries
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.date >= ${startOfMonth}
         GROUP BY c."schoolId"`
      ),
      // Weekly entries
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.date >= ${startOfWeek}
         GROUP BY c."schoolId"`
      ),
      // Verified entries
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.status = 'VERIFIED'
         GROUP BY c."schoolId"`
      ),
      // Flagged entries
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT c."schoolId" as school_id, COUNT(le.id) as cnt
         FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId"
         WHERE c."schoolId" IN (${idList}) AND le.status = 'FLAGGED'
         GROUP BY c."schoolId"`
      ),
      // Distinct subjects taught
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT ta."schoolId" as school_id, COUNT(DISTINCT ta."subjectId") as cnt
         FROM "TeacherAssignment" ta
         WHERE ta."schoolId" IN (${idList})
         GROUP BY ta."schoolId"`
      ),
      // Class count
      db.$queryRaw<{ school_id: string; cnt: bigint }[]>(
        Prisma.sql`SELECT "schoolId" as school_id, COUNT(id) as cnt
         FROM "Class" WHERE "schoolId" IN (${idList})
         GROUP BY "schoolId"`
      ),
    ]);

    // Build lookup maps
    const toMap = (rows: { school_id: string; cnt: bigint }[]) =>
      new Map(rows.map((r) => [r.school_id, Number(r.cnt)]));

    const teacherMap = toMap(teacherCounts);
    const totalMap = toMap(totalEntries);
    const monthlyMap = toMap(monthlyEntries);
    const weeklyMap = toMap(weeklyEntries);
    const verifiedMap = toMap(verifiedEntries);
    const flaggedMap = toMap(flaggedEntries);
    const subjectMap = toMap(subjectCounts);
    const classMap = toMap(classCounts);

    const expectedPerTeacher = 20; // expected entries per teacher per month

    const comparison = schools.map((school) => {
      const teachers = teacherMap.get(school.id) ?? 0;
      const total = totalMap.get(school.id) ?? 0;
      const monthly = monthlyMap.get(school.id) ?? 0;
      const weekly = weeklyMap.get(school.id) ?? 0;
      const verified = verifiedMap.get(school.id) ?? 0;
      const flagged = flaggedMap.get(school.id) ?? 0;
      const subjects = subjectMap.get(school.id) ?? 0;
      const classes = classMap.get(school.id) ?? 0;

      const complianceRate = teachers > 0
        ? Math.min(Math.round((monthly / (teachers * expectedPerTeacher)) * 100), 100)
        : 0;
      const verificationRate = total > 0
        ? Math.round((verified / total) * 100)
        : 0;
      const entriesPerTeacher = teachers > 0
        ? Math.round((monthly / teachers) * 10) / 10
        : 0;

      return {
        id: school.id,
        name: school.name,
        code: school.code,
        schoolType: school.schoolType,
        metrics: {
          teachers,
          classes,
          subjects,
          totalEntries: total,
          entriesThisMonth: monthly,
          entriesThisWeek: weekly,
          verifiedEntries: verified,
          flaggedEntries: flagged,
          complianceRate,
          verificationRate,
          entriesPerTeacher,
        },
      };
    });

    // Compute dimension winners for highlighting
    const dimensions = ["complianceRate", "verificationRate", "entriesPerTeacher", "entriesThisMonth"] as const;
    const winners: Record<string, string> = {};
    for (const dim of dimensions) {
      let best = comparison[0];
      for (const s of comparison) {
        if (s.metrics[dim] > best.metrics[dim]) best = s;
      }
      winners[dim] = best.id;
    }

    return NextResponse.json({ comparison, winners });
  } catch (error) {
    console.error("GET /api/regional/reports/comparison error:", error);
    return NextResponse.json({ error: "Failed to generate comparison" }, { status: 500 });
  }
}
