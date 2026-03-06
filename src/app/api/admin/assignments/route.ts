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
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    // Run queries individually so one failure doesn't break everything
    const [assignments, teachers, classes, classSubjects, divisions] = await Promise.all([
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
          division: {
            select: { id: true, name: true },
          },
          _count: {
            select: { entries: true, periods: true },
          },
        },
        orderBy: [
          { teacher: { lastName: "asc" } },
          { class: { name: "asc" } },
        ],
      }).catch((e) => { console.error("assignments query failed:", e); return []; }),
      db.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: "TEACHER",
          isVerified: true,
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      }).catch((e) => { console.error("teachers query failed:", e); return []; }),
      db.class.findMany({
        where: { schoolId: user.schoolId },
        select: { id: true, name: true, level: true },
        orderBy: { name: "asc" },
      }).catch((e) => { console.error("classes query failed:", e); return []; }),
      db.classSubject.findMany({
        where: {
          class: { schoolId: user.schoolId },
        },
        include: {
          subject: { select: { id: true, name: true, code: true } },
        },
      }).catch((e) => { console.error("classSubjects query failed:", e); return []; }),
      db.subjectDivision.findMany({
        where: { schoolId: user.schoolId },
        select: { id: true, name: true, subjectId: true },
        orderBy: { name: "asc" },
      }).catch((e) => { console.error("divisions query failed:", e); return []; }),
    ]);

    // Build a map of classId -> subjects for the frontend
    const subjectsByClass: Record<string, { id: string; name: string; code: string }[]> = {};
    for (const cs of classSubjects) {
      if (!subjectsByClass[cs.classId]) subjectsByClass[cs.classId] = [];
      subjectsByClass[cs.classId].push(cs.subject);
    }

    // Build a map of subjectId -> divisions
    const divisionsBySubject: Record<string, { id: string; name: string }[]> = {};
    for (const d of divisions) {
      if (!divisionsBySubject[d.subjectId]) divisionsBySubject[d.subjectId] = [];
      divisionsBySubject[d.subjectId].push({ id: d.id, name: d.name });
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
        division: a.division ? { id: a.division.id, name: a.division.name } : null,
        entryCount: a._count.entries,
        timetableSlots: a._count.periods,
        createdAt: a.createdAt.toISOString(),
      })),
      teachers,
      classes,
      subjects: Array.from(allSubjectMap.values()),
      subjectsByClass,
      divisionsBySubject,
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
    const { teacherId, classId, subjectId, divisionId } = body;

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

    // Verify division belongs to this subject & school (if provided)
    if (divisionId) {
      const division = await db.subjectDivision.findFirst({
        where: { id: divisionId, subjectId, schoolId: user.schoolId },
      });
      if (!division) {
        return NextResponse.json(
          { error: "Division not found for this subject" },
          { status: 404 }
        );
      }
    }

    // Check if teacher already teaches a different subject in this class
    const existingInClass = await db.teacherAssignment.findFirst({
      where: { teacherId, classId, subjectId: { not: subjectId } },
      include: { subject: { select: { name: true } } },
    });
    if (existingInClass) {
      return NextResponse.json(
        { error: `This teacher is already assigned to ${existingInClass.subject.name} in this class. A teacher can only teach one subject per class.` },
        { status: 409 }
      );
    }

    // Check for duplicate (same teacher + class + subject + division)
    const existing = await db.teacherAssignment.findFirst({
      where: { teacherId, classId, subjectId, divisionId: divisionId || null },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This teacher is already assigned to this class and subject" + (divisionId ? " division" : "") },
        { status: 409 }
      );
    }

    const assignment = await db.teacherAssignment.create({
      data: {
        teacherId,
        classId,
        subjectId,
        divisionId: divisionId || null,
        schoolId: user.schoolId,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true, code: true } },
        division: { select: { id: true, name: true } },
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
      division: assignment.division ? { id: assignment.division.id, name: assignment.division.name } : null,
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
