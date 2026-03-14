import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams, generateCSV, buildCsvResponse } from "@/lib/reports";
import { Prisma } from "@prisma/client";

const SCHOOL_COVERAGE_CSV_COLUMNS = [
  { key: "school", label: "School" },
  { key: "schoolCode", label: "Code" },
  { key: "division", label: "Division" },
  { key: "totalTopics", label: "Total Topics" },
  { key: "topicsCovered", label: "Topics Covered" },
  { key: "coverageRate", label: "Coverage %" },
  { key: "totalEntries", label: "Total Entries" },
  { key: "teacherCount", label: "Teachers" },
  { key: "lastActivity", label: "Last Activity" },
  { key: "gaps", label: "Gap Topics" },
  { key: "totalGaps", label: "Total Gaps" },
];

export const dynamic = "force-dynamic";

interface SchoolCoverageRow {
  school_id: string;
  school_name: string;
  school_code: string;
  division_name: string;
  topics_covered: bigint;
  total_entries: bigint;
  teacher_count: bigint;
  last_activity: Date | null;
}

interface GapRow {
  school_id: string;
  topic_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const regionId = user.regionId;
    const format = request.nextUrl.searchParams.get("format");
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // REQUIRED filters
    if (!filters.subject || !filters.level) {
      return NextResponse.json(
        { error: "Subject and level filters are required for school comparison." },
        { status: 400 }
      );
    }

    const subjectName = filters.subject;
    const classLevel = filters.level;

    // Get subject ID
    const subject = await db.subject.findUnique({
      where: { name: subjectName },
      select: { id: true },
    });

    if (!subject) {
      return NextResponse.json(
        { error: `Subject "${subjectName}" not found.` },
        { status: 404 }
      );
    }

    const subjectId = subject.id;

    // Get total topics for this subject at this level
    const totalTopics = await db.topic.count({
      where: { subjectId, classLevel },
    });

    // Build school filter conditions
    const schoolConditions: Prisma.Sql[] = [
      Prisma.sql`s."regionId" = ${regionId}`,
      Prisma.sql`ss."subjectId" = ${subjectId}`,
    ];

    if (filters.division) {
      schoolConditions.push(Prisma.sql`d.name = ${filters.division}`);
    }

    if (search) {
      schoolConditions.push(Prisma.sql`s.name ILIKE ${'%' + search + '%'}`);
    }

    const schoolWhere = Prisma.sql`WHERE ${Prisma.join(schoolConditions, ' AND ')}`;

    // Dual-path coverage per school for this specific subject+level
    // Path 1: Direct via _EntryTopics
    // Path 2: Module match for entries not in Path 1
    const query = Prisma.sql`
      WITH direct_coverage AS (
        SELECT
          et."B" as topic_id,
          le."teacherId",
          u."schoolId",
          le.date,
          le.id as entry_id
        FROM "_EntryTopics" et
        JOIN "LogbookEntry" le ON le.id = et."A"
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        JOIN "Topic" t ON t.id = et."B"
        WHERE s."regionId" = ${regionId}
          AND t."subjectId" = ${subjectId}
          AND t."classLevel" = ${classLevel}
      ),
      module_coverage AS (
        SELECT
          t2.id as topic_id,
          le."teacherId",
          u."schoolId",
          le.date,
          le.id as entry_id
        FROM "Topic" t2
        JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t2."moduleName")
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id
          AND ta."subjectId" = t2."subjectId"
          AND ta."schoolId" = s.id
        JOIN "Class" c ON c.id = le."classId" AND c.level = t2."classLevel"
        WHERE s."regionId" = ${regionId}
          AND t2."subjectId" = ${subjectId}
          AND t2."classLevel" = ${classLevel}
          AND le.id NOT IN (
            SELECT et2."A" FROM "_EntryTopics" et2 WHERE et2."B" = t2.id
          )
      ),
      combined AS (
        SELECT * FROM direct_coverage
        UNION
        SELECT * FROM module_coverage
      )
      SELECT
        s.id as school_id,
        s.name as school_name,
        s.code as school_code,
        d.name as division_name,
        COUNT(DISTINCT c.topic_id) as topics_covered,
        COUNT(DISTINCT c.entry_id) as total_entries,
        COUNT(DISTINCT c."teacherId") as teacher_count,
        MAX(c.date) as last_activity
      FROM "School" s
      JOIN "SchoolSubject" ss ON ss."schoolId" = s.id
      JOIN "Division" d ON d.id = s."divisionId"
      LEFT JOIN combined c ON c."schoolId" = s.id
      ${schoolWhere}
      GROUP BY s.id, s.name, s.code, d.name
    `;

    const rows = await db.$queryRaw<SchoolCoverageRow[]>(query);

