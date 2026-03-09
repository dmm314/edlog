export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        teacherSchools: {
          some: {
            school: { regionId: user.regionId },
            status: "ACTIVE",
          },
        },
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        school: { select: { name: true } },
      },
      take: 10,
    });

    return NextResponse.json(
      teachers.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        schoolName: t.school?.name || "Unknown",
      }))
    );
  } catch (error) {
    console.error("GET /api/regional/teachers error:", error);
    return NextResponse.json({ error: "Failed to search teachers" }, { status: 500 });
  }
}
