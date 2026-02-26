import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { schoolRegisterSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schoolRegisterSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const {
      schoolName,
      schoolCode,
      regionId,
      divisionId,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
    } = parsed.data;

    // Check if school code already exists
    const existingSchool = await db.school.findUnique({
      where: { code: schoolCode },
    });
    if (existingSchool) {
      return NextResponse.json(
        { error: "A school with this code already exists. Please choose a different school code." },
        { status: 409 }
      );
    }

    // Check if admin email already exists
    const existingUser = await db.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please use a different email address." },
        { status: 409 }
      );
    }

    // Verify region exists
    const region = await db.region.findUnique({
      where: { id: regionId },
    });
    if (!region) {
      return NextResponse.json(
        { error: "The selected region is invalid." },
        { status: 400 }
      );
    }

    // Verify division exists and belongs to the region (if provided)
    if (divisionId) {
      const division = await db.division.findFirst({
        where: { id: divisionId, regionId },
      });
      if (!division) {
        return NextResponse.json(
          { error: "The selected division does not belong to the chosen region." },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await hash(adminPassword, 12);

    // Create school and admin user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the school
      const school = await tx.school.create({
        data: {
          name: schoolName,
          code: schoolCode,
          regionId,
          divisionId: divisionId || regionId, // fallback if division not provided
          status: "PENDING",
        },
      });

      // Create the admin user
      const user = await tx.user.create({
        data: {
          firstName: adminFirstName,
          lastName: adminLastName,
          email: adminEmail,
          passwordHash,
          role: "SCHOOL_ADMIN",
          isVerified: false,
          schoolId: school.id,
        },
      });

      // Link admin to school
      await tx.school.update({
        where: { id: school.id },
        data: { adminId: user.id },
      });

      return { school, user };
    });

    return NextResponse.json(
      {
        message: "School registered successfully. Your account is pending approval.",
        school: {
          id: result.school.id,
          name: result.school.name,
          code: result.school.code,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("School registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