    // Get gap topics per school (topics not covered) — up to 5 per school
    const gapQuery = Prisma.sql`
      WITH direct_coverage AS (
        SELECT et."B" as topic_id, u."schoolId"
        FROM "_EntryTopics" et
        JOIN "LogbookEntry" le ON le.id = et."A"
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        JOIN "Topic" t ON t.id = et."B"
        WHERE s."regionId" = ${regionId}
          AND t."subjectId" = ${subjectId}
          AND t."classLevel" = ${classLevel}
      ),
      module_coverage AS (
        SELECT t2.id as topic_id, u."schoolId"
        FROM "Topic" t2
        JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t2."moduleName")
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id
          AND ta."subjectId" = t2."subjectId"
          AND ta."schoolId" = s.id
        JOIN "Class" c ON c.id = le."classId" AND c.level = t2."classLevel"
        WHERE s."regionId" = ${regionId}
          AND t2."subjectId" = ${subjectId}
          AND t2."classLevel" = ${classLevel}
          AND le.id NOT IN (SELECT et2."A" FROM "_EntryTopics" et2 WHERE et2."B" = t2.id)
      ),
      covered AS (
        SELECT DISTINCT topic_id, "schoolId" FROM direct_coverage
        UNION
        SELECT DISTINCT topic_id, "schoolId" FROM module_coverage
      )
      SELECT s.id as school_id, t.name as topic_name
      FROM "School" s
      JOIN "SchoolSubject" ss ON ss."schoolId" = s.id AND ss."subjectId" = ${subjectId}
      CROSS JOIN "Topic" t
      LEFT JOIN covered c ON c.topic_id = t.id AND c."schoolId" = s.id
      WHERE s."regionId" = ${regionId}
        AND t."subjectId" = ${subjectId}
        AND t."classLevel" = ${classLevel}
        AND c.topic_id IS NULL
      ORDER BY s.id, t."orderIndex"
    `;

    const gapRows = await db.$queryRaw<GapRow[]>(gapQuery);

    // Build gaps lookup: schoolId → topic names (max 5)
    const gapsMap = new Map<string, string[]>();
    for (const g of gapRows) {
      const existing = gapsMap.get(g.school_id) || [];
      if (existing.length < 5) {
        existing.push(g.topic_name);
        gapsMap.set(g.school_id, existing);
      }
    }

    // Count all gaps per school for "+N more" display
    const allGapsCount = new Map<string, number>();
    for (const g of gapRows) {
      allGapsCount.set(g.school_id, (allGapsCount.get(g.school_id) || 0) + 1);
    }

    // Format and enrich data
    const data = rows.map((r) => {
      const topicsCovered = Number(r.topics_covered);
      const coverageRate = totalTopics > 0
        ? Math.round((topicsCovered / totalTopics) * 100)
        : 0;
      const gaps = gapsMap.get(r.school_id) || [];
      const totalGaps = allGapsCount.get(r.school_id) || 0;

      return {
        id: r.school_id,
        school: r.school_name,
        schoolCode: r.school_code,
        division: r.division_name,
        totalTopics,
        topicsCovered,
        coverageRate,
        totalEntries: Number(r.total_entries),
        teacherCount: Number(r.teacher_count),
        lastActivity: r.last_activity ? r.last_activity.toISOString() : null,
        gaps,
        totalGaps,
      };
    });

    // Sort
    const sortField = sort || "coverageRate";
    const sortDir = order || "asc";
    const multiplier = sortDir === "asc" ? 1 : -1;

    data.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "school": aVal = a.school.toLowerCase(); bVal = b.school.toLowerCase(); break;
        case "division": aVal = a.division.toLowerCase(); bVal = b.division.toLowerCase(); break;
        case "coverageRate": aVal = a.coverageRate; bVal = b.coverageRate; break;
        case "topicsCovered": aVal = a.topicsCovered; bVal = b.topicsCovered; break;
        case "totalEntries": aVal = a.totalEntries; bVal = b.totalEntries; break;
        case "lastActivity":
          aVal = a.lastActivity || "";
          bVal = b.lastActivity || "";
          break;
        default: aVal = a.coverageRate; bVal = b.coverageRate;
      }

      if (aVal < bVal) return -1 * multiplier;
      if (aVal > bVal) return 1 * multiplier;
      return 0;
    });

    const total = data.length;

    // CSV export path — return all rows without pagination
    if (format === "csv") {
      const csv = generateCSV(data, SCHOOL_COVERAGE_CSV_COLUMNS);
      return buildCsvResponse(csv, "school-coverage-report.csv");
    }

    // Cursor-based pagination
    let startIdx = 0;
    if (cursor) {
      const cursorIdx = data.findIndex((r) => r.id === cursor);
      if (cursorIdx >= 0) startIdx = cursorIdx + 1;
    }

    const page = data.slice(startIdx, startIdx + limit + 1);
    const hasNext = page.length > limit;
    const trimmed = hasNext ? page.slice(0, limit) : page;
    const lastItem = trimmed[trimmed.length - 1];

    // Filter options
    const [divisionOptions, subjectOptions, levelOptions] = await Promise.all([
      db.division.findMany({
        where: { regionId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.subject.findMany({
        where: { topics: { some: {} } },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.topic.findMany({
        where: filters.subject ? { subject: { name: filters.subject } } : {},
        select: { classLevel: true },
        distinct: ["classLevel"],
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((s) => s.name),
      level: levelOptions.map((l) => l.classLevel).sort(),
      division: divisionOptions.map((d) => d.name),
    };

    return NextResponse.json({
      data: trimmed,
      pagination: {
        total,
        limit,
        cursor: lastItem && hasNext ? lastItem.id : null,
        hasNext,
        hasPrev: !!cursor,
      },
      filters: responseFilters,
    });
  } catch (error) {
    console.error("Regional reports/school-coverage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school coverage report" },
      { status: 500 }
    );
  }
}
