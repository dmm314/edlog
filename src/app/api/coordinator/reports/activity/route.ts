export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams, buildPagination, formatReportResponse } from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const coordinator = await db.levelCoordinator.findFirst({
      where: { userId: user.id, isActive: true },
      select: { levels: true, schoolId: true },
    });
    if (!coordinator) return NextResponse.json({ error: "Not a coordinator" }, { status: 403 });

    const { schoolId, levels } = coordinator;
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    const where: Record<string, unknown> = {
      class: { schoolId, level: { in: levels } },
    };

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    if (filters.status) where.status = filters.status;

    if (filters.class) {
      where.class = { ...(where.class as object), name: filters.class };
    }

    if (filters.subject) {
      where.assignment = { subject: { name: filters.subject } };
    }

    if (filters.lessonMode) where.lessonMode = filters.lessonMode;

    if (filters.teacher) {
      const words = filters.teacher.trim().split(/\s+/);
      if (words.length === 1) {
        where.teacher = {
          OR: [
            { firstName: { contains: words[0], mode: "insensitive" } },
            { lastName: { contains: words[0], mode: "insensitive" } },
          ],
        };
      } else {
        where.teacher = {
          AND: words.map((w: string) => ({
            OR: [
              { firstName: { contains: w, mode: "insensitive" } },
              { lastName: { contains: w, mode: "insensitive" } },
            ],
          })),
        };
      }
    }

    if (search) {
      const words = search.trim().split(/\s+/);
      where.OR = words.length === 1
        ? [
            { teacher: { firstName: { contains: words[0], mode: "insensitive" } } },
            { teacher: { lastName: { contains: words[0], mode: "insensitive" } } },
            { moduleName: { contains: words[0], mode: "insensitive" } },
            { topicText: { contains: words[0], mode: "insensitive" } },
          ]
        : [
            { AND: words.map((w: string) => ({ OR: [
              { teacher: { firstName: { contains: w, mode: "insensitive" } } },
              { teacher: { lastName: { contains: w, mode: "insensitive" } } },
            ]})) },
            { moduleName: { contains: search, mode: "insensitive" } },
            { topicText: { contains: search, mode: "insensitive" } },
          ];
    }

    const total = await db.logbookEntry.count({ where });

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
        teacher: { select: { firstName: true, lastName: true } },
        assignment: { select: { subject: { select: { name: true } } } },
        class: { select: { name: true, level: true } },
      },
    });

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

    // Filter options scoped to coordinator's levels
    const [subjectOptions, classOptions, teacherOptions] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId, class: { level: { in: levels } } },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.class.findMany({
        where: { schoolId, level: { in: levels } },
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
      status: ["SUBMITTED", "VERIFIED", "FLAGGED"],
      engagementLevel: ["LOW", "MEDIUM", "HIGH"],
      lessonMode: ["physical", "digital", "hybrid"],
      bilingual: ["true", "false"],
    };

    return NextResponse.json(formatReportResponse(data, total, params, responseFilters));
  } catch (error) {
    console.error("coordinator reports/activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activity report" }, { status: 500 });
  }
}
