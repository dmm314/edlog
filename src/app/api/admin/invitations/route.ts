import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET: List all teacher-school relationships for this school
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.teacherSchool.findMany({
      where: { schoolId: user.schoolId! },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherCode: true,
            photoUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("GET /api/admin/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST: Invite a teacher by their teacher code
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teacherCode } = body;

    if (!teacherCode || typeof teacherCode !== "string") {
      return NextResponse.json(
        { error: "Teacher code is required" },
        { status: 400 }
      );
    }

    // Find teacher by code
    const teacher = await db.user.findUnique({
      where: { teacherCode: teacherCode.trim().toUpperCase() },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "No teacher found with this code. Please verify the code." },
        { status: 404 }
      );
    }

    if (teacher.role !== "TEACHER") {
      return NextResponse.json(
        { error: "This code does not belong to a teacher account" },
        { status: 400 }
      );
    }

    // Check if membership already exists
    const existing = await db.teacherSchool.findUnique({
      where: {
        teacherId_schoolId: {
          teacherId: teacher.id,
          schoolId: user.schoolId!,
        },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { error: "This teacher is already in your school" },
          { status: 409 }
        );
      }
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "An invitation is already pending for this teacher" },
          { status: 409 }
        );
      }
      // REMOVED status — re-invite
      await db.teacherSchool.update({
        where: { id: existing.id },
        data: { status: "PENDING", joinedAt: null },
      });
    } else {
      await db.teacherSchool.create({
        data: {
          teacherId: teacher.id,
          schoolId: user.schoolId!,
          status: "PENDING",
          isPrimary: false,
        },
      });
    }

    // Send notification to the teacher
    const school = await db.school.findUnique({
      where: { id: user.schoolId! },
      select: { name: true },
    });

    await db.notification.create({
      data: {
        userId: teacher.id,
        type: "SCHOOL_INVITATION",
        title: "School Invitation",
        message: `${school?.name ?? "A school"} has invited you to join as a teacher. Tap to respond.`,
        link: "/invitations",
      },
    });

    return NextResponse.json({
      success: true,
      teacher: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherCode: teacher.teacherCode,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a teacher from the school
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

    const membership = await db.teacherSchool.findUnique({ where: { id } });
    if (!membership || membership.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Soft-remove instead of hard delete (keeps audit trail)
    await db.teacherSchool.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to remove teacher" },
      { status: 500 }
    );
  }
}
