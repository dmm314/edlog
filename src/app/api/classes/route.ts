export const dynamic = "force-dynamic";
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

    const currentYear = new Date().getFullYear();

    const classes = await db.class.findMany({
      where: {
        schoolId: user.schoolId,
        year: { gte: currentYear - 1 },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
