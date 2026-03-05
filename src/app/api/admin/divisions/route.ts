export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET: List all divisions for the school, grouped by subject
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const divisions = await db.subjectDivision.findMany({
      where: { schoolId: user.schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ subject: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({
      divisions: divisions.map((d) => ({
        id: d.id,
        name: d.name,
        subjectId: d.subjectId,
        subjectName: d.subject.name,
        subjectCode: d.subject.code,
        assignmentCount: d._count.assignments,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/divisions error:", error);
    return NextResponse.json({ error: "Failed to fetch divisions" }, { status: 500 });
  }
}

// POST: Create a new division for a subject
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
    const { subjectId, name } = body;

    if (!subjectId || !name?.trim()) {
      return NextResponse.json(
        { error: "Subject and division name are required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Verify subject exists
    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check for duplicate
    const existing = await db.subjectDivision.findFirst({
      where: { schoolId: user.schoolId, subjectId, name: trimmedName },
    });
    if (existing) {
      return NextResponse.json(
        { error: `"${trimmedName}" already exists under ${subject.name}` },
        { status: 409 }
      );
    }

    const division = await db.subjectDivision.create({
      data: {
        name: trimmedName,
        subjectId,
        schoolId: user.schoolId,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(
      {
        id: division.id,
        name: division.name,
        subjectId: division.subjectId,
        subjectName: division.subject.name,
        subjectCode: division.subject.code,
        assignmentCount: 0,
        createdAt: division.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/divisions error:", error);
    return NextResponse.json({ error: "Failed to create division" }, { status: 500 });
  }
}

// DELETE: Remove a division (only if no assignments use it)
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get("id");

    if (!divisionId) {
      return NextResponse.json({ error: "Division ID is required" }, { status: 400 });
    }

    const division = await db.subjectDivision.findFirst({
      where: { id: divisionId, schoolId: user.schoolId! },
      include: { _count: { select: { assignments: true } } },
    });

    if (!division) {
      return NextResponse.json({ error: "Division not found" }, { status: 404 });
    }

    if (division._count.assignments > 0) {
      return NextResponse.json(
        { error: "Cannot delete a division with teacher assignments. Remove assignments first." },
        { status: 400 }
      );
    }

    await db.subjectDivision.delete({ where: { id: divisionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/divisions error:", error);
    return NextResponse.json({ error: "Failed to delete division" }, { status: 500 });
  }
}
