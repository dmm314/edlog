export const dynamic = "force-dynamic";
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

    // Verify the teacher exists and belongs to this school (direct or via TeacherSchool)
    const teacher = await db.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        OR: [
          { schoolId: user.schoolId },
          { teacherSchools: { some: { schoolId: user.schoolId!, status: { in: ["PENDING", "ACTIVE"] } } } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, isVerified: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found in your school" },
        { status: 404 }
      );
    }

    // Try TeacherSchool-based approval first
    let usedTeacherSchool = false;
    try {
      const membership = await db.teacherSchool.findFirst({
        where: {
          teacherId,
          schoolId: user.schoolId,
          status: "PENDING",
        },
      });

      if (membership) {
        usedTeacherSchool = true;
        if (action === "approve") {
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
                link: "/logbook",
              },
            }),
          ]);
        } else {
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
        }
      }
    } catch (e) {
      // TeacherSchool table might not exist — fall through to direct approach
      console.warn("TeacherSchool approve query failed:", (e as Error).message);
    }

    // Fallback: direct approval without TeacherSchool
    if (!usedTeacherSchool) {
      if (action === "approve") {
        await db.user.update({
          where: { id: teacherId },
          data: { isVerified: true },
        });

        // Try creating/updating TeacherSchool record
        try {
          await db.teacherSchool.upsert({
            where: {
              teacherId_schoolId: { teacherId, schoolId: user.schoolId! },
            },
            update: { status: "ACTIVE", joinedAt: new Date() },
            create: {
              teacherId,
              schoolId: user.schoolId!,
              status: "ACTIVE",
              isPrimary: true,
              joinedAt: new Date(),
            },
          });
        } catch {
          // TeacherSchool table may not exist — that's OK
        }

        await db.notification.create({
          data: {
            userId: teacherId,
            type: "GENERAL",
            title: "Registration Approved",
            message: "Your registration has been approved. You can now use all features.",
            link: "/logbook",
          },
        }).catch(() => {});
      } else {
        await db.user.update({
          where: { id: teacherId },
          data: { isVerified: false },
        });

        try {
          await db.teacherSchool.updateMany({
            where: { teacherId, schoolId: user.schoolId! },
            data: { status: "REMOVED" },
          });
        } catch {
          // TeacherSchool table may not exist
        }

        await db.notification.create({
          data: {
            userId: teacherId,
            type: "GENERAL",
            title: "Registration Not Approved",
            message: "Your registration request was not approved. Please contact your school administrator.",
            link: "/profile",
          },
        }).catch(() => {});
      }
    }

    const actionWord = action === "approve" ? "approved" : "rejected";
    return NextResponse.json({
      success: true,
      message: `${teacher.firstName} ${teacher.lastName} has been ${actionWord}`,
    });
  } catch (error) {
    console.error("POST /api/admin/teachers/[id]/approve error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
