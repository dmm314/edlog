export const dynamic = "force-dynamic";
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

    const school = await db.school.findUnique({
      where: { id: user.schoolId },
      include: {
        region: { select: { name: true, code: true } },
        division: { select: { name: true } },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: school.id,
      name: school.name,
      code: school.code,
      schoolType: school.schoolType,
      principalName: school.principalName,
      principalPhone: school.principalPhone,
      status: school.status,
      profileComplete: school.profileComplete,
      region: school.region.name,
      regionCode: school.region.code,
      division: school.division.name,
      createdAt: school.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/school error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { schoolType, principalName, principalPhone } = body;

    const updated = await db.school.update({
      where: { id: user.schoolId },
      data: {
        ...(schoolType !== undefined && { schoolType }),
        ...(principalName !== undefined && { principalName }),
        ...(principalPhone !== undefined && { principalPhone }),
        profileComplete: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
      schoolType: updated.schoolType,
      principalName: updated.principalName,
      principalPhone: updated.principalPhone,
      status: updated.status,
      profileComplete: updated.profileComplete,
    });
  } catch (error) {
    console.error("PATCH /api/admin/school error:", error);
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}
