import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teachers both via direct schoolId AND via TeacherSchool membership
    const [directTeachers, memberTeachers] = await Promise.all([
      db.user.findMany({
        where: { schoolId: user.schoolId, role: "TEACHER" },
        include: {
          entries: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          _count: { select: { entries: true } },
          assignments: {
            include: {
              class: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { lastName: "asc" },
      }),
      db.user.findMany({
        where: {
          teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } },
          role: "TEACHER",
          NOT: { schoolId: user.schoolId },
        },
        include: {
          entries: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          _count: { select: { entries: true } },
          assignments: {
            where: { schoolId: user.schoolId! },
            include: {
              class: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { lastName: "asc" },
      }),
    ]);

    // Merge and deduplicate
    const seenIds = new Set<string>();
    const teachers = [...directTeachers, ...memberTeachers].filter((t) => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    const result = teachers.map((t) => {
      // Build subject -> classes mapping
      const subjectClassMap = new Map<string, Set<string>>();
      for (const a of t.assignments) {
        if (!subjectClassMap.has(a.subject.name)) {
          subjectClassMap.set(a.subject.name, new Set());
        }
        subjectClassMap.get(a.subject.name)!.add(a.class.name);
      }
      const subjectClasses = Array.from(subjectClassMap.entries()).map(([subject, classSet]) => ({
        subject,
        classes: Array.from(classSet).sort(),
      }));

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        gender: (t as Record<string, unknown>).gender as string | null,
        photoUrl: (t as Record<string, unknown>).photoUrl as string | null,
        isVerified: t.isVerified,
        createdAt: t.createdAt.toISOString(),
        entryCount: t._count.entries,
        lastEntry: t.entries[0]?.date.toISOString() ?? null,
        subjects: Array.from(new Set(t.assignments.map((a) => a.subject.name))),
        classes: Array.from(new Set(t.assignments.map((a) => a.class.name))),
        subjectClasses,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
