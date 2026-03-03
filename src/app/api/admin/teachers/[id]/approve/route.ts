import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST: Approve or reject a teacher
// Body: { action: "approve" | "reject" }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const { id: teacherId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the TeacherSchool membership
    const membership = await db.teacherSchool.findFirst({
      where: {
        teacherId,
        schoolId: user.schoolId,
        status: "PENDING",
      },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No pending request found for this teacher" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // Approve: set membership to ACTIVE, verify the teacher, set joinedAt
      await db.$transaction([
        db.teacherSchool.update({
          where: { id: membership.id },
          data: { status: "ACTIVE", joinedAt: new Date() },
        }),
        db.user.update({
          where: { id: teacherId },
          data: { isVerified: true },
        }),
        db.notification.create({
          data: {
            userId: teacherId,
            type: "GENERAL",
            title: "Registration Approved",
            message: "Your registration has been approved. You can now use all features.",
            link: "/dashboard",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `${membership.teacher.firstName} ${membership.teacher.lastName} has been approved`,
      });
    } else {
      // Reject: set membership to REMOVED, keep user unverified
      await db.$transaction([
        db.teacherSchool.update({
          where: { id: membership.id },
          data: { status: "REMOVED" },
        }),
        db.notification.create({
          data: {
            userId: teacherId,
            type: "GENERAL",
            title: "Registration Not Approved",
            message: "Your registration request was not approved. Please contact your school administrator.",
            link: "/profile",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `${membership.teacher.firstName} ${membership.teacher.lastName} has been rejected`,
      });
    }
  } catch (error) {
    console.error("POST /api/admin/teachers/[id]/approve error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
