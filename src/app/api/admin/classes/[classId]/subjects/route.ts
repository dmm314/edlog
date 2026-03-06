export const dynamic = "force-dynamic";
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

    // Get all global subjects so every class can toggle any subject
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

    // Get divisions for each subject (school-specific), filtered by class level
    const divisions = await db.subjectDivision.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true, name: true, subjectId: true, levels: true },
      orderBy: { name: "asc" },
    }).catch(() => [] as { id: string; name: string; subjectId: string; levels: string[] }[]);

    const divisionsBySubject: Record<string, { id: string; name: string; levels: string[] }[]> = {};
    for (const d of divisions) {
      // Only include divisions that apply to this class's level (empty levels = all levels)
      if (d.levels.length === 0 || d.levels.includes(cls.level)) {
        if (!divisionsBySubject[d.subjectId]) divisionsBySubject[d.subjectId] = [];
        divisionsBySubject[d.subjectId].push({ id: d.id, name: d.name, levels: d.levels });
      }
    }

    // Get other classes in this school (for "copy from" feature)
    const otherClasses = await db.class.findMany({
      where: { schoolId: user.schoolId, NOT: { id: params.classId } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Get subject counts per class (for copy from)
    const otherClassSubjects = await db.classSubject.findMany({
      where: {
        class: { schoolId: user.schoolId },
        NOT: { classId: params.classId },
      },
      select: { classId: true, subjectId: true },
    });

    const subjectCountByClass: Record<string, number> = {};
    const subjectIdsByClass: Record<string, string[]> = {};
    for (const cs of otherClassSubjects) {
      subjectCountByClass[cs.classId] = (subjectCountByClass[cs.classId] || 0) + 1;
      if (!subjectIdsByClass[cs.classId]) subjectIdsByClass[cs.classId] = [];
      subjectIdsByClass[cs.classId].push(cs.subjectId);
    }

    return NextResponse.json({
      className: cls.name,
      classLevel: cls.level,
      subjects: allSubjects.map((s) => ({
        ...s,
        linked: linkedIds.has(s.id),
        divisions: divisionsBySubject[s.id] || [],
      })),
      linkedCount: linkedIds.size,
      otherClasses: otherClasses.map((c) => ({
          id: c.id,
          name: c.name,
          subjectCount: subjectCountByClass[c.id] || 0,
          subjectIds: subjectIdsByClass[c.id] || [],
        })),
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
