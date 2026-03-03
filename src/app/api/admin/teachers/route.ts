import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    // Get ALL teachers linked to this school via TeacherSchool (PENDING + ACTIVE)
    const memberships = await db.teacherSchool.findMany({
      where: {
        schoolId: user.schoolId,
        status: { in: ["PENDING", "ACTIVE"] },
      },
      include: {
        teacher: {
          include: {
            entries: {
              where: { teacher: { schoolId: user.schoolId } },
              orderBy: { date: "desc" },
              take: 1,
              select: { date: true },
            },
            _count: {
              select: { entries: true },
            },
            assignments: {
              where: { schoolId: user.schoolId },
              include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also get teachers who have schoolId set to this school but no TeacherSchool record
    // (legacy/fallback)
    const memberTeacherIds = new Set(memberships.map((m) => m.teacherId));
    const directTeachers = await db.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: "TEACHER",
        id: { notIn: Array.from(memberTeacherIds) },
      },
      include: {
        entries: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
        _count: { select: { entries: true } },
        assignments: {
          where: { schoolId: user.schoolId },
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    const result = [];

    // Process TeacherSchool memberships
    for (const m of memberships) {
      const t = m.teacher;
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

      result.push({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        gender: (t as Record<string, unknown>).gender as string | null,
        photoUrl: (t as Record<string, unknown>).photoUrl as string | null,
        isVerified: t.isVerified,
        membershipStatus: m.status, // "PENDING" or "ACTIVE"
        membershipId: m.id,
        createdAt: t.createdAt.toISOString(),
        entryCount: t._count.entries,
        lastEntry: t.entries[0]?.date.toISOString() ?? null,
        subjects: Array.from(new Set(t.assignments.map((a) => a.subject.name))),
        classes: Array.from(new Set(t.assignments.map((a) => a.class.name))),
        subjectClasses,
      });
    }

    // Process direct teachers (legacy fallback)
    for (const t of directTeachers) {
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

      result.push({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        gender: (t as Record<string, unknown>).gender as string | null,
        photoUrl: (t as Record<string, unknown>).photoUrl as string | null,
        isVerified: t.isVerified,
        membershipStatus: "ACTIVE" as const, // Legacy teachers are treated as active
        membershipId: null,
        createdAt: t.createdAt.toISOString(),
        entryCount: t._count.entries,
        lastEntry: t.entries[0]?.date.toISOString() ?? null,
        subjects: Array.from(new Set(t.assignments.map((a) => a.subject.name))),
        classes: Array.from(new Set(t.assignments.map((a) => a.class.name))),
        subjectClasses,
      });
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
