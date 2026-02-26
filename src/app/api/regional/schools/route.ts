import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
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

    const schools = await db.school.findMany({
      where: { regionId: user.regionId },
      include: {
        division: { select: { name: true } },
        admin: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            teachers: { where: { role: "TEACHER" } },
          },
        },
        teachers: {
          where: { role: "TEACHER" },
          select: {
            _count: { select: { entries: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = schools.map((school) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      schoolType: school.schoolType,
      status: school.status,
      division: school.division.name,
      principalName: school.principalName,
      principalPhone: school.principalPhone,
      admin: school.admin
        ? {
            name: `${school.admin.firstName} ${school.admin.lastName}`,
            email: school.admin.email,
          }
        : null,
      teacherCount: school._count.teachers,
      entryCount: school.teachers.reduce(
        (sum, t) => sum + t._count.entries,
        0
      ),
      createdAt: school.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/regional/schools error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { schoolId, status } = body;

    if (!schoolId || !status) {
      return NextResponse.json(
        { error: "schoolId and status are required" },
        { status: 400 }
      );
    }

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json(
        { error: "Status must be ACTIVE or SUSPENDED" },
        { status: 400 }
      );
    }

    // Verify school belongs to this region
    const school = await db.school.findFirst({
      where: { id: schoolId, regionId: user.regionId },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found in your region" },
        { status: 404 }
      );
    }

    const updated = await db.school.update({
      where: { id: schoolId },
      data: { status },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("PATCH /api/regional/schools error:", error);
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}
