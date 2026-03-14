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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    // Teachers who have assignments for classes at the coordinator's levels
    const teacherWhere: Record<string, unknown> = {
      role: "TEACHER",
      assignments: {
        some: {
          schoolId,
          class: { level: { in: levels } },
        },
      },
    };

    if (filters.gender) teacherWhere.gender = filters.gender;

    if (search) {
      const words = search.trim().split(/\s+/);
      if (words.length === 1) {
        teacherWhere.OR = [
          { firstName: { contains: words[0], mode: "insensitive" } },
          { lastName: { contains: words[0], mode: "insensitive" } },
          { teacherCode: { contains: words[0], mode: "insensitive" } },
        ];
      } else {
        teacherWhere.AND = words.map((w: string) => ({
          OR: [
            { firstName: { contains: w, mode: "insensitive" } },
            { lastName: { contains: w, mode: "insensitive" } },
          ],
        }));
      }
    }

    if (filters.subject) {
      teacherWhere.assignments = {
        some: { schoolId, class: { level: { in: levels } }, subject: { name: filters.subject } },
      };
    }

    const total = await db.user.count({ where: teacherWhere });

    const sortDir = order || "desc";
    const paginationArgs = buildPagination(cursor, limit);

    const teachers = await db.user.findMany({
      where: teacherWhere,
      ...paginationArgs,
      orderBy: { firstName: sortDir },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        teacherCode: true,
        assignments: {
          where: { schoolId, class: { level: { in: levels } } },
          select: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        entries: {
          where: { class: { schoolId, level: { in: levels } } },
          select: { date: true },
        },
      },
    });

    const data = teachers.map((t) => {
      const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name)));
      const classes = Array.from(new Set(t.assignments.map((a) => a.class.name)));
      let entriesThisWeek = 0;
      let entriesThisMonth = 0;
      let lastActive: Date | null = null;
      for (const e of t.entries) {
        const d = new Date(e.date);
        if (d >= startOfWeek) entriesThisWeek++;
        if (d >= startOfMonth) entriesThisMonth++;
        if (!lastActive || d > lastActive) lastActive = d;
      }
      return {
        id: t.id,
        teacherId: t.id,
        name: `${t.firstName} ${t.lastName}`,
        gender: t.gender,
        phone: t.phone,
        teacherCode: t.teacherCode,
        subjects: subjects.join(", "),
        classes: classes.join(", "),
        entriesThisWeek,
        entriesThisMonth,
        lastActive: lastActive?.toISOString() || null,
      };
    });

    // Sort computed fields in-memory
    const sortField = sort || "lastActive";
    if (["entriesThisWeek", "entriesThisMonth", "lastActive"].includes(sortField)) {
      data.sort((a, b) => {
        const aVal = sortField === "entriesThisWeek" ? a.entriesThisWeek
          : sortField === "entriesThisMonth" ? a.entriesThisMonth
          : (a.lastActive ?? "");
        const bVal = sortField === "entriesThisWeek" ? b.entriesThisWeek
          : sortField === "entriesThisMonth" ? b.entriesThisMonth
          : (b.lastActive ?? "");
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Filter options
    const subjectOptions = await db.teacherAssignment.findMany({
      where: { schoolId, class: { level: { in: levels } } },
      select: { subject: { select: { name: true } } },
      distinct: ["subjectId"],
    });

    const responseFilters = {
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      gender: ["MALE", "FEMALE"],
    };

    return NextResponse.json(formatReportResponse(data, total, params, responseFilters));
  } catch (error) {
    console.error("coordinator reports/teachers error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers report" }, { status: 500 });
  }
}
