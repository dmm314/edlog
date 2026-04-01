import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams, generateCSV, buildCsvResponse } from "@/lib/reports";
import { Prisma } from "@prisma/client";

const COVERAGE_CSV_COLUMNS = [
  { key: "subject", label: "Subject" },
  { key: "level", label: "Level" },
  { key: "moduleNum", label: "Module #" },
  { key: "moduleName", label: "Module" },
  { key: "topic", label: "Topic" },
  { key: "schoolsCovering", label: "Schools Covering" },
  { key: "totalSchools", label: "Total Schools" },
  { key: "coverageRate", label: "Coverage %" },
  { key: "totalEntries", label: "Total Entries" },
  { key: "teachersCovering", label: "Teachers Covering" },
  { key: "lastTaught", label: "Last Taught" },
];

export const dynamic = "force-dynamic";

interface CoverageRow {
  id: string;
  name: string;
  classLevel: string;
  moduleNum: number | null;
  moduleName: string | null;
  orderIndex: number;
  subject_name: string;
  subject_code: string;
  schools_covering: bigint;
  total_entries: bigint;
  teachers_covering: bigint;
  last_taught: Date | null;
  has_direct: boolean | null;
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

    // Build dynamic WHERE conditions for the final SELECT
    const topicConditions: Prisma.Sql[] = [];

    if (filters.subject) {
      topicConditions.push(Prisma.sql`sub.name = ${filters.subject}`);
    }

    if (filters.level) {
      topicConditions.push(Prisma.sql`t."classLevel" = ${filters.level}`);
    }

    if (filters.module) {
      topicConditions.push(Prisma.sql`t."moduleName" ILIKE ${'%' + filters.module + '%'}`);
    }

    if (search) {
      topicConditions.push(
        Prisma.sql`(t.name ILIKE ${'%' + search + '%'} OR t."moduleName" ILIKE ${'%' + search + '%'})`
      );
    }

