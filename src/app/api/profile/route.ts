import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        dateOfBirth: true,
        gender: true,
        photoUrl: true,
        createdAt: true,
        schoolId: true,
        school: { select: { name: true, code: true, foundingDate: true } },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dateOfBirth, gender, photoUrl, phone, foundingDate } = body;

    // Update user fields
    const updateData: Record<string, unknown> = {};
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (gender !== undefined) {
      updateData.gender = gender || null;
    }
    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl || null;
    }
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        gender: true,
        photoUrl: true,
        schoolId: true,
      },
    });

    // If school admin and foundingDate provided, update the school
    let schoolData = null;
    if (user.role === "SCHOOL_ADMIN" && user.schoolId && foundingDate !== undefined) {
      const updatedSchool = await db.school.update({
        where: { id: user.schoolId },
        data: {
          foundingDate: foundingDate ? new Date(foundingDate) : null,
        },
        select: {
          name: true,
          code: true,
          foundingDate: true,
        },
      });
      schoolData = updatedSchool;
    }

    return NextResponse.json({
      ...updated,
      school: schoolData,
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
