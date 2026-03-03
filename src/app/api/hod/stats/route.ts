import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStartOfMonth, getStartOfWeek } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hodAssignments = await db.headOfDepartment.findMany({
      where: { teacherId: user.id },
      include: { subject: true },
    });

    if (hodAssignments.length === 0) {
      return NextResponse.json({ error: "Not an HOD" }, { status: 403 });
    }

    const hodSubjectIds = hodAssignments.map((h) => h.subjectId);
    const startOfMonth = getStartOfMonth();
    const startOfWeek = getStartOfWeek();

    // Count teachers in my department subjects
    const teachersInDept = await db.user.count({
      where: {
        schoolId: user.schoolId,
        role: "TEACHER",
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
    });

    const entryFilter = {
      teacher: { schoolId: user.schoolId },
      OR: [
        { topics: { some: { subjectId: { in: hodSubjectIds } } } },
        { assignment: { subjectId: { in: hodSubjectIds } } },
      ],
    };

    const [totalEntries, entriesThisMonth, entriesThisWeek] = await Promise.all([
      db.logbookEntry.count({ where: entryFilter }),
      db.logbookEntry.count({ where: { ...entryFilter, date: { gte: startOfMonth } } }),
      db.logbookEntry.count({ where: { ...entryFilter, date: { gte: startOfWeek } } }),
    ]);

    // Teachers with their entry counts for ranking
    const teacherDetails = await db.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: "TEACHER",
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: { select: { entries: true } },
        entries: {
          where: { date: { gte: startOfMonth } },
          select: { id: true },
        },
      },
      orderBy: { lastName: "asc" },
    });

    const teacherRankings = teacherDetails
      .map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        totalEntries: t._count.entries,
        monthlyEntries: t.entries.length,
      }))
      .sort((a, b) => b.monthlyEntries - a.monthlyEntries);

    return NextResponse.json({
      hodSubjects: hodAssignments.map((h) => ({
        id: h.subject.id,
        name: h.subject.name,
        code: h.subject.code,
      })),
      teachersInDept,
      totalEntries,
      entriesThisMonth,
      entriesThisWeek,
      teacherRankings,
    });
  } catch (error) {
    console.error("GET /api/hod/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HOD stats" },
      { status: 500 }
    );
  }
}
