import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseReportParams,
  buildPagination,
  formatReportResponse,
  generateCSV,
  buildCsvResponse,
} from "@/lib/reports";

const ASSIGNMENTS_CSV_COLUMNS = [
  { key: "teacher", label: "Teacher" },
  { key: "subject", label: "Subject" },
  { key: "class", label: "Class" },
  { key: "level", label: "Level" },
  { key: "division", label: "Division" },
  { key: "periodsPerWeek", label: "Periods/Week" },
];

export const dynamic = "force-dynamic";

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
    const format = request.nextUrl.searchParams.get("format");
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // Build WHERE
    const where: Record<string, unknown> = { schoolId };

    if (filters.subject) {
      where.subject = { name: filters.subject };
    }

    if (filters.level) {
      where.class = { level: filters.level };
    }

    if (search) {
      const searchWords = search.trim().split(/\s+/);
      if (searchWords.length === 1) {
        where.teacher = {
          OR: [
            { firstName: { contains: searchWords[0], mode: "insensitive" } },
            { lastName: { contains: searchWords[0], mode: "insensitive" } },
          ],
        };
      } else {
        where.teacher = {
          AND: searchWords.map((word: string) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" } },
              { lastName: { contains: word, mode: "insensitive" } },
            ],
          })),
        };
      }
    }

    // Count total
    const total = await db.teacherAssignment.count({ where });

    // Build orderBy
    const sortField = sort || "subject";
    const sortDir = order || "asc";

    const directSorts: Record<string, object> = {
      teacher: { teacher: { firstName: sortDir } },
      subject: { subject: { name: sortDir } },
      class: { class: { name: sortDir } },
    };

    const prismaOrderBy = directSorts[sortField] || { subject: { name: "asc" } };
    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);

    // Fetch assignments with period count
    const assignments = await db.teacherAssignment.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        teacher: {
          select: { firstName: true, lastName: true },
        },
        subject: {
          select: { name: true },
        },
        division: {
          select: { name: true },
        },
        class: {
          select: { name: true, level: true },
        },
        _count: {
          select: { periods: true },
        },
      },
    });

    // Format data
    const data = assignments.map((a) => ({
      id: a.id,
      teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
      subject: a.subject.name,
      division: a.division?.name || "—",
      class: a.class.name,
      level: a.class.level,
      periodsPerWeek: a._count.periods,
    }));

    // Sort by periodsPerWeek in-memory if needed
    if (sortField === "periodsPerWeek") {
      data.sort((a, b) =>
        sortDir === "asc"
          ? a.periodsPerWeek - b.periodsPerWeek
          : b.periodsPerWeek - a.periodsPerWeek
      );
    }

    // CSV export path
    if (format === "csv") {
      const csv = generateCSV(data, ASSIGNMENTS_CSV_COLUMNS);
      return buildCsvResponse(csv, "assignments-report.csv");
    }

    // Get filter options
    const [subjectOptions, levelOptions] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.class.findMany({
        where: { schoolId },
        select: { level: true },
        distinct: ["level"],
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      level: levelOptions.map((c) => c.level).sort(),
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Admin reports/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments report" },
      { status: 500 }
    );
  }
}
