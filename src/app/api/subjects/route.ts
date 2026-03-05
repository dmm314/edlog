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

    const schoolSubjects = await db.schoolSubject.findMany({
      where: { schoolId: user.schoolId },
      include: {
        subject: {
          include: {
            topics: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    const subjects = schoolSubjects.map((ss) => ss.subject);
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
