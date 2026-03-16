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
  { key: "school", label: "School" },
  { key: "division", label: "Division" },
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

    const where: Record<string, unknown> = {
      class: { school: { regionId } },
    };

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

    const total = await db.logbookEntry.count({ where });

    const sortField = sort || "date";
    const sortDir = order || "desc";

    const directSorts: Record<string, object> = {
      date: { date: sortDir },
      teacher: { teacher: { firstName: sortDir } },
      school: { class: { school: { name: sortDir } } },
      subject: { assignment: { subject: { name: sortDir } } },
    };

    const prismaOrderBy = directSorts[sortField] || { date: "desc" };
    const paginationArgs = format === "csv" ? {} : buildPagination(cursor, limit);

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
        topics: { select: { name: true } },
        _count: { select: { remarks: true, views: true } },
      },
    });

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
        school: e.class.school.name,
        division: e.class.school.division?.name || "—",
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

    if (format === "csv") {
      const csv = generateCSV(data, ACTIVITY_CSV_COLUMNS);
      return buildCsvResponse(csv, "activity-report.csv");
    }

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

    const familyOptions = await db.logbookEntry.findMany({
      where: { class: { school: { regionId } }, familyOfSituation: { not: null } },
      select: { familyOfSituation: true },
      distinct: ["familyOfSituation"],
    });

    const responseFilters = {
      division: divisionOptions.map((d) => d.name),
      school: schoolOptions.map((s) => s.name),
      subject: subjectOptions.map((a) => a.subject.name).sort(),
      level: levelOptions.map((c) => c.level).sort(),
      familyOfSituation: familyOptions.map((f) => f.familyOfSituation!).filter(Boolean).sort(),
      status: ["SUBMITTED", "VERIFIED", "FLAGGED"],
      lessonMode: ["physical", "digital", "hybrid"],
      bilingual: ["true", "false"],
      integrationStatus: ["completed", "partial", "carried_over"],
      assignmentGiven: ["true", "false"],
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
