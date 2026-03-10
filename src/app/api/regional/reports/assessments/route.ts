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

    const where: Record<string, unknown> = {
      school: { regionId },
    };

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    if (filters.corrected) where.corrected = filters.corrected === "true";
    if (filters.type) where.type = filters.type;
    if (filters.subject) where.subject = { name: filters.subject };

    if (filters.school) {
      where.school = { ...(where.school as object), name: filters.school };
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
      school: { school: { name: sortDir } },
      subject: { subject: { name: sortDir } },
    };
    const prismaOrderBy = directSorts[sortField] || { date: "desc" };
    const paginationArgs = buildPagination(cursor, limit);

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
        corrected: true,
        totalStudents: true,
        totalPassed: true,
        averageMark: true,
        teacher: { select: { firstName: true, lastName: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        school: { select: { name: true } },
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
        school: a.school.name,
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

    const [schoolOptions, subjectOptions] = await Promise.all([
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
    ]);

    const responseFilters = {
      school: schoolOptions.map((s) => s.name),
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      type: ["sequence_test", "class_test", "assignment", "mock_exam", "exam"],
      corrected: ["true", "false"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Regional reports/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments report" },
      { status: 500 }
    );
  }
}
