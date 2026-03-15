import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams, generateCSV, buildCsvResponse } from "@/lib/reports";
import { Prisma } from "@prisma/client";

const SCHOOLS_CSV_COLUMNS = [
  { key: "name", label: "School" },
  { key: "code", label: "Code" },
  { key: "division", label: "Division" },
  { key: "schoolType", label: "Type" },
  { key: "principalName", label: "Principal" },
  { key: "status", label: "Status" },
  { key: "teacherCount", label: "Teachers" },
  { key: "entriesThisWeek", label: "Entries This Week" },
  { key: "entriesThisMonth", label: "Entries This Month" },
  { key: "complianceRate", label: "Compliance %" },
];

export const dynamic = "force-dynamic";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  principalName: string | null;
  status: string;
  division_name: string;
  teacher_count: bigint;
  entries_this_week: bigint;
  entries_this_month: bigint;
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

    // Date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate weekdays elapsed this month for compliance rate
    // Compliance = entriesThisMonth / (teacherCount * weekdaysElapsed)
    // This is a simplified proxy: assumes each teacher should log once per weekday.
    let weekdaysElapsed = 0;
    const cursor_date = new Date(startOfMonth);
    while (cursor_date <= now) {
      const dow = cursor_date.getDay();
      if (dow >= 1 && dow <= 5) weekdaysElapsed++;
      cursor_date.setDate(cursor_date.getDate() + 1);
    }
    if (weekdaysElapsed === 0) weekdaysElapsed = 1; // avoid division by zero

    // Build WHERE conditions
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s."regionId" = ${regionId}`,
    ];

    if (filters.division) {
      conditions.push(Prisma.sql`d.name = ${filters.division}`);
    }
    if (filters.type) {
      conditions.push(Prisma.sql`s."schoolType" = ${filters.type}`);
    }
    if (filters.status) {
      conditions.push(Prisma.sql`s.status = ${filters.status}::"SchoolStatus"`);
    }
    if (search) {
      conditions.push(
        Prisma.sql`(s.name ILIKE ${'%' + search + '%'} OR s.code ILIKE ${'%' + search + '%'} OR s."principalName" ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    // Use subqueries for counts — no N+1
    const query = Prisma.sql`
      SELECT
        s.id,
        s.name,
        s.code,
        s."schoolType",
        s."principalName",
        s.status::text,
        d.name as division_name,
        (SELECT COUNT(*) FROM "User" u WHERE u.role = 'TEACHER' AND (u."schoolId" = s.id OR u.id IN (SELECT ts."teacherId" FROM "TeacherSchool" ts WHERE ts."schoolId" = s.id AND ts.status = 'ACTIVE'))) as teacher_count,
        (SELECT COUNT(*) FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId" WHERE c."schoolId" = s.id AND le.date >= ${startOfWeek}) as entries_this_week,
        (SELECT COUNT(*) FROM "LogbookEntry" le JOIN "Class" c ON c.id = le."classId" WHERE c."schoolId" = s.id AND le.date >= ${startOfMonth}) as entries_this_month
      FROM "School" s
      JOIN "Division" d ON d.id = s."divisionId"
      ${whereClause}
    `;

    const rows = await db.$queryRaw<SchoolRow[]>(query);

    // Compute compliance rate and format
    const data = rows.map((r) => {
      const teacherCount = Number(r.teacher_count);
      const entriesThisMonth = Number(r.entries_this_month);
      const entriesThisWeek = Number(r.entries_this_week);
      // Compliance = entries / (teachers * weekdays). Capped at 100%.
      const expectedEntries = teacherCount * weekdaysElapsed;
      const complianceRate = expectedEntries > 0
        ? Math.min(Math.round((entriesThisMonth / expectedEntries) * 100), 100)
        : 0;

      return {
        id: r.id,
        name: r.name,
        code: r.code,
        schoolType: r.schoolType || "—",
        principalName: r.principalName || "—",
        status: r.status,
        division: r.division_name,
        teacherCount,
        entriesThisWeek,
        entriesThisMonth,
        complianceRate,
      };
    });

    // Sort
    const sortField = sort || "complianceRate";
    const sortDir = order || "asc";
    const multiplier = sortDir === "asc" ? 1 : -1;

    data.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "division": aVal = a.division.toLowerCase(); bVal = b.division.toLowerCase(); break;
        case "teacherCount": aVal = a.teacherCount; bVal = b.teacherCount; break;
        case "entriesThisWeek": aVal = a.entriesThisWeek; bVal = b.entriesThisWeek; break;
        case "entriesThisMonth": aVal = a.entriesThisMonth; bVal = b.entriesThisMonth; break;
        case "complianceRate": aVal = a.complianceRate; bVal = b.complianceRate; break;
        default: aVal = a.complianceRate; bVal = b.complianceRate;
      }

      if (aVal < bVal) return -1 * multiplier;
      if (aVal > bVal) return 1 * multiplier;
      return 0;
    });

    const total = data.length;

    // CSV export path — return all rows without pagination
    if (format === "csv") {
      const csv = generateCSV(data, SCHOOLS_CSV_COLUMNS);
      return buildCsvResponse(csv, "schools-report.csv");
    }

    // Cursor-based pagination (manual since raw SQL)
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
    const [divisionOptions, typeOptions] = await Promise.all([
      db.division.findMany({
        where: { regionId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.school.findMany({
        where: { regionId, schoolType: { not: null } },
        select: { schoolType: true },
        distinct: ["schoolType"],
      }),
    ]);

    const responseFilters = {
      division: divisionOptions.map((d) => d.name),
      type: typeOptions.map((t) => t.schoolType!).sort(),
      status: ["ACTIVE", "PENDING", "SUSPENDED"],
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
    console.error("Regional reports/schools error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools report" },
      { status: 500 }
    );
  }
}
