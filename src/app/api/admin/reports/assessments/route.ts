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

const ASSESSMENTS_CSV_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "teacher", label: "Teacher" },
  { key: "subject", label: "Subject" },
  { key: "class", label: "Class" },
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "corrected", label: "Corrected" },
  { key: "totalStudents", label: "Total Students" },
  { key: "passRate", label: "Pass Rate" },
  { key: "averageMark", label: "Average Mark" },
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

    const where: Record<string, unknown> = { schoolId };

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    if (filters.corrected) {
      where.corrected = filters.corrected === "true";
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.subject) {
      where.subject = { name: filters.subject };
    }

    if (filters.class) {
      where.class = { name: filters.class };
    }

    if (filters.teacher) {
      const filterWords = filters.teacher.trim().split(/\s+/);
      if (filterWords.length === 1) {
        where.teacher = {
          OR: [
            { firstName: { contains: filterWords[0], mode: "insensitive" } },
            { lastName: { contains: filterWords[0], mode: "insensitive" } },
          ],
        };
      } else {
        where.teacher = {
          AND: filterWords.map((word: string) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" } },
              { lastName: { contains: word, mode: "insensitive" } },
            ],
          })),
        };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const total = await db.assessment.count({ where });

    const sortField = sort || "date";
    const sortDir = order || "desc";
    const directSorts: Record<string, object> = {
      date: { date: sortDir },
      teacher: { teacher: { firstName: sortDir } },
      subject: { subject: { name: sortDir } },
      class: { class: { name: sortDir } },
    };
    const prismaOrderBy = directSorts[sortField] || { date: "desc" };
    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);

    const assessments = await db.assessment.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        totalMarks: true,
        passMark: true,
        corrected: true,
        totalStudents: true,
        totalPassed: true,
        averageMark: true,
        teacher: { select: { firstName: true, lastName: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    const data = assessments.map((a) => {
      const passRate = a.corrected && a.totalStudents && a.totalPassed != null
        ? Math.round((a.totalPassed / a.totalStudents) * 100)
        : null;
      return {
        id: a.id,
        date: a.date.toISOString(),
        teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
        subject: a.subject.name,
        class: a.class.name,
        title: a.title,
        type: a.type.replace("_", " "),
        corrected: a.corrected ? "Yes" : "No",
        totalStudents: a.totalStudents,
        passRate: passRate != null ? `${passRate}%` : "—",
        averageMark: a.averageMark != null ? `${a.averageMark}/${a.totalMarks}` : "—",
      };
    });

    // CSV export path
    if (format === "csv") {
      const csv = generateCSV(data, ASSESSMENTS_CSV_COLUMNS);
      return buildCsvResponse(csv, "assessments-report.csv");
    }

    const [subjectOptions, classOptions, teacherOptions] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.class.findMany({
        where: { schoolId },
        select: { name: true },
        distinct: ["id"],
      }),
      db.teacherSchool.findMany({
        where: { schoolId, status: "ACTIVE" },
        select: { teacher: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      class: Array.from(new Set(classOptions.map((c) => c.name))).sort(),
      teacher: teacherOptions.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).sort(),
      type: ["sequence_test", "class_test", "assignment", "mock_exam", "exam"],
      corrected: ["true", "false"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Admin reports/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments report" },
      { status: 500 }
    );
  }
}
