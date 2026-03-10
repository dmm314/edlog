import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseReportParams,
  buildPagination,
  formatReportResponse,
} from "@/lib/reports";

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
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // Build WHERE — entries where class belongs to this school
    const where: Record<string, unknown> = {
      class: { schoolId },
    };

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.level) {
      where.class = { ...(where.class as object), level: filters.level };
    }

    if (filters.class) {
      where.class = { ...(where.class as object), name: filters.class };
    }

    if (filters.subject) {
      where.assignment = { subject: { name: filters.subject } };
    }

    if (filters.lessonMode) {
      where.lessonMode = filters.lessonMode;
    }

    if (filters.bilingual) {
      where.bilingualActivity = filters.bilingual === "true";
    }

    if (filters.familyOfSituation) {
      where.familyOfSituation = filters.familyOfSituation;
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
      const searchWords = search.trim().split(/\s+/);
      if (searchWords.length === 1) {
        where.OR = [
          { teacher: { firstName: { contains: searchWords[0], mode: "insensitive" } } },
          { teacher: { lastName: { contains: searchWords[0], mode: "insensitive" } } },
          { moduleName: { contains: searchWords[0], mode: "insensitive" } },
          { topicText: { contains: searchWords[0], mode: "insensitive" } },
        ];
      } else {
        where.OR = [
          { AND: searchWords.map((word: string) => ({
            OR: [
              { teacher: { firstName: { contains: word, mode: "insensitive" } } },
              { teacher: { lastName: { contains: word, mode: "insensitive" } } },
            ],
          })) },
          { moduleName: { contains: search, mode: "insensitive" } },
          { topicText: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    // Count total
    const total = await db.logbookEntry.count({ where });

    // Build orderBy
    const sortField = sort || "date";
    const sortDir = order || "desc";

    const directSorts: Record<string, object> = {
      date: { date: sortDir },
      teacher: { teacher: { firstName: sortDir } },
      subject: { assignment: { subject: { name: sortDir } } },
      class: { class: { name: sortDir } },
      period: { period: sortDir },
      studentAttendance: { studentAttendance: sortDir },
    };

    const prismaOrderBy = directSorts[sortField] || { date: "desc" };
    const paginationArgs = buildPagination(cursor, limit);

    // Fetch entries
    const entries = await db.logbookEntry.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        date: true,
        period: true,
        status: true,
        engagementLevel: true,
        studentAttendance: true,
        moduleName: true,
        topicText: true,
        familyOfSituation: true,
        lessonMode: true,
        bilingualActivity: true,
        teacher: {
          select: { firstName: true, lastName: true },
        },
        assignment: {
          select: {
            subject: { select: { name: true } },
          },
        },
        class: {
          select: { name: true, level: true },
        },
      },
    });

    // Format data
    const data = entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      teacher: `${e.teacher.firstName} ${e.teacher.lastName}`,
      subject: e.assignment?.subject.name || "—",
      class: e.class.name,
      level: e.class.level,
      moduleName: e.moduleName || "—",
      topicText: e.topicText || "—",
      familyOfSituation: e.familyOfSituation || "—",
      period: e.period,
      status: e.status,
      engagementLevel: e.engagementLevel || "—",
      studentAttendance: e.studentAttendance,
      lessonMode: e.lessonMode || "physical",
      bilingual: e.bilingualActivity ? "Yes" : "No",
    }));

    // Get filter options
    const [subjectOptions, classOptions, teacherOptions] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.class.findMany({
        where: { schoolId },
        select: { name: true, level: true },
        distinct: ["id"],
      }),
      db.teacherSchool.findMany({
        where: { schoolId, status: "ACTIVE" },
        select: { teacher: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const familyOptions = await db.logbookEntry.findMany({
      where: { class: { schoolId }, familyOfSituation: { not: null } },
      select: { familyOfSituation: true },
      distinct: ["familyOfSituation"],
    });

    const responseFilters = {
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      class: Array.from(new Set(classOptions.map((c) => c.name))).sort(),
      level: Array.from(new Set(classOptions.map((c) => c.level))).sort(),
      teacher: teacherOptions.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).sort(),
      familyOfSituation: familyOptions.map((f) => f.familyOfSituation!).filter(Boolean).sort(),
      status: ["SUBMITTED", "VERIFIED", "FLAGGED"],
      engagementLevel: ["LOW", "MEDIUM", "HIGH"],
      lessonMode: ["physical", "digital", "hybrid"],
      bilingual: ["true", "false"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Admin reports/activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity report" },
      { status: 500 }
    );
  }
}
