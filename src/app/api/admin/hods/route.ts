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

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const hods = await db.headOfDepartment.findMany({
      where: { schoolId: user.schoolId },
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

    // Fetch verified, ACTIVE teachers in this school (via TeacherSchool OR direct schoolId)
    const [directTeachers, memberTeachers] = await Promise.all([
      db.user.findMany({
        where: { schoolId: user.schoolId, role: "TEACHER", isVerified: true },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { lastName: "asc" },
      }),
      db.user.findMany({
        where: {
          teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } },
          role: "TEACHER",
          isVerified: true,
          NOT: { schoolId: user.schoolId },
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { lastName: "asc" },
      }),
    ]);

    // Deduplicate teachers
    const seenIds = new Set<string>();
    const teachers = [...directTeachers, ...memberTeachers].filter((t) => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    // Fetch subjects linked to this school (via SchoolSubject)
    const schoolSubjects = await db.schoolSubject.findMany({
      where: { schoolId: user.schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const subjects = schoolSubjects.map((ss) => ss.subject);

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

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { teacherId, subjectId } = body;

    if (!teacherId || !subjectId) {
      return NextResponse.json(
        { error: "Teacher and subject are required" },
        { status: 400 }
      );
    }

    // Verify teacher belongs to this school (either directly or via TeacherSchool)
    const teacher = await db.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        OR: [
          { schoolId: user.schoolId },
          { teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } } },
        ],
      },
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
