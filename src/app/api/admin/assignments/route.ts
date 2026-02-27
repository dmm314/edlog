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
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    const [assignments, teachers, classes, classSubjects] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { schoolId: user.schoolId },
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true },
          },
          class: {
            select: { id: true, name: true, level: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { entries: true, periods: true },
          },
        },
        orderBy: [
          { teacher: { lastName: "asc" } },
          { class: { name: "asc" } },
        ],
      }),
      db.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: "TEACHER",
          isVerified: true,
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      }),
      db.class.findMany({
        where: { schoolId: user.schoolId },
        select: { id: true, name: true, level: true },
        orderBy: { name: "asc" },
      }),
      db.classSubject.findMany({
        where: {
          class: { schoolId: user.schoolId },
        },
        include: {
          subject: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    // Build a map of classId -> subjects for the frontend
    const subjectsByClass: Record<string, { id: string; name: string; code: string }[]> = {};
    for (const cs of classSubjects) {
      if (!subjectsByClass[cs.classId]) subjectsByClass[cs.classId] = [];
      subjectsByClass[cs.classId].push(cs.subject);
    }

    // Dedupe all subjects across classes for backward compat
    const allSubjectMap = new Map<string, { id: string; name: string; code: string }>();
    for (const cs of classSubjects) {
      allSubjectMap.set(cs.subject.id, cs.subject);
    }

    return NextResponse.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        teacher: {
          id: a.teacher.id,
          name: `${a.teacher.firstName} ${a.teacher.lastName}`,
        },
        class: {
          id: a.class.id,
          name: a.class.name,
          level: a.class.level,
        },
        subject: {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        },
        entryCount: a._count.entries,
        timetableSlots: a._count.periods,
        createdAt: a.createdAt.toISOString(),
      })),
      teachers,
      classes,
      subjects: Array.from(allSubjectMap.values()),
      subjectsByClass,
    });
  } catch (error) {
    console.error("GET /api/admin/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
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
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { teacherId, classId, subjectId } = body;

    if (!teacherId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Teacher, class, and subject are all required" },
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

    // Verify class belongs to this school
    const cls = await db.class.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    });
    if (!cls) {
      return NextResponse.json(
        { error: "Class not found in your school" },
        { status: 404 }
      );
    }

    // Check for duplicate
    const existing = await db.teacherAssignment.findFirst({
      where: { teacherId, classId, subjectId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This teacher is already assigned to this class and subject" },
        { status: 409 }
      );
    }

    const assignment = await db.teacherAssignment.create({
      data: {
        teacherId,
        classId,
        subjectId,
        schoolId: user.schoolId,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      id: assignment.id,
      teacher: {
        id: assignment.teacher.id,
        name: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
      },
      class: {
        id: assignment.class.id,
        name: assignment.class.name,
        level: assignment.class.level,
      },
      subject: {
        id: assignment.subject.id,
        name: assignment.subject.name,
        code: assignment.subject.code,
      },
      entryCount: 0,
      timetableSlots: 0,
      createdAt: assignment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/admin/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
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

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const assignment = await db.teacherAssignment.findFirst({
      where: { id: assignmentId, schoolId: user.schoolId! },
      include: { _count: { select: { entries: true, periods: true } } },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment._count.entries > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete an assignment with existing logbook entries. Remove entries first.",
        },
        { status: 400 }
      );
    }

    // Delete timetable slots tied to this assignment first
    if (assignment._count.periods > 0) {
      await db.timetableSlot.deleteMany({
        where: { assignmentId },
      });
    }

    await db.teacherAssignment.delete({ where: { id: assignmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
