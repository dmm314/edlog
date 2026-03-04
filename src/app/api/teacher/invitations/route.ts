import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET: List all school memberships/invitations for this teacher
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.teacherSchool.findMany({
      where: {
        teacherId: user.id,
        status: { in: ["PENDING", "ACTIVE"] },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            schoolType: true,
            region: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    // Fetch the actual teacherCode from DB
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { teacherCode: true },
    });

    return NextResponse.json({
      memberships,
      teacherCode: fullUser?.teacherCode ?? null,
    });
  } catch (error) {
    console.error("GET /api/teacher/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST: Accept or decline an invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { membershipId, action } = body;

    if (!membershipId || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "membershipId and action (accept/decline) are required" },
        { status: 400 }
      );
    }

    const membership = await db.teacherSchool.findUnique({
      where: { id: membershipId },
      include: { school: { select: { name: true } } },
    });

    if (!membership || membership.teacherId !== user.id) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (membership.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation has already been responded to" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      await db.teacherSchool.update({
        where: { id: membershipId },
        data: {
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });

      // If teacher has no primary school yet, set this one
      const primaryExists = await db.teacherSchool.findFirst({
        where: { teacherId: user.id, isPrimary: true, status: "ACTIVE" },
      });

      if (!primaryExists) {
        await db.teacherSchool.update({
          where: { id: membershipId },
          data: { isPrimary: true },
        });
      }

      return NextResponse.json({
        success: true,
        message: `You have joined ${membership.school.name}`,
      });
    } else {
      // Decline
      await db.teacherSchool.update({
        where: { id: membershipId },
        data: { status: "REMOVED" },
      });

      return NextResponse.json({
        success: true,
        message: `Invitation from ${membership.school.name} declined`,
      });
    }
  } catch (error) {
    console.error("POST /api/teacher/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}
