export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getStartOfWeek } from "@/lib/utils";

function buildTeacherResult(
  t: Record<string, unknown>,
  status: "PENDING" | "ACTIVE",
  membershipId: string | null,
  entriesThisWeek = 0
) {
  const assignments = (t.assignments as Array<{
    subject: { name: string };
    class: { name: string };
    _count?: { timetableSlots: number };
  }>) || [];

  const subjectClassMap = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (!subjectClassMap.has(a.subject.name)) {
      subjectClassMap.set(a.subject.name, new Set());
    }
    subjectClassMap.get(a.subject.name)!.add(a.class.name);
  }
  const subjectClasses = Array.from(subjectClassMap.entries()).map(([subject, classSet]) => ({
    subject,
    classes: Array.from(classSet).sort(),
  }));

  const entries = (t.entries as Array<{ date: Date }>) || [];
  const count = (t._count as { entries: number }) || { entries: 0 };
  const periodsPerWeek = assignments.reduce((sum, a) => sum + (a._count?.timetableSlots ?? 0), 0);

  return {
    id: t.id as string,
    firstName: t.firstName as string,
    lastName: t.lastName as string,
    email: t.email as string,
    phone: (t.phone as string) || null,
    gender: (t.gender as string) || null,
    photoUrl: (t.photoUrl as string) || null,
    isVerified: t.isVerified as boolean,
    membershipStatus: status,
    membershipId,
    createdAt: (t.createdAt as Date).toISOString(),
    entryCount: count.entries,
    entriesThisWeek,
    periodsPerWeek,
    lastEntry: entries[0]?.date?.toISOString() ?? null,
    subjects: Array.from(new Set(assignments.map((a) => a.subject.name))),
    classes: Array.from(new Set(assignments.map((a) => a.class.name))),
    subjectClasses,
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const startOfWeek = getStartOfWeek();

    const teacherInclude = {
      entries: {
        orderBy: { date: "desc" as const },
        take: 1,
        select: { date: true },
      },
      _count: { select: { entries: true } },
      assignments: {
        where: { schoolId: user.schoolId },
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { timetableSlots: true } },
        },
      },
    };

    // Try to use TeacherSchool table first (new multi-school system)
    let useTeacherSchool = true;
    let result: ReturnType<typeof buildTeacherResult>[] = [];

    try {
      const memberships = await db.teacherSchool.findMany({
        where: {
          schoolId: user.schoolId,
          status: { in: ["PENDING", "ACTIVE"] },
        },
        include: { teacher: { include: teacherInclude } },
        orderBy: { createdAt: "desc" },
      });

      const memberTeacherIds = new Set(memberships.map((m) => m.teacherId));

      // Also get teachers with direct schoolId but no TeacherSchool record (legacy)
      const directTeachers = await db.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: "TEACHER",
          id: { notIn: Array.from(memberTeacherIds) },
        },
        include: teacherInclude,
        orderBy: { lastName: "asc" },
      });

      for (const m of memberships) {
        result.push(
          buildTeacherResult(
            m.teacher as unknown as Record<string, unknown>,
            m.status as "PENDING" | "ACTIVE",
            m.id
          )
        );
      }
      for (const t of directTeachers) {
        result.push(
          buildTeacherResult(
            t as unknown as Record<string, unknown>,
            t.isVerified ? "ACTIVE" : "PENDING",
            null
          )
        );
      }
    } catch (e) {
      // TeacherSchool table likely doesn't exist yet — fall back to direct query
      console.warn("TeacherSchool query failed, falling back to direct schoolId:", (e as Error).message);
      useTeacherSchool = false;
    }

    // Fallback: TeacherSchool table unavailable — direct schoolId members only
    if (!useTeacherSchool) {
      const teachers = await db.user.findMany({
        where: {
          role: "TEACHER",
          schoolId: user.schoolId,
        },
        include: teacherInclude,
        orderBy: { lastName: "asc" },
      });

      result = teachers.map((t) =>
        buildTeacherResult(
          t as unknown as Record<string, unknown>,
          // Use isVerified to determine status in fallback mode
          t.isVerified ? "ACTIVE" : "PENDING",
          null
        )
      );
    }

    // Batch-fetch this week's entry counts per teacher, scoped to this school's classes
    const teacherIds = result.map((r) => r.id);
    if (teacherIds.length > 0) {
      const weeklyGroups = await db.logbookEntry.groupBy({
        by: ["teacherId"],
        where: {
          teacherId: { in: teacherIds },
          date: { gte: startOfWeek },
          class: { schoolId: user.schoolId! },
        },
        _count: { _all: true },
      });
      const weeklyMap = new Map(weeklyGroups.map((g) => [g.teacherId, g._count._all]));
      result = result.map((r) => ({ ...r, entriesThisWeek: weeklyMap.get(r.id) ?? 0 }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
