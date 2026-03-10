export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await db.assessment.findUnique({
      where: { id: params.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (user.role === "TEACHER" && assessment.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!assessment.corrected) {
      return NextResponse.json(
        { error: "Results must be entered before notifying parents" },
        { status: 400 }
      );
    }

    await db.assessment.update({
      where: { id: params.id },
      data: { notifiedParents: true },
    });

    return NextResponse.json({ success: true, message: "Parents notified" });
  } catch (error) {
    console.error("POST /api/assessments/[id]/notify-parents error:", error);
    return NextResponse.json(
      { error: "Failed to notify parents" },
      { status: 500 }
    );
  }
}
