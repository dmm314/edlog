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

    // Get all global subjects
    const allSubjects = await db.subject.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, category: true },
    });

    // Get subjects already linked to this school
    const schoolSubjects = await db.schoolSubject.findMany({
      where: { schoolId: user.schoolId },
      select: { subjectId: true },
    });

    const linkedIds = new Set(schoolSubjects.map((ss) => ss.subjectId));

    return NextResponse.json({
      subjects: allSubjects.map((s) => ({
        ...s,
        linked: linkedIds.has(s.id),
      })),
      linkedCount: linkedIds.size,
    });
  } catch (error) {
    console.error("GET /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { subjectId } = body;

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Check if already linked
    const existing = await db.schoolSubject.findFirst({
      where: { schoolId: user.schoolId, subjectId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Subject already added" },
        { status: 409 }
      );
    }

    await db.schoolSubject.create({
      data: { schoolId: user.schoolId, subjectId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to add subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Check if any assignments use this subject in this school
    const assignmentCount = await db.teacherAssignment.count({
      where: { schoolId: user.schoolId, subjectId },
    });

    if (assignmentCount > 0) {
      return NextResponse.json(
        { error: "Cannot remove subject that has teacher assignments. Remove assignments first." },
        { status: 400 }
      );
    }

    await db.schoolSubject.deleteMany({
      where: { schoolId: user.schoolId, subjectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to remove subject" },
      { status: 500 }
    );
  }
}
