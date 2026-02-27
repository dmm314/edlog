import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json(
        { error: "No region assigned" },
        { status: 400 }
      );
    }

    const { id } = await params;

    const school = await db.school.findFirst({
      where: { id, regionId: user.regionId },
      include: {
        region: { select: { name: true, code: true } },
        division: { select: { name: true } },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            level: true,
            stream: true,
            section: true,
            year: true,
            _count: { select: { entries: true, assignments: true } },
          },
          orderBy: { name: "asc" },
        },
        teachers: {
          where: { role: "TEACHER" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isVerified: true,
            _count: { select: { entries: true } },
            assignments: {
              select: {
                subject: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
          orderBy: { lastName: "asc" },
        },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found in your region" },
        { status: 404 }
      );
    }

    // Count total entries
    const totalEntries = school.teachers.reduce(
      (sum, t) => sum + t._count.entries,
      0
    );

    const result = {
      id: school.id,
      name: school.name,
      code: school.code,
      schoolType: school.schoolType,
      status: school.status,
      principalName: school.principalName,
      principalPhone: school.principalPhone,
      profileComplete: school.profileComplete,
      region: school.region.name,
      regionCode: school.region.code,
      division: school.division.name,
      createdAt: school.createdAt.toISOString(),
      admin: school.admin
        ? {
            id: school.admin.id,
            name: `${school.admin.firstName} ${school.admin.lastName}`,
            email: school.admin.email,
            phone: school.admin.phone,
          }
        : null,
      classes: school.classes.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        stream: c.stream,
        section: c.section,
        year: c.year,
        entryCount: c._count.entries,
        teacherCount: c._count.assignments,
      })),
      teachers: school.teachers.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        isVerified: t.isVerified,
        entryCount: t._count.entries,
        subjects: Array.from(new Set(t.assignments.map((a) => a.subject.name))),
        classes: Array.from(new Set(t.assignments.map((a) => a.class.name))),
      })),
      subjects: school.subjects.map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        code: s.subject.code,
      })),
      totalEntries,
      teacherCount: school.teachers.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/regional/schools/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school details" },
      { status: 500 }
    );
  }
}
