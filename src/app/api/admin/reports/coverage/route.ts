import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams } from "@/lib/reports";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface CoverageRow {
  id: string;
  name: string;
  classLevel: string;
  moduleNum: number | null;
  moduleName: string | null;
  orderIndex: number;
  subject_name: string;
  subject_id: string;
  taught_by: string | null;
  times_covered: bigint;
  last_taught: Date | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const schoolId = user.schoolId;
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // Build dynamic WHERE conditions for the Topic query
    const conditions: Prisma.Sql[] = [
      Prisma.sql`ss."schoolId" = ${schoolId}`,
    ];

    if (filters.subject) {
      conditions.push(Prisma.sql`sub.name = ${filters.subject}`);
    }

    if (filters.level) {
      conditions.push(Prisma.sql`t."classLevel" = ${filters.level}`);
    }

    if (search) {
      conditions.push(
        Prisma.sql`(t.name ILIKE ${'%' + search + '%'} OR t."moduleName" ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    // Dual-path coverage query adapted for school scope
    // Path 1: Direct link via _EntryTopics
    // Path 2: Module match (no direct link but moduleName matches)
    const coverageQuery = Prisma.sql`
      WITH direct_coverage AS (
        SELECT
          et."B" as topic_id,
          le."teacherId",
          le.id as entry_id,
          le.date
        FROM "_EntryTopics" et
        JOIN "LogbookEntry" le ON le.id = et."A"
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "Class" c ON c.id = le."classId"
        WHERE c."schoolId" = ${schoolId}
      ),
      module_coverage AS (
        SELECT
          t2.id as topic_id,
          le."teacherId",
          le.id as entry_id,
          le.date
        FROM "Topic" t2
        JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t2."moduleName")
        JOIN "User" u ON u.id = le."teacherId"
        JOIN "Class" c ON c.id = le."classId" AND c.level = t2."classLevel"
        JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id
          AND ta."subjectId" = t2."subjectId"
          AND ta."schoolId" = ${schoolId}
        WHERE c."schoolId" = ${schoolId}
          AND le.id NOT IN (
            SELECT et2."A" FROM "_EntryTopics" et2 WHERE et2."B" = t2.id
          )
      ),
      combined AS (
        SELECT * FROM direct_coverage
        UNION ALL
        SELECT * FROM module_coverage
      ),
      teacher_names AS (
        SELECT
          c.topic_id,
          STRING_AGG(DISTINCT u."firstName" || ' ' || u."lastName", ', ') as teachers
        FROM combined c
        JOIN "User" u ON u.id = c."teacherId"
        GROUP BY c.topic_id
      )
      SELECT
        t.id,
        t.name,
        t."classLevel",
        t."moduleNum",
        t."moduleName",
        t."orderIndex",
        sub.name as subject_name,
        sub.id as subject_id,
        tn.teachers as taught_by,
        COALESCE(agg.entry_count, 0) as times_covered,
        agg.last_date as last_taught
      FROM "Topic" t
      JOIN "Subject" sub ON sub.id = t."subjectId"
      JOIN "SchoolSubject" ss ON ss."subjectId" = sub.id AND ss."schoolId" = ${schoolId}
      LEFT JOIN (
        SELECT topic_id, COUNT(DISTINCT entry_id) as entry_count, MAX(date) as last_date
        FROM combined
        GROUP BY topic_id
      ) agg ON agg.topic_id = t.id
      LEFT JOIN teacher_names tn ON tn.topic_id = t.id
      ${whereClause}
      ORDER BY sub.name ASC, t."orderIndex" ASC
    `;

    const rows = await db.$queryRaw<CoverageRow[]>(coverageQuery);

    // Apply coverage filter
    let filteredRows = rows;
    if (filters.covered === "covered") {
      filteredRows = rows.filter((r) => Number(r.times_covered) > 0);
    } else if (filters.covered === "gaps") {
      filteredRows = rows.filter((r) => Number(r.times_covered) === 0);
    }

    // Apply sorting for non-default sorts
    const sortField = sort || "subject";
    const sortDir = order || "asc";
    const multiplier = sortDir === "asc" ? 1 : -1;

    if (sortField !== "subject") {
      filteredRows.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortField) {
          case "moduleName":
            aVal = a.moduleName || "";
            bVal = b.moduleName || "";
            break;
          case "topic":
            aVal = a.name;
            bVal = b.name;
            break;
          case "timesCovered":
            aVal = Number(a.times_covered);
            bVal = Number(b.times_covered);
            break;
          case "lastTaught":
            aVal = a.last_taught ? a.last_taught.getTime() : 0;
            bVal = b.last_taught ? b.last_taught.getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    }

    const total = filteredRows.length;

    // Apply cursor-based pagination manually
    let startIdx = 0;
    if (cursor) {
      const cursorIdx = filteredRows.findIndex((r) => r.id === cursor);
      if (cursorIdx >= 0) startIdx = cursorIdx + 1;
    }

    const page = filteredRows.slice(startIdx, startIdx + limit + 1);
    const hasNext = page.length > limit;
    const trimmed = hasNext ? page.slice(0, limit) : page;

    // Format data
    const data = trimmed.map((r) => ({
      id: r.id,
      subject: r.subject_name,
      level: r.classLevel,
      moduleNum: r.moduleNum,
      moduleName: r.moduleName || "—",
      topic: r.name,
      orderIndex: r.orderIndex,
      taughtBy: r.taught_by || "—",
      timesCovered: Number(r.times_covered),
      lastTaught: r.last_taught ? r.last_taught.toISOString() : null,
      covered: Number(r.times_covered) > 0,
    }));

    // Get filter options
    const [subjectOptions, levelOptions] = await Promise.all([
      db.schoolSubject.findMany({
        where: { schoolId },
        select: { subject: { select: { name: true } } },
      }),
      db.topic.findMany({
        where: {
          subject: { schools: { some: { schoolId } } },
        },
        select: { classLevel: true },
        distinct: ["classLevel"],
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((s) => s.subject.name).sort(),
      level: levelOptions.map((l) => l.classLevel).sort(),
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
    console.error("Admin reports/coverage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coverage report" },
      { status: 500 }
    );
  }
}
