import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET: List all HODs for the school
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hods = await db.headOfDepartment.findMany({
      where: { schoolId: user.schoolId! },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    // Also fetch available teachers (teachers in this school)
    const teachers = await db.user.findMany({
      where: { schoolId: user.schoolId, role: "TEACHER", isVerified: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    });

    // Fetch subjects that have assignments in this school
    const subjects = await db.subject.findMany({
      where: {
        assignments: { some: { schoolId: user.schoolId! } },
      },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ hods, teachers, subjects });
  } catch (error) {
    console.error("GET /api/admin/hods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HODs" },
      { status: 500 }
    );
  }
}

// POST: Assign a teacher as HOD for a subject
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teacherId, subjectId } = body;

    if (!teacherId || !subjectId) {
      return NextResponse.json(
        { error: "Teacher and subject are required" },
        { status: 400 }
      );
    }

    // Verify teacher belongs to this school
    const teacher = await db.user.findFirst({
      where: { id: teacherId, schoolId: user.schoolId, role: "TEACHER" },
    });
    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found in your school" },
        { status: 404 }
      );
    }

    // Check if an HOD already exists for this subject at this school
    const existing = await db.headOfDepartment.findUnique({
      where: {
        schoolId_subjectId: {
          schoolId: user.schoolId!,
          subjectId,
        },
      },
    });

    if (existing) {
      // Update the existing HOD assignment
      const updated = await db.headOfDepartment.update({
        where: { id: existing.id },
        data: { teacherId },
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
        },
      });
      return NextResponse.json(updated);
    }

    const hod = await db.headOfDepartment.create({
      data: {
        teacherId,
        subjectId,
        schoolId: user.schoolId!,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json(hod, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/hods error:", error);
    return NextResponse.json(
      { error: "Failed to assign HOD" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an HOD assignment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const hod = await db.headOfDepartment.findUnique({ where: { id } });
    if (!hod || hod.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.headOfDepartment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/hods error:", error);
    return NextResponse.json(
      { error: "Failed to remove HOD" },
      { status: 500 }
    );
  }
}
