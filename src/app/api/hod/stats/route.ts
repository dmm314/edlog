export const dynamic = "force-dynamic";
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
      class: { schoolId: user.schoolId },
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

    // Teachers with their entry counts for ranking — filtered to HOD's subjects only
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
        assignments: {
          where: { subjectId: { in: hodSubjectIds } },
          select: {
            subject: { select: { name: true } },
            division: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    // Count entries per teacher in HOD's subjects
    const teacherRankings = await Promise.all(
      teacherDetails.map(async (t) => {
        const subjectEntryFilter = {
          teacherId: t.id,
          OR: [
            { topics: { some: { subjectId: { in: hodSubjectIds } } } },
            { assignment: { subjectId: { in: hodSubjectIds } } },
          ],
        };

        const [total, monthly] = await Promise.all([
          db.logbookEntry.count({ where: subjectEntryFilter }),
          db.logbookEntry.count({
            where: { ...subjectEntryFilter, date: { gte: startOfMonth } },
          }),
        ]);

        // Build readable class list for HOD's subjects
        const classInfo = t.assignments.map((a) => ({
          className: a.class.name,
          subject: a.subject.name,
          division: a.division?.name || null,
        }));

        return {
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          totalEntries: total,
          monthlyEntries: monthly,
          classes: classInfo,
        };
      })
    );

    teacherRankings.sort((a, b) => b.monthlyEntries - a.monthlyEntries);

    // Get divisions for HOD's subjects
    const divisions = await db.subjectDivision.findMany({
      where: {
        schoolId: user.schoolId!,
        subjectId: { in: hodSubjectIds },
      },
      select: { id: true, name: true, subjectId: true },
      orderBy: { name: "asc" },
    }).catch(() => [] as { id: string; name: string; subjectId: string }[]);

    const divisionsBySubject: Record<string, { id: string; name: string }[]> = {};
    for (const d of divisions) {
      if (!divisionsBySubject[d.subjectId]) divisionsBySubject[d.subjectId] = [];
      divisionsBySubject[d.subjectId].push({ id: d.id, name: d.name });
    }

    return NextResponse.json({
      hodSubjects: hodAssignments.map((h) => ({
        id: h.subject.id,
        name: h.subject.name,
        code: h.subject.code,
        divisions: divisionsBySubject[h.subjectId] || [],
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
