// ============================================================
// SUBJECTS API — /api/admin/subjects
// ============================================================
//
// Manages the school-level subject catalog (which global subjects
// are available at this school).
//
// ENDPOINTS:
//   GET    — List all global subjects + which ones are linked to
//            this school. Also returns divisions per subject.
//   POST   — Link a global subject to this school (body: { subjectId })
//   DELETE — Unlink a subject (query: ?subjectId=xxx)
//            Also removes any SubjectDivisions for that subject.
//            Blocked if teacher assignments exist.
//
// NOTE: This is SCHOOL-level linking. CLASS-level subject
// assignment is handled by api/admin/classes/[classId]/subjects.
//
// RELATED FILES:
//   - Schema:     prisma/schema.prisma (SchoolSubject, Subject)
//   - Seed data:  prisma/seed/curriculum-other.ts (subject definitions)
//   - Divisions:  api/admin/divisions/route.ts
// ============================================================

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

    // Get all divisions for this school, grouped by subject
    const divisions = await db.subjectDivision.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true, name: true, subjectId: true, levels: true },
      orderBy: { name: "asc" },
    });

    const divisionsBySubject: Record<string, { id: string; name: string; levels: string[] }[]> = {};
    for (const d of divisions) {
      if (!divisionsBySubject[d.subjectId]) divisionsBySubject[d.subjectId] = [];
      divisionsBySubject[d.subjectId].push({ id: d.id, name: d.name, levels: d.levels });
    }

    return NextResponse.json({
      subjects: allSubjects.map((s) => ({
        ...s,
        linked: linkedIds.has(s.id),
        divisions: divisionsBySubject[s.id] || [],
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

    // Also remove any divisions for this subject
    await db.subjectDivision.deleteMany({
      where: { schoolId: user.schoolId, subjectId },
    });

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
