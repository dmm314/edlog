import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReportParams, generateCSV } from "@/lib/reports";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const MAX_EXPORT_ROWS = 10000;

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
    const table = request.nextUrl.searchParams.get("table");

    if (!table || !["teachers", "assignments", "activity", "coverage"].includes(table)) {
      return NextResponse.json(
        { error: "Invalid table parameter. Use: teachers, assignments, activity, or coverage" },
        { status: 400 }
      );
    }

    const params = parseReportParams(request.nextUrl.searchParams);

    let csv: string;
    let filename: string;

    switch (table) {
      case "teachers":
        ({ csv, filename } = await exportTeachers(schoolId, params));
        break;
      case "assignments":
        ({ csv, filename } = await exportAssignments(schoolId, params));
        break;
      case "activity":
        ({ csv, filename } = await exportActivity(schoolId, params));
        break;
      case "coverage":
        ({ csv, filename } = await exportCoverage(schoolId, params));
        break;
      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Admin reports/export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

async function exportTeachers(
  schoolId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const tsWhere: Record<string, unknown> = { schoolId };
  if (filters.status) tsWhere.status = filters.status;

  const teacherWhere: Record<string, unknown> = { role: "TEACHER" };
  if (filters.gender) teacherWhere.gender = filters.gender;
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
    teacherWhere.assignments = { some: { schoolId, subject: { name: filters.subject } } };
  }
  if (filters.class) {
    teacherWhere.assignments = {
      some: { schoolId, class: { name: filters.class } },
    };
  }
  tsWhere.teacher = teacherWhere;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const teacherSchools = await db.teacherSchool.findMany({
    where: tsWhere,
    take: MAX_EXPORT_ROWS,
    select: {
      status: true,
      teacher: {
        select: {
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
            where: { class: { schoolId } },
            select: { date: true },
          },
        },
      },
    },
  });

  const data = teacherSchools.map((ts) => {
    const t = ts.teacher;
    const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name))).join(", ");
    const classes = Array.from(new Set(t.assignments.map((a) => a.class.name))).join(", ");
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
      name: `${t.firstName} ${t.lastName}`,
      gender: t.gender || "",
      phone: t.phone || "",
      teacherCode: t.teacherCode || "",
      subjects,
      classes,
      entriesThisWeek,
      entriesThisMonth,
      lastActive: lastActive?.toISOString().split("T")[0] || "",
      status: ts.status,
    };
  });

  const columns = [
    { key: "name", label: "Teacher Name" },
    { key: "gender", label: "Gender" },
    { key: "phone", label: "Phone" },
    { key: "teacherCode", label: "Teacher Code" },
    { key: "subjects", label: "Subjects" },
    { key: "classes", label: "Classes" },
    { key: "entriesThisWeek", label: "Entries This Week" },
    { key: "entriesThisMonth", label: "Entries This Month" },
    { key: "lastActive", label: "Last Active" },
    { key: "status", label: "Status" },
  ];

  return { csv: generateCSV(data, columns), filename: "teachers-report.csv" };
}

async function exportAssignments(
  schoolId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const where: Record<string, unknown> = { schoolId };
  if (filters.subject) where.subject = { name: filters.subject };
  if (filters.level) where.class = { level: filters.level };
  if (search) {
    const searchWords = search.trim().split(/\s+/);
    if (searchWords.length === 1) {
      where.teacher = {
        OR: [
          { firstName: { contains: searchWords[0], mode: "insensitive" } },
          { lastName: { contains: searchWords[0], mode: "insensitive" } },
        ],
      };
    } else {
      where.teacher = {
        AND: searchWords.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
          ],
        })),
      };
    }
  }

  const assignments = await db.teacherAssignment.findMany({
    where,
    take: MAX_EXPORT_ROWS,
    orderBy: { subject: { name: "asc" } },
    select: {
      teacher: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true } },
      division: { select: { name: true } },
      class: { select: { name: true, level: true } },
      _count: { select: { periods: true } },
    },
  });

  const data = assignments.map((a) => ({
    teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
    subject: a.subject.name,
    division: a.division?.name || "",
    class: a.class.name,
    level: a.class.level,
    periodsPerWeek: a._count.periods,
  }));

  const columns = [
    { key: "teacher", label: "Teacher" },
    { key: "subject", label: "Subject" },
    { key: "division", label: "Division" },
    { key: "class", label: "Class" },
    { key: "level", label: "Level" },
    { key: "periodsPerWeek", label: "Periods/Week" },
  ];

  return { csv: generateCSV(data, columns), filename: "assignments-report.csv" };
}

