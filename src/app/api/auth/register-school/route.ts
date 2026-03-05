export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { schoolRegisterSchema } from "@/lib/validations";

// Generate a cryptographically random school code
// Format: EDL-XXXX-XXXX (8 random chars from unambiguous set)
function generateSchoolCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `EDL-${code.slice(0, 4)}-${code.slice(4)}`;
}

// Try generating a unique code, retrying on collision
async function generateUniqueSchoolCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateSchoolCode();
    const existing = await db.school.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique school code");
}

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
      registrationCode,
      regionId,
      divisionId,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
    } = parsed.data;

    // Validate the registration code
    const regCode = await db.registrationCode.findUnique({
      where: { code: registrationCode },
    });

    if (!regCode) {
      return NextResponse.json(
        { error: "Invalid registration code. Please get a valid code from your Regional Education Admin." },
        { status: 400 }
      );
    }

    if (regCode.usedAt) {
      return NextResponse.json(
        { error: "This registration code has already been used." },
        { status: 400 }
      );
    }

    if (new Date() > regCode.expiresAt) {
      return NextResponse.json(
        { error: "This registration code has expired. Please request a new one from your Regional Admin." },
        { status: 400 }
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

    // Use the region from the registration code to ensure consistency
    const codeRegionId = regCode.regionId;

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

    // Verify the selected region matches the code's region
    if (regionId !== codeRegionId) {
      return NextResponse.json(
        { error: "The selected region does not match the registration code's region. Please select the correct region." },
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

    // Generate a unique, cryptographically random school code
    const schoolCode = await generateUniqueSchoolCode();

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
          divisionId: divisionId || regionId,
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

      // Mark the registration code as used
      await tx.registrationCode.update({
        where: { id: regCode.id },
        data: {
          usedAt: new Date(),
          usedById: user.id,
          schoolId: school.id,
        },
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
