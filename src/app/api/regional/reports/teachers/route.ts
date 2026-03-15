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

const TEACHERS_CSV_COLUMNS = [
  { key: "name", label: "Teacher Name" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "school", label: "School" },
  { key: "division", label: "Division" },
  { key: "subjects", label: "Subjects" },
  { key: "classes", label: "Classes" },
  { key: "entriesThisMonth", label: "Entries This Month" },
  { key: "lastActive", label: "Last Active" },
];

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
    const format = request.nextUrl.searchParams.get("format");
    const params = parseReportParams(request.nextUrl.searchParams);
    const { search, sort, order, cursor, limit, filters } = params;

    // Date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build WHERE — teachers at schools in this region (direct or via TeacherSchool invitation)
    const where: Record<string, unknown> = {
      role: "TEACHER",
      OR: [
        { school: { regionId } },
        { teacherSchools: { some: { school: { regionId }, status: "ACTIVE" } } },
      ],
    };

    if (filters.division) {
      where.school = { ...(where.school as object), division: { name: filters.division } };
    }

    if (filters.school) {
      where.school = { ...(where.school as object), name: filters.school };
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.subject) {
      where.assignments = {
        some: { subject: { name: filters.subject } },
      };
    }

    if (filters.level) {
      where.assignments = {
        some: {
          class: { level: filters.level },
          ...(filters.subject ? { subject: { name: filters.subject } } : {}),
        },
      };
    }

    if (search) {
      const searchWords = search.trim().split(/\s+/);
      if (searchWords.length === 1) {
        where.OR = [
          { firstName: { contains: searchWords[0], mode: "insensitive" } },
          { lastName: { contains: searchWords[0], mode: "insensitive" } },
        ];
      } else {
        where.AND = searchWords.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
          ],
        }));
      }
    }

    // Count total
    const total = await db.user.count({ where });

    // Build orderBy
    const sortField = sort || "lastActive";
    const sortDir = order || "desc";

    const directSorts: Record<string, object> = {
      name: { firstName: sortDir },
      school: { school: { name: sortDir } },
    };

    const prismaOrderBy = directSorts[sortField] || { createdAt: "desc" };
    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);

    // Fetch teachers with aggregated data
    const teachers = await db.user.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        school: {
          select: {
            name: true,
            division: { select: { name: true } },
          },
        },
        assignments: {
          select: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        entries: {
          where: { date: { gte: startOfMonth } },
          select: { date: true },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    // Compute aggregated fields
    const data = teachers.map((t) => {
      const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name)));
      const classes = Array.from(new Set(t.assignments.map((a) => a.class.name)));

      let lastActive: Date | null = null;
      for (const entry of t.entries) {
        const d = new Date(entry.date);
        if (!lastActive || d > lastActive) lastActive = d;
      }

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        name: `${t.firstName} ${t.lastName}`,
        gender: t.gender,
        phone: t.phone,
        school: t.school?.name || "—",
        division: t.school?.division?.name || "—",
        subjects: subjects.join(", "),
        classes: classes.join(", "),
        entriesThisMonth: t.entries.length,
        lastActive: lastActive?.toISOString() || null,
      };
    });

    // Sort computed fields in-memory
    if (sortField === "entriesThisMonth" || sortField === "lastActive") {
      const multiplier = sortDir === "asc" ? 1 : -1;
      data.sort((a, b) => {
        const aVal = sortField === "entriesThisMonth" ? a.entriesThisMonth : (a.lastActive ?? "");
        const bVal = sortField === "entriesThisMonth" ? b.entriesThisMonth : (b.lastActive ?? "");
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    }

    // CSV export path
    if (format === "csv") {
      const csv = generateCSV(data, TEACHERS_CSV_COLUMNS);
      return buildCsvResponse(csv, "teachers-report.csv");
    }

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
      gender: ["MALE", "FEMALE"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Regional reports/teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers report" },
      { status: 500 }
    );
  }
}
