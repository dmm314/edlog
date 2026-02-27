import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const school = await db.school.findUnique({
      where: { id: user.schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        schoolType: true,
        status: true,
        region: { select: { name: true } },
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
      status: school.status,
      region: school.region.name,
      division: school.division.name,
    });
  } catch (error) {
    console.error("GET /api/school error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    );
  }
}
