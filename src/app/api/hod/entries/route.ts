export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET: HOD views entries of teachers in their subject(s)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this teacher is an HOD
    const hodAssignments = await db.headOfDepartment.findMany({
      where: { teacherId: user.id },
      include: { subject: true },
    });

    if (hodAssignments.length === 0) {
      return NextResponse.json({ error: "Not an HOD" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const teacherId = searchParams.get("teacherId");
    const classLevel = searchParams.get("classLevel");
    const classId = searchParams.get("classId");
    const moduleName = searchParams.get("moduleName");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build the subject filter — either specific subject or all HOD subjects
    const hodSubjectIds = hodAssignments.map((h) => h.subjectId);
    const filterSubjectIds = subjectId && hodSubjectIds.includes(subjectId)
      ? [subjectId]
      : hodSubjectIds;

    const where: Record<string, unknown> = {
      class: { schoolId: user.schoolId },
      OR: [
        { topics: { some: { subjectId: { in: filterSubjectIds } } } },
        { assignment: { subjectId: { in: filterSubjectIds } } },
      ],
    };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (classLevel) {
      where.class = { ...(where.class as Record<string, unknown> || {}), level: classLevel };
    }

    if (classId) {
      where.classId = classId;
    }

    if (moduleName) {
      where.moduleName = moduleName;
    }

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          class: true,
          topics: { include: { subject: true } },
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
          },
          assignment: { include: { subject: true, division: true } },
          timetableSlot: true,
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      db.logbookEntry.count({ where }),
    ]);

    // Also get the teachers under this HOD's subjects
    const teachersInDept = await db.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: "TEACHER",
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        photoUrl: true,
        _count: { select: { entries: true } },
      },
      orderBy: { lastName: "asc" },
    });

    // Get all classes that have assignments for the HOD's subjects
    const classesInDept = await db.class.findMany({
      where: {
        schoolId: user.schoolId ?? undefined,
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
      select: {
        id: true,
        name: true,
        level: true,
      },
      orderBy: { name: "asc" },
    });

    // Build unique class levels for filtering
    const classLevels = Array.from(new Set(classesInDept.map((c) => c.level).filter(Boolean))).sort();

    // Get unique module names from the HOD's subjects for filtering
    const modules = await db.topic.findMany({
      where: {
        subjectId: { in: hodSubjectIds },
        moduleName: { not: null },
      },
      select: {
        moduleName: true,
        classLevel: true,
      },
      distinct: ["moduleName"],
      orderBy: { moduleName: "asc" },
    });

    // Also get distinct moduleName values from entries themselves
    const entryModules = await db.logbookEntry.findMany({
      where: {
        class: { schoolId: user.schoolId },
        moduleName: { not: null },
        OR: [
          { topics: { some: { subjectId: { in: hodSubjectIds } } } },
          { assignment: { subjectId: { in: hodSubjectIds } } },
        ],
      },
      select: { moduleName: true },
      distinct: ["moduleName"],
      orderBy: { moduleName: "asc" },
    });

    // Merge module names from topics and entries
    const allModuleNames = Array.from(
      new Set([
        ...modules.map((m) => m.moduleName).filter(Boolean),
        ...entryModules.map((e) => e.moduleName).filter(Boolean),
      ])
    ).sort() as string[];

    return NextResponse.json({
      entries,
      total,
      hodSubjects: hodAssignments.map((h) => ({
        id: h.subject.id,
        name: h.subject.name,
        code: h.subject.code,
      })),
      teachers: teachersInDept.map((t) => ({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        photoUrl: t.photoUrl,
        entryCount: t._count.entries,
      })),
      classes: classesInDept,
      classLevels,
      modules: allModuleNames,
    });
  } catch (error) {
    console.error("GET /api/hod/entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOD entries" },
      { status: 500 }
    );
  }
}
