import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    // Verify class belongs to this school
    const cls = await db.class.findFirst({
      where: { id: params.classId, schoolId: user.schoolId },
    });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get all global subjects
    const allSubjects = await db.subject.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, category: true },
    });

    // Get subjects already linked to this class
    const classSubjects = await db.classSubject.findMany({
      where: { classId: params.classId },
      select: { subjectId: true },
    });

    const linkedIds = new Set(classSubjects.map((cs) => cs.subjectId));

    return NextResponse.json({
      className: cls.name,
      classLevel: cls.level,
      subjects: allSubjects.map((s) => ({
        ...s,
        linked: linkedIds.has(s.id),
      })),
      linkedCount: linkedIds.size,
    });
  } catch (error) {
    console.error("GET /api/admin/classes/[classId]/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    // Verify class belongs to this school
    const cls = await db.class.findFirst({
      where: { id: params.classId, schoolId: user.schoolId },
    });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const body = await request.json();
    const { subjectIds } = body as { subjectIds?: string[] };

    if (!subjectIds || !Array.isArray(subjectIds)) {
      return NextResponse.json(
        { error: "subjectIds array is required" },
        { status: 400 }
      );
    }

    // Add all subjects that aren't already linked
    const existing = await db.classSubject.findMany({
      where: { classId: params.classId },
      select: { subjectId: true },
    });
    const existingIds = new Set(existing.map((e) => e.subjectId));

    const toAdd = subjectIds.filter((id) => !existingIds.has(id));

    if (toAdd.length > 0) {
      await db.classSubject.createMany({
        data: toAdd.map((subjectId) => ({
          classId: params.classId,
          subjectId,
        })),
      });
    }

    // Also ensure school-level link exists (for backwards compatibility)
    const schoolSubjects = await db.schoolSubject.findMany({
      where: { schoolId: user.schoolId },
      select: { subjectId: true },
    });
    const schoolLinked = new Set(schoolSubjects.map((ss) => ss.subjectId));

    const schoolToAdd = subjectIds.filter((id) => !schoolLinked.has(id));
    if (schoolToAdd.length > 0) {
      await db.schoolSubject.createMany({
        data: schoolToAdd.map((subjectId) => ({
          schoolId: user.schoolId!,
          subjectId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, added: toAdd.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/classes/[classId]/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to add subjects" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    // Verify class belongs to this school
    const cls = await db.class.findFirst({
      where: { id: params.classId, schoolId: user.schoolId },
    });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    // Check if any assignments use this subject+class combo
    const assignmentCount = await db.teacherAssignment.count({
      where: { classId: params.classId, subjectId },
    });

    if (assignmentCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot remove a subject that has teacher assignments in this class. Remove assignments first.",
        },
        { status: 400 }
      );
    }

    await db.classSubject.deleteMany({
      where: { classId: params.classId, subjectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/classes/[classId]/subjects error:", error);
    return NextResponse.json(
      { error: "Failed to remove subject" },
      { status: 500 }
    );
  }
}