    const topicWhere = topicConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(topicConditions, ' AND ')}`
      : Prisma.empty;

    // Optional division filter scopes the coverage CTEs
    const divisionJoin = filters.division
      ? Prisma.sql`JOIN "Division" div ON div.id = s."divisionId" AND div.name = ${filters.division}`
      : Prisma.empty;

    // Dual-path coverage query for regional scope
    // Path 1 (direct): Entry linked to Topic via _EntryTopics
    // Path 2 (module match): moduleName match + classLevel match + teacher has assignment for subject
    // Only entries NOT already in Path 1 are counted in Path 2
    const coverageQuery = Prisma.sql`
      WITH direct_coverage AS (
        SELECT
          et."B" as topic_id,
          le."teacherId",
          u."schoolId",
          le.date,
          le.id as entry_id,
          'direct' as match_source
        FROM "_EntryTopics" et
        JOIN "LogbookEntry" le ON le.id = et."A"
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        ${divisionJoin}
        WHERE s."regionId" = ${regionId}
      ),
      module_coverage AS (
        SELECT
          t2.id as topic_id,
          le."teacherId",
          u."schoolId",
          le.date,
          le.id as entry_id,
          'module' as match_source
        FROM "Topic" t2
        JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t2."moduleName")
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "School" s ON s.id = u."schoolId"
        ${divisionJoin}
        JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id
          AND ta."subjectId" = t2."subjectId"
          AND ta."schoolId" = s.id
        JOIN "Class" c ON c.id = le."classId" AND c.level = t2."classLevel"
        WHERE s."regionId" = ${regionId}
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
        t.id,
        t.name,
        t."classLevel",
        t."moduleNum",
        t."moduleName",
        t."orderIndex",
        sub.name as subject_name,
        sub.code as subject_code,
        COUNT(DISTINCT c."schoolId") as schools_covering,
        COUNT(DISTINCT c.entry_id) as total_entries,
        COUNT(DISTINCT c."teacherId") as teachers_covering,
        MAX(c.date) as last_taught,
        BOOL_OR(c.match_source = 'direct') as has_direct
      FROM "Topic" t
      JOIN "Subject" sub ON sub.id = t."subjectId"
      LEFT JOIN combined c ON c.topic_id = t.id
      ${topicWhere}
      GROUP BY t.id, t.name, t."classLevel", t."moduleNum", t."moduleName", t."orderIndex", sub.name, sub.code
      ORDER BY sub.name ASC, t."classLevel" ASC, t."orderIndex" ASC
    `;

    const rows = await db.$queryRaw<CoverageRow[]>(coverageQuery);

    // Compute totalSchools per topic: schools in region that have this subject
    // in SchoolSubject AND have at least one Class at this classLevel.
    // We batch this query to avoid N+1.
    const totalSchoolsQuery = await db.$queryRaw<
      { subject_name: string; classLevel: string; total_schools: bigint }[]
    >(Prisma.sql`
      SELECT sub.name as subject_name, c."level" as "classLevel", COUNT(DISTINCT s.id) as total_schools
      FROM "School" s
      JOIN "SchoolSubject" ss ON ss."schoolId" = s.id
      JOIN "Subject" sub ON sub.id = ss."subjectId"
      JOIN "Class" c ON c."schoolId" = s.id
      WHERE s."regionId" = ${regionId}
      GROUP BY sub.name, c."level"
    `);

    // Build lookup: "subjectName|classLevel" → totalSchools
    const totalSchoolsMap = new Map<string, number>();
    for (const row of totalSchoolsQuery) {
      totalSchoolsMap.set(`${row.subject_name}|${row.classLevel}`, Number(row.total_schools));
    }

    // Apply coverage filter
    type EnrichedRow = CoverageRow & { totalSchools: number; coverageRate: number };
    let enriched: EnrichedRow[] = rows.map((r) => {
      const totalSchools = totalSchoolsMap.get(`${r.subject_name}|${r.classLevel}`) || 0;
      const schoolsCovering = Number(r.schools_covering);
      const coverageRate = totalSchools > 0
        ? Math.round((schoolsCovering / totalSchools) * 100)
        : 0;
      return { ...r, totalSchools, coverageRate };
    });

    if (filters.covered === "covered") {
      enriched = enriched.filter((r) => Number(r.schools_covering) > 0);
    } else if (filters.covered === "gaps") {
      enriched = enriched.filter(
        (r) => Number(r.schools_covering) < r.totalSchools || Number(r.schools_covering) === 0
      );
    }

    // Apply sorting for non-default sorts
    const sortField = sort || "subject";
    const sortDir = order || "asc";
    const multiplier = sortDir === "asc" ? 1 : -1;

    if (sortField !== "subject") {
      enriched.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortField) {
          case "level": aVal = a.classLevel; bVal = b.classLevel; break;
          case "moduleName": aVal = a.moduleName || ""; bVal = b.moduleName || ""; break;
          case "topic": aVal = a.name; bVal = b.name; break;
          case "schoolsCovering": aVal = Number(a.schools_covering); bVal = Number(b.schools_covering); break;
          case "coverageRate": aVal = a.coverageRate; bVal = b.coverageRate; break;
          case "totalEntries": aVal = Number(a.total_entries); bVal = Number(b.total_entries); break;
          case "lastTaught":
            aVal = a.last_taught ? a.last_taught.getTime() : 0;
            bVal = b.last_taught ? b.last_taught.getTime() : 0;
            break;
          default: return 0;
        }

        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    }

    const total = enriched.length;

    // CSV export path — return all rows without pagination
    if (format === "csv") {
      const csvData = enriched.map((r) => ({
        id: r.id,
        subject: r.subject_name,
        level: r.classLevel,
        moduleNum: r.moduleNum,
        moduleName: r.moduleName || "—",
        topic: r.name,
        schoolsCovering: Number(r.schools_covering),
        totalSchools: r.totalSchools,
        coverageRate: r.coverageRate,
        totalEntries: Number(r.total_entries),
        teachersCovering: Number(r.teachers_covering),
        lastTaught: r.last_taught ? r.last_taught.toISOString() : null,
      }));
      const csv = generateCSV(csvData, COVERAGE_CSV_COLUMNS);
      return buildCsvResponse(csv, "coverage-report.csv");
    }

    // Cursor-based pagination (manual)
    let startIdx = 0;
    if (cursor) {
      const cursorIdx = enriched.findIndex((r) => r.id === cursor);
      if (cursorIdx >= 0) startIdx = cursorIdx + 1;
    }

    const page = enriched.slice(startIdx, startIdx + limit + 1);
    const hasNext = page.length > limit;
    const trimmed = hasNext ? page.slice(0, limit) : page;

    // Format data
    const data = trimmed.map((r) => ({
      id: r.id,
      subject: r.subject_name,
      subjectCode: r.subject_code,
      level: r.classLevel,
      moduleNum: r.moduleNum,
      moduleName: r.moduleName || "—",
      topic: r.name,
      orderIndex: r.orderIndex,
      schoolsCovering: Number(r.schools_covering),
      totalSchools: r.totalSchools,
      coverageRate: r.coverageRate,
      totalEntries: Number(r.total_entries),
      teachersCovering: Number(r.teachers_covering),
      lastTaught: r.last_taught ? r.last_taught.toISOString() : null,
      matchType: Number(r.total_entries) === 0 ? "none" : r.has_direct ? "direct" : "module",
    }));

    // Filter options
    const [subjectOptions, levelOptions, divisionOptions, moduleOptions] = await Promise.all([
      db.subject.findMany({
        where: { topics: { some: {} } },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.topic.findMany({
        select: { classLevel: true },
        distinct: ["classLevel"],
      }),
      db.division.findMany({
        where: { regionId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.topic.findMany({
        where: filters.subject ? { subject: { name: filters.subject } } : {},
        select: { moduleName: true },
        distinct: ["moduleName"],
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((s) => s.name),
      level: levelOptions.map((l) => l.classLevel).sort(),
      division: divisionOptions.map((d) => d.name),
      module: moduleOptions.filter((m) => m.moduleName).map((m) => m.moduleName!).sort(),
      covered: ["all", "covered", "gaps"],
    };

    const lastItem = trimmed[trimmed.length - 1];

    return NextResponse.json({
      data,
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
    console.error("Regional reports/coverage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coverage report" },
      { status: 500 }
    );
  }
}
