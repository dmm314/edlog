export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";

function generateTeacherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 for readability
  let code = "TCH-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function uniqueTeacherCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateTeacherCode();
    const exists = await db.user.findUnique({ where: { teacherCode: code } });
    if (!exists) return code;
  }
  // Fallback with timestamp suffix
  return `TCH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, schoolCode, dateOfBirth, gender } =
      parsed.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Validate school code
    const school = await db.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      return NextResponse.json(
        { error: "Invalid school code. Please check with your administrator." },
        { status: 400 }
      );
    }

    // Generate unique teacher code
    const teacherCode = await uniqueTeacherCode();

    // Hash password and create user
    // Teachers start unverified — admin must approve them
    const passwordHash = await hash(password, 12);
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        passwordHash,
        role: "TEACHER",
        isVerified: false,
        schoolId: school.id,
        teacherCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
      },
    });

    // Create TeacherSchool record as PENDING — admin must approve
    try {
      await db.teacherSchool.create({
        data: {
          teacherId: user.id,
          schoolId: school.id,
          status: "PENDING",
          isPrimary: true,
        },
      });
    } catch (e) {
      // TeacherSchool table may not exist yet — don't fail registration
      console.warn("TeacherSchool create failed (table may not exist):", (e as Error).message);
    }

    // Notify school admin about the new teacher request
    if (school.adminId) {
      await db.notification.create({
        data: {
          userId: school.adminId,
          type: "NEW_TEACHER",
          title: "New Teacher Registration",
          message: `${firstName} ${lastName} has registered and is awaiting your approval.`,
          link: "/admin/teachers",
        },
      }).catch(() => {}); // Don't fail registration if notification fails
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          teacherCode: user.teacherCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
