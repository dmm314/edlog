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

    // Try to fetch HODs — table may not exist yet
    let hods: Array<{
      id: string;
      teacher: { id: string; firstName: string; lastName: string; email: string; photoUrl: string | null };
      subject: { id: string; name: string; code: string };
    }> = [];

    try {
      hods = await db.headOfDepartment.findMany({
        where: { schoolId: user.schoolId },
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { subject: { name: "asc" } },
      });
    } catch (e) {
      console.warn("HeadOfDepartment query failed (table may not exist):", (e as Error).message);
    }

    // Fetch teachers — try TeacherSchool first, fall back to direct schoolId
    let teachers: Array<{ id: string; firstName: string; lastName: string; email: string }> = [];

    try {
      // Get both direct + TeacherSchool members
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
        }).catch(() => [] as Array<{ id: string; firstName: string; lastName: string; email: string }>),
      ]);

      const seenIds = new Set<string>();
      teachers = [...directTeachers, ...memberTeachers].filter((t) => {
        if (seenIds.has(t.id)) return false;
        seenIds.add(t.id);
        return true;
      });
    } catch {
      // Fall back to just direct schoolId teachers
      teachers = await db.user.findMany({
        where: { schoolId: user.schoolId, role: "TEACHER", isVerified: true },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { lastName: "asc" },
      });
    }

    // Fetch subjects — try SchoolSubject first, fall back to assignments, then all subjects
    let subjects: Array<{ id: string; name: string; code: string }> = [];

    try {
      const schoolSubjects = await db.schoolSubject.findMany({
        where: { schoolId: user.schoolId },
        include: { subject: { select: { id: true, name: true, code: true } } },
        orderBy: { subject: { name: "asc" } },
      });

      if (schoolSubjects.length > 0) {
        subjects = schoolSubjects.map((ss) => ss.subject);
      } else {
        // No school subjects linked — try subjects with assignments
        subjects = await db.subject.findMany({
          where: { assignments: { some: { schoolId: user.schoolId! } } },
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        });
      }
    } catch {
      // Fall back to all subjects
      subjects = await db.subject.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });
    }

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

    // Verify teacher belongs to this school (directly or via TeacherSchool)
    let teacher;
    try {
      teacher = await db.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          OR: [
            { schoolId: user.schoolId },
            { teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } } },
          ],
        },
      });
    } catch {
      // TeacherSchool may not exist — fall back to direct check
      teacher = await db.user.findFirst({
        where: { id: teacherId, schoolId: user.schoolId, role: "TEACHER" },
      });
    }

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