async function exportActivity(
  schoolId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const where: Record<string, unknown> = { class: { schoolId } };

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    where.date = dateFilter;
  }
  if (filters.status) where.status = filters.status;
  if (filters.level) where.class = { ...(where.class as object), level: filters.level };
  if (filters.class) where.class = { ...(where.class as object), name: filters.class };
  if (filters.subject) where.assignment = { subject: { name: filters.subject } };
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

  const entries = await db.logbookEntry.findMany({
    where,
    take: MAX_EXPORT_ROWS,
    orderBy: { date: "desc" },
    select: {
      date: true,
      period: true,
      status: true,
      engagementLevel: true,
      studentAttendance: true,
      moduleName: true,
      topicText: true,
      teacher: { select: { firstName: true, lastName: true } },
      assignment: { select: { subject: { select: { name: true } } } },
      class: { select: { name: true, level: true } },
    },
  });

  const data = entries.map((e) => ({
    date: e.date.toISOString().split("T")[0],
    teacher: `${e.teacher.firstName} ${e.teacher.lastName}`,
    subject: e.assignment?.subject.name || "",
    class: e.class.name,
    level: e.class.level,
    moduleName: e.moduleName || "",
    topicText: e.topicText || "",
    period: e.period ?? "",
    status: e.status,
    engagementLevel: e.engagementLevel || "",
    studentAttendance: e.studentAttendance ?? "",
  }));

  const columns = [
    { key: "date", label: "Date" },
    { key: "teacher", label: "Teacher" },
    { key: "subject", label: "Subject" },
    { key: "class", label: "Class" },
    { key: "level", label: "Level" },
    { key: "moduleName", label: "Module" },
    { key: "topicText", label: "Topic" },
    { key: "period", label: "Period" },
    { key: "status", label: "Status" },
    { key: "engagementLevel", label: "Engagement" },
    { key: "studentAttendance", label: "Attendance" },
  ];

  return { csv: generateCSV(data, columns), filename: "activity-report.csv" };
}

async function exportCoverage(
  schoolId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`ss."schoolId" = ${schoolId}`,
  ];
  if (filters.subject) conditions.push(Prisma.sql`sub.name = ${filters.subject}`);
  if (filters.level) conditions.push(Prisma.sql`t."classLevel" = ${filters.level}`);
  if (search) {
    conditions.push(
      Prisma.sql`(t.name ILIKE ${'%' + search + '%'} OR t."moduleName" ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  interface CoverageExportRow {
    name: string;
    classLevel: string;
    moduleNum: number | null;
    moduleName: string | null;
    subject_name: string;
    taught_by: string | null;
    times_covered: bigint;
    last_taught: Date | null;
  }

  const rows = await db.$queryRaw<CoverageExportRow[]>(Prisma.sql`
    WITH direct_coverage AS (
      SELECT et."B" as topic_id, le."teacherId", le.id as entry_id, le.date
      FROM "_EntryTopics" et
      JOIN "LogbookEntry" le ON le.id = et."A"
      JOIN "Class" c ON c.id = le."classId"
      WHERE c."schoolId" = ${schoolId}
    ),
    module_coverage AS (
      SELECT t2.id as topic_id, le."teacherId", le.id as entry_id, le.date
      FROM "Topic" t2
      JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t2."moduleName")
      JOIN "User" u ON u.id = le."teacherId"
      JOIN "Class" c ON c.id = le."classId" AND c.level = t2."classLevel"
      JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id
        AND ta."subjectId" = t2."subjectId"
        AND ta."schoolId" = ${schoolId}
      WHERE c."schoolId" = ${schoolId}
        AND le.id NOT IN (SELECT et2."A" FROM "_EntryTopics" et2 WHERE et2."B" = t2.id)
    ),
    combined AS (
      SELECT * FROM direct_coverage UNION ALL SELECT * FROM module_coverage
    ),
    teacher_names AS (
      SELECT c2.topic_id, STRING_AGG(DISTINCT u."firstName" || ' ' || u."lastName", ', ') as teachers
      FROM combined c2 JOIN "User" u ON u.id = c2."teacherId"
      GROUP BY c2.topic_id
    )
    SELECT t.name, t."classLevel", t."moduleNum", t."moduleName",
      sub.name as subject_name, tn.teachers as taught_by,
      COALESCE(agg.entry_count, 0) as times_covered, agg.last_date as last_taught
    FROM "Topic" t
    JOIN "Subject" sub ON sub.id = t."subjectId"
    JOIN "SchoolSubject" ss ON ss."subjectId" = sub.id AND ss."schoolId" = ${schoolId}
    LEFT JOIN (
      SELECT topic_id, COUNT(DISTINCT entry_id) as entry_count, MAX(date) as last_date
      FROM combined GROUP BY topic_id
    ) agg ON agg.topic_id = t.id
    LEFT JOIN teacher_names tn ON tn.topic_id = t.id
    ${whereClause}
    ORDER BY sub.name ASC, t."orderIndex" ASC
    LIMIT ${MAX_EXPORT_ROWS}
  `);

  let filtered = rows;
  if (filters.covered === "covered") {
    filtered = rows.filter((r) => Number(r.times_covered) > 0);
  } else if (filters.covered === "gaps") {
    filtered = rows.filter((r) => Number(r.times_covered) === 0);
  }

  const data = filtered.map((r) => ({
    subject: r.subject_name,
    level: r.classLevel,
    moduleNum: r.moduleNum ?? "",
    moduleName: r.moduleName || "",
    topic: r.name,
    taughtBy: r.taught_by || "",
    timesCovered: Number(r.times_covered),
    lastTaught: r.last_taught ? r.last_taught.toISOString().split("T")[0] : "",
    status: Number(r.times_covered) > 0 ? "Covered" : "Not Yet",
  }));

  const columns = [
    { key: "subject", label: "Subject" },
    { key: "level", label: "Level" },
    { key: "moduleNum", label: "Module #" },
    { key: "moduleName", label: "Module" },
    { key: "topic", label: "Topic" },
    { key: "taughtBy", label: "Taught By" },
    { key: "timesCovered", label: "Times Covered" },
    { key: "lastTaught", label: "Last Taught" },
    { key: "status", label: "Status" },
  ];

  return { csv: generateCSV(data, columns), filename: "coverage-report.csv" };
}
