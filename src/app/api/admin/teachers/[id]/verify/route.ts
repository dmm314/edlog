import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
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
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    if (teacher.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.user.update({
      where: { id: params.id },
      data: { isVerified: !teacher.isVerified },
    });

    return NextResponse.json({
      id: updated.id,
      isVerified: updated.isVerified,
    });
  } catch (error) {
    console.error("POST /api/admin/teachers/[id]/verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify teacher" },
      { status: 500 }
    );
  }
}
