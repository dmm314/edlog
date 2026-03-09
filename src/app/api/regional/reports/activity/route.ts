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
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const regionId = user.regionId;
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // Build WHERE — entries where teacher's school is in this region
    const where: Record<string, unknown> = {
      class: { school: { regionId } },
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

    if (filters.division) {
      where.class = {
        ...(where.class as object),
        school: { regionId, division: { name: filters.division } },
      };
    }

    if (filters.school) {
      const schoolFilter = (where.class as Record<string, unknown>).school as Record<string, unknown> || { regionId };
      (where.class as Record<string, unknown>).school = { ...schoolFilter, name: filters.school };
    }

    if (filters.level) {
      where.class = { ...(where.class as object), level: filters.level };
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
      school: { class: { school: { name: sortDir } } },
      subject: { assignment: { subject: { name: sortDir } } },
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
        moduleName: true,
        topicText: true,
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
          select: {
            name: true,
            level: true,
            school: {
              select: {
                name: true,
                division: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Format data
    const data = entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      teacher: `${e.teacher.firstName} ${e.teacher.lastName}`,
      school: e.class.school.name,
      division: e.class.school.division?.name || "—",
      subject: e.assignment?.subject.name || "—",
      class: e.class.name,
      level: e.class.level,
      moduleName: e.moduleName || "—",
      topicText: e.topicText || "—",
      period: e.period,
      status: e.status,
      lessonMode: e.lessonMode || "physical",
      bilingual: e.bilingualActivity ? "Yes" : "No",
    }));

    // Filter options
    const [divisionOptions, schoolOptions, subjectOptions, levelOptions] = await Promise.all([
      db.division.findMany({
        where: { regionId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.school.findMany({
        where: { regionId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      db.teacherAssignment.findMany({
        where: { school: { regionId } },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.class.findMany({
        where: { school: { regionId } },
        select: { level: true },
        distinct: ["level"],
      }),
    ]);

    const responseFilters = {
      division: divisionOptions.map((d) => d.name),
      school: schoolOptions.map((s) => s.name),
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      level: levelOptions.map((c) => c.level).sort(),
      status: ["SUBMITTED", "VERIFIED", "FLAGGED"],
      lessonMode: ["physical", "digital", "hybrid"],
      bilingual: ["true", "false"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Regional reports/activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity report" },
      { status: 500 }
    );
  }
}
