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

    // Build WHERE — assignments at schools in this region
    const where: Record<string, unknown> = {
      school: { regionId },
    };

    if (filters.division) {
      where.school = { ...(where.school as object), division: { name: filters.division } };
    }

    if (filters.school) {
      where.school = { ...(where.school as object), name: filters.school };
    }

    if (filters.subject) {
      where.subject = { name: filters.subject };
    }

    if (filters.level) {
      where.class = { level: filters.level };
    }

    if (search) {
      where.OR = [
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
        { subject: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Count total
    const total = await db.teacherAssignment.count({ where });

    // Build orderBy
    const sortField = sort || "school";
    const sortDir = order || "asc";

    const directSorts: Record<string, object> = {
      teacher: { teacher: { firstName: sortDir } },
      school: { school: { name: sortDir } },
      subject: { subject: { name: sortDir } },
      class: { class: { name: sortDir } },
    };

    const prismaOrderBy = directSorts[sortField] || [
      { school: { name: "asc" } },
      { subject: { name: "asc" } },
    ];
    const paginationArgs = buildPagination(cursor, limit);

    // Fetch assignments
    const assignments = await db.teacherAssignment.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        teacher: { select: { firstName: true, lastName: true } },
        school: {
          select: {
            name: true,
            division: { select: { name: true } },
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true, level: true } },
      },
    });

    // Format data
    const data = assignments.map((a) => ({
      id: a.id,
      teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
      school: a.school.name,
      division: a.school.division?.name || "—",
      subject: a.subject.name,
      class: a.class.name,
      level: a.class.level,
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
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Regional reports/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments report" },
      { status: 500 }
    );
  }
}
