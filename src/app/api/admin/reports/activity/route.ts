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
import { getEntryCompleteness } from "@/lib/entry-completeness";

const ACTIVITY_CSV_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "teacher", label: "Teacher" },
  { key: "subject", label: "Subject" },
  { key: "class", label: "Class" },
  { key: "level", label: "Level" },
  { key: "period", label: "Period" },
  { key: "duration", label: "Duration (min)" },
  { key: "moduleName", label: "Module" },
  { key: "topicText", label: "Topic" },
  { key: "topicNames", label: "Curriculum Topics" },
  { key: "familyOfSituation", label: "Family of Situation" },
  { key: "lessonMode", label: "Lesson Mode" },
  { key: "bilingual", label: "Bilingual" },
  { key: "integrationActivity", label: "Integration Activity" },
  { key: "integrationLevel", label: "Integration Level" },
  { key: "integrationStatus", label: "Integration Status" },
  { key: "engagementLevel", label: "Engagement" },
  { key: "studentAttendance", label: "Student Attendance" },
  { key: "assignmentGiven", label: "Assignment Given" },
  { key: "assignmentDetails", label: "Assignment Details" },
  { key: "notes", label: "Notes" },
  { key: "digitalTools", label: "Digital Tools" },
  { key: "status", label: "Status" },
  { key: "verifiedBy", label: "Verified By" },
  { key: "verifiedAt", label: "Verified At" },
  { key: "remarksCount", label: "Remarks" },
  { key: "viewsCount", label: "Views" },
  { key: "completeness", label: "Completeness %" },
  { key: "createdAt", label: "Created At" },
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

    if (filters.bilingual !== undefined && filters.bilingual !== "") {
      where.bilingualActivity = filters.bilingual === "true";
    }

    if (filters.familyOfSituation) {
      where.familyOfSituation = filters.familyOfSituation;
    }

    if (filters.integrationStatus) {
      where.integrationStatus = filters.integrationStatus;
    }

    if (filters.assignmentGiven !== undefined && filters.assignmentGiven !== "") {
      where.assignmentGiven = filters.assignmentGiven === "true";
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
    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);

    // Fetch entries
    const entries = await db.logbookEntry.findMany({
      where,
      ...paginationArgs,
      orderBy: prismaOrderBy,
      select: {
        id: true,
        date: true,
        period: true,
        duration: true,
        status: true,
        engagementLevel: true,
        studentAttendance: true,
        moduleName: true,
        topicText: true,
        familyOfSituation: true,
        lessonMode: true,
        bilingualActivity: true,
        bilingualType: true,
        integrationActivity: true,
        integrationLevel: true,
        integrationStatus: true,
        assignmentGiven: true,
        assignmentDetails: true,
        notes: true,
        objectives: true,
        digitalTools: true,
        verifiedByName: true,
        verifiedByTitle: true,
        verifiedAt: true,
        createdAt: true,
        teacher: {
          select: { firstName: true, lastName: true, gender: true },
        },
        assignment: {
          select: {
            subject: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
        class: {
          select: { name: true, level: true },
        },
        topics: { select: { name: true } },
        _count: { select: { remarks: true, views: true } },
      },
    });

    // Format data
    const data = entries.map((e) => {
      const completeness = getEntryCompleteness({
        moduleName: e.moduleName,
        topicText: e.topicText,
        topics: e.topics,
        familyOfSituation: e.familyOfSituation,
        integrationActivity: e.integrationActivity,
        studentAttendance: e.studentAttendance,
        engagementLevel: e.engagementLevel,
        objectives: e.objectives,
      });
      return {
        id: e.id,
        date: e.date.toISOString(),
        teacher: `${e.teacher.firstName} ${e.teacher.lastName}`,
        subject: e.assignment?.subject.name || "—",
        class: e.class.name,
        level: e.class.level,
        moduleName: e.moduleName || "—",
        topicText: e.topicText || "—",
        topicNames: e.topics?.map((t) => t.name).join(", ") || null,
        familyOfSituation: e.familyOfSituation || "—",
        period: e.period,
        duration: e.duration || null,
        status: e.status,
        engagementLevel: e.engagementLevel || "—",
        studentAttendance: e.studentAttendance,
        lessonMode: e.lessonMode || "physical",
        bilingual: e.bilingualActivity ? (e.bilingualType || "Yes") : "No",
        bilingualType: e.bilingualType || null,
        integrationActivity: e.integrationActivity || null,
        integrationLevel: e.integrationLevel || null,
        integrationStatus: e.integrationStatus || null,
        assignmentGiven: e.assignmentGiven ? "Yes" : "No",
        assignmentDetails: e.assignmentDetails || null,
        notes: e.notes || null,
        digitalTools: e.digitalTools?.join(", ") || null,
        verifiedBy: e.verifiedByName
          ? `${e.verifiedByName}${e.verifiedByTitle ? ` (${e.verifiedByTitle})` : ""}`
          : null,
        verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : null,
        remarksCount: e._count?.remarks || 0,
        viewsCount: e._count?.views || 0,
        completeness: completeness.score,
        createdAt: e.createdAt.toISOString(),
      };
    });

    // CSV export path
    if (format === "csv") {
      const csv = generateCSV(data, ACTIVITY_CSV_COLUMNS);
      return buildCsvResponse(csv, "activity-report.csv");
    }

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
      integrationStatus: ["completed", "partial", "carried_over"],
      assignmentGiven: ["true", "false"],
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
