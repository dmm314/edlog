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
  { key: "teacherCode", label: "Code" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "subjects", label: "Subjects" },
  { key: "classes", label: "Classes" },
  { key: "entriesThisWeek", label: "Entries This Week" },
  { key: "entriesThisMonth", label: "Entries This Month" },
  { key: "lastActive", label: "Last Active" },
  { key: "status", label: "Status" },
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

    // Build date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    // Build WHERE for TeacherSchool
    const tsWhere: Record<string, unknown> = {
      schoolId,
    };

    if (filters.status) {
      tsWhere.status = filters.status;
    }

    // We need to filter at the teacher level for subject/class/gender/search
    const teacherWhere: Record<string, unknown> = {
      role: "TEACHER",
    };

    if (filters.gender) {
      teacherWhere.gender = filters.gender;
    }

    if (search) {
      const searchWords = search.trim().split(/\s+/);
      if (searchWords.length === 1) {
        teacherWhere.OR = [
          { firstName: { contains: searchWords[0], mode: "insensitive" } },
          { lastName: { contains: searchWords[0], mode: "insensitive" } },
          { teacherCode: { contains: searchWords[0], mode: "insensitive" } },
        ];
      } else {
        teacherWhere.AND = searchWords.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
          ],
        }));
      }
    }

    if (filters.subject) {
      teacherWhere.assignments = {
        some: {
          schoolId,
          subject: { name: filters.subject },
        },
      };
    }

    if (filters.class) {
      teacherWhere.assignments = {
        some: {
          schoolId,
          class: { name: filters.class },
          ...(filters.subject ? { subject: { name: filters.subject } } : {}),
        },
      };
    }

    tsWhere.teacher = teacherWhere;

    // Count total
    const total = await db.teacherSchool.count({ where: tsWhere });

    // Determine sort
    const sortField = sort || "lastActive";
    const sortDir = order || "desc";

    // For computed fields, we fetch all and sort in-memory
    // For direct fields, use Prisma orderBy
    const directSorts: Record<string, object> = {
      firstName: { teacher: { firstName: sortDir } },
    };

    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);
    const prismaOrderBy = directSorts[sortField] || { createdAt: "desc" };

    // Fetch teacher schools with all needed data
    const teacherSchools = await db.teacherSchool.findMany({
      where: tsWhere,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        status: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            phone: true,
            teacherCode: true,
            assignments: {
              where: { schoolId },
              select: {
                subject: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
            entries: {
              where: {
                class: { schoolId },
              },
              select: {
                date: true,
              },
            },
          },
        },
      },
    });

    // Compute aggregated data
    const data = teacherSchools.map((ts) => {
      const t = ts.teacher;
      const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name)));
      const classes = Array.from(new Set(t.assignments.map((a) => a.class.name)));

      let entriesThisWeek = 0;
      let entriesThisMonth = 0;
      let lastActive: Date | null = null;

      for (const entry of t.entries) {
        const d = new Date(entry.date);
        if (d >= startOfWeek) entriesThisWeek++;
        if (d >= startOfMonth) entriesThisMonth++;
        if (!lastActive || d > lastActive) lastActive = d;
      }

      return {
        id: ts.id,
        teacherId: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        name: `${t.firstName} ${t.lastName}`,
        gender: t.gender,
        phone: t.phone,
        teacherCode: t.teacherCode,
        subjects: subjects.join(", "),
        classes: classes.join(", "),
        entriesThisWeek,
        entriesThisMonth,
        lastActive: lastActive?.toISOString() || null,
        status: ts.status,
      };
    });

    // Sort computed fields in-memory
    if (sortField === "entriesThisWeek" || sortField === "entriesThisMonth" || sortField === "lastActive") {
      data.sort((a, b) => {
        let aVal: number | string | null;
        let bVal: number | string | null;

        if (sortField === "entriesThisWeek") {
          aVal = a.entriesThisWeek;
          bVal = b.entriesThisWeek;
        } else if (sortField === "entriesThisMonth") {
          aVal = a.entriesThisMonth;
          bVal = b.entriesThisMonth;
        } else {
          aVal = a.lastActive ?? "";
          bVal = b.lastActive ?? "";
        }

        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // CSV export path
    if (format === "csv") {
      const csv = generateCSV(data, TEACHERS_CSV_COLUMNS);
      return buildCsvResponse(csv, "teachers-report.csv");
    }

    // Get filter options
    const [subjectOptions, classOptions] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId },
        select: { subject: { select: { name: true } } },
        distinct: ["subjectId"],
      }),
      db.teacherAssignment.findMany({
        where: { schoolId },
        select: { class: { select: { name: true } } },
        distinct: ["classId"],
      }),
    ]);

    const responseFilters = {
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      class: classOptions.map((a) => a.class.name).sort(),
      gender: ["MALE", "FEMALE"],
      status: ["ACTIVE", "PENDING", "REMOVED"],
    };

    return NextResponse.json(
      formatReportResponse(data, total, params, responseFilters)
    );
  } catch (error) {
    console.error("Admin reports/teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers report" },
      { status: 500 }
    );
  }
}
