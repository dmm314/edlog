import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await db.user.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: {
            class: { select: { id: true, name: true, level: true } },
            subject: { select: { id: true, name: true, code: true } },
            _count: { select: { entries: true, periods: true } },
          },
        },
        entries: {
          orderBy: { date: "desc" },
          take: 50,
          include: {
            class: { select: { name: true } },
            topics: { select: { name: true, subject: { select: { name: true } } } },
          },
        },
        _count: { select: { entries: true } },
      },
    });

    if (!teacher || teacher.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      gender: (teacher as Record<string, unknown>).gender as string | null,
      photoUrl: (teacher as Record<string, unknown>).photoUrl as string | null,
      isVerified: teacher.isVerified,
      createdAt: teacher.createdAt.toISOString(),
      totalEntries: teacher._count.entries,
      assignments: teacher.assignments.map((a) => ({
        id: a.id,
        className: a.class.name,
        classLevel: a.class.level,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        entryCount: a._count.entries,
        slotCount: a._count.periods,
      })),
      entries: teacher.entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        period: e.period,
        duration: e.duration,
        notes: e.notes,
        objectives: e.objectives,
        status: e.status,
        className: e.class.name,
        subject: e.topics[0]?.subject?.name ?? "—",
        topics: e.topics.map((t) => t.name),
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/teachers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher details" },
      { status: 500 }
    );
  }
}
