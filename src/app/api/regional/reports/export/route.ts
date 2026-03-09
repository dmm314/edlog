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
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const regionId = user.regionId;
    const table = request.nextUrl.searchParams.get("table");

    if (!table || !["schools", "teachers", "assignments", "activity"].includes(table)) {
      return NextResponse.json(
        { error: "Invalid table parameter. Use: schools, teachers, assignments, or activity" },
        { status: 400 }
      );
    }

    const params = parseReportParams(request.nextUrl.searchParams);

    let csv: string;
    let filename: string;

    switch (table) {
      case "schools":
        ({ csv, filename } = await exportSchools(regionId, params));
        break;
      case "teachers":
        ({ csv, filename } = await exportTeachers(regionId, params));
        break;
      case "assignments":
        ({ csv, filename } = await exportAssignments(regionId, params));
        break;
      case "activity":
        ({ csv, filename } = await exportActivity(regionId, params));
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
    console.error("Regional reports/export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

async function exportSchools(
  regionId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  let weekdaysElapsed = 0;
  const cursorDate = new Date(startOfMonth);
  while (cursorDate <= now) {
    const dow = cursorDate.getDay();
    if (dow >= 1 && dow <= 5) weekdaysElapsed++;
    cursorDate.setDate(cursorDate.getDate() + 1);
  }
  if (weekdaysElapsed === 0) weekdaysElapsed = 1;

  const conditions: Prisma.Sql[] = [Prisma.sql`s."regionId" = ${regionId}`];
  if (filters.division) conditions.push(Prisma.sql`d.name = ${filters.division}`);
  if (filters.type) conditions.push(Prisma.sql`s."schoolType" = ${filters.type}`);
  if (filters.status) conditions.push(Prisma.sql`s.status = ${filters.status}::"SchoolStatus"`);
  if (search) {
    conditions.push(
      Prisma.sql`(s.name ILIKE ${'%' + search + '%'} OR s.code ILIKE ${'%' + search + '%'} OR s."principalName" ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  interface SchoolExportRow {
    name: string;
    code: string;
    schoolType: string | null;
    principalName: string | null;
    status: string;
    division_name: string;
    teacher_count: bigint;
    entries_this_week: bigint;
    entries_this_month: bigint;
  }

  const rows = await db.$queryRaw<SchoolExportRow[]>(Prisma.sql`
    SELECT s.name, s.code, s."schoolType", s."principalName", s.status::text,
      d.name as division_name,
      (SELECT COUNT(*) FROM "User" u WHERE u."schoolId" = s.id AND u.role = 'TEACHER') as teacher_count,
      (SELECT COUNT(*) FROM "LogbookEntry" le JOIN "User" u ON le."teacherId" = u.id WHERE u."schoolId" = s.id AND le.date >= ${startOfWeek}) as entries_this_week,
      (SELECT COUNT(*) FROM "LogbookEntry" le JOIN "User" u ON le."teacherId" = u.id WHERE u."schoolId" = s.id AND le.date >= ${startOfMonth}) as entries_this_month
    FROM "School" s
    JOIN "Division" d ON d.id = s."divisionId"
    ${whereClause}
    ORDER BY s.name ASC
    LIMIT ${MAX_EXPORT_ROWS}
  `);

  const data = rows.map((r) => {
    const teacherCount = Number(r.teacher_count);
    const entriesThisMonth = Number(r.entries_this_month);
    const expectedEntries = teacherCount * weekdaysElapsed;
    const complianceRate = expectedEntries > 0
      ? Math.min(Math.round((entriesThisMonth / expectedEntries) * 100), 100)
      : 0;
    return {
      name: r.name,
      code: r.code,
      division: r.division_name,
      schoolType: r.schoolType || "",
      principalName: r.principalName || "",
      status: r.status,
      teacherCount,
      entriesThisWeek: Number(r.entries_this_week),
      entriesThisMonth,
      complianceRate: `${complianceRate}%`,
    };
  });

  const columns = [
    { key: "name", label: "School Name" },
    { key: "code", label: "School Code" },
    { key: "division", label: "Division" },
    { key: "schoolType", label: "Type" },
    { key: "principalName", label: "Principal" },
    { key: "status", label: "Status" },
    { key: "teacherCount", label: "Teachers" },
    { key: "entriesThisWeek", label: "Entries This Week" },
    { key: "entriesThisMonth", label: "Entries This Month" },
    { key: "complianceRate", label: "Compliance Rate" },
  ];

  return { csv: generateCSV(data, columns), filename: "regional-schools-report.csv" };
}

async function exportTeachers(
  regionId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const where: Record<string, unknown> = {
    role: "TEACHER",
    school: { regionId },
  };

  if (filters.division) where.school = { ...(where.school as object), division: { name: filters.division } };
  if (filters.school) where.school = { ...(where.school as object), name: filters.school };
  if (filters.gender) where.gender = filters.gender;
  if (filters.subject) where.assignments = { some: { subject: { name: filters.subject } } };
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

  const teachers = await db.user.findMany({
    where,
    take: MAX_EXPORT_ROWS,
    orderBy: { firstName: "asc" },
    select: {
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
    },
  });

  const data = teachers.map((t) => {
    const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name))).join(", ");
    const classes = Array.from(new Set(t.assignments.map((a) => a.class.name))).join(", ");
    let lastActive: Date | null = null;
    for (const entry of t.entries) {
      const d = new Date(entry.date);
      if (!lastActive || d > lastActive) lastActive = d;
    }
    return {
      name: `${t.firstName} ${t.lastName}`,
      gender: t.gender || "",
      phone: t.phone || "",
      school: t.school?.name || "",
      division: t.school?.division?.name || "",
      subjects,
      classes,
      entriesThisMonth: t.entries.length,
      lastActive: lastActive?.toISOString().split("T")[0] || "",
    };
  });

  const columns = [
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

  return { csv: generateCSV(data, columns), filename: "regional-teachers-report.csv" };
}

async function exportAssignments(
  regionId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const where: Record<string, unknown> = { school: { regionId } };
  if (filters.division) where.school = { ...(where.school as object), division: { name: filters.division } };
  if (filters.school) where.school = { ...(where.school as object), name: filters.school };
  if (filters.subject) where.subject = { name: filters.subject };
  if (filters.level) where.class = { level: filters.level };
  if (search) {
    const searchWords = search.trim().split(/\s+/);
    if (searchWords.length === 1) {
      where.OR = [
        { teacher: { firstName: { contains: searchWords[0], mode: "insensitive" } } },
        { teacher: { lastName: { contains: searchWords[0], mode: "insensitive" } } },
        { subject: { name: { contains: searchWords[0], mode: "insensitive" } } },
      ];
    } else {
      where.OR = [
        { AND: searchWords.map((word: string) => ({
          OR: [
            { teacher: { firstName: { contains: word, mode: "insensitive" } } },
            { teacher: { lastName: { contains: word, mode: "insensitive" } } },
          ],
        })) },
        { subject: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
  }

  const assignments = await db.teacherAssignment.findMany({
    where,
    take: MAX_EXPORT_ROWS,
    orderBy: [{ school: { name: "asc" } }, { subject: { name: "asc" } }],
    select: {
      teacher: { select: { firstName: true, lastName: true } },
      school: { select: { name: true, division: { select: { name: true } } } },
      subject: { select: { name: true } },
      class: { select: { name: true, level: true } },
    },
  });

  const data = assignments.map((a) => ({
    teacher: `${a.teacher.firstName} ${a.teacher.lastName}`,
    school: a.school.name,
    division: a.school.division?.name || "",
    subject: a.subject.name,
    class: a.class.name,
    level: a.class.level,
  }));

  const columns = [
    { key: "teacher", label: "Teacher" },
    { key: "school", label: "School" },
    { key: "division", label: "Division" },
    { key: "subject", label: "Subject" },
    { key: "class", label: "Class" },
    { key: "level", label: "Level" },
  ];

  return { csv: generateCSV(data, columns), filename: "regional-assignments-report.csv" };
}

async function exportActivity(
  regionId: string,
  params: ReturnType<typeof parseReportParams>
) {
  const { search, filters } = params;

  const where: Record<string, unknown> = {
    class: { school: { regionId } },
  };

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    where.date = dateFilter;
  }
  if (filters.status) where.status = filters.status;
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
  if (filters.level) where.class = { ...(where.class as object), level: filters.level };
  if (filters.subject) where.assignment = { subject: { name: filters.subject } };
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
      moduleName: true,
      topicText: true,
      teacher: { select: { firstName: true, lastName: true } },
      assignment: { select: { subject: { select: { name: true } } } },
      class: {
        select: {
          name: true,
          level: true,
          school: { select: { name: true, division: { select: { name: true } } } },
        },
      },
    },
  });

  const data = entries.map((e) => ({
    date: e.date.toISOString().split("T")[0],
    teacher: `${e.teacher.firstName} ${e.teacher.lastName}`,
    school: e.class.school.name,
    division: e.class.school.division?.name || "",
    subject: e.assignment?.subject.name || "",
    class: e.class.name,
    level: e.class.level,
    moduleName: e.moduleName || "",
    topicText: e.topicText || "",
    period: e.period ?? "",
    status: e.status,
  }));

  const columns = [
    { key: "date", label: "Date" },
    { key: "teacher", label: "Teacher" },
    { key: "school", label: "School" },
    { key: "division", label: "Division" },
    { key: "subject", label: "Subject" },
    { key: "class", label: "Class" },
    { key: "level", label: "Level" },
    { key: "moduleName", label: "Module" },
    { key: "topicText", label: "Topic" },
    { key: "period", label: "Period" },
    { key: "status", label: "Status" },
  ];

  return { csv: generateCSV(data, columns), filename: "regional-activity-report.csv" };
}
