export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hash } from "bcryptjs";

// Generate a unique teacher/coordinator code (TCH-XXXXXX format)
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 for readability
  let code = "TCH-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function uniqueTeacherCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await db.user.findUnique({ where: { teacherCode: code } });
    if (!exists) return code;
  }
  return `TCH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

const VALID_LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

// GET: List all level coordinators at this school
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const coordinators = await db.levelCoordinator.findMany({
      where: { schoolId: user.schoolId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ coordinators });
  } catch (error) {
    console.error("GET /api/admin/coordinators error:", error);
    return NextResponse.json({ error: "Failed to fetch coordinators" }, { status: 500 });
  }
}

// POST: Create or assign a level coordinator
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { title, levels } = body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.trim().length > 100) {
      return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
    }

    // Validate levels
    if (!levels || !Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json({ error: "At least one level is required" }, { status: 400 });
    }
    const invalidLevels = levels.filter((l: string) => !VALID_LEVELS.includes(l));
    if (invalidLevels.length > 0) {
      return NextResponse.json(
        { error: `Invalid levels: ${invalidLevels.join(", ")}. Valid levels: ${VALID_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for level conflicts — a level cannot be assigned to two coordinators at the same school
    const existingCoordinators = await db.levelCoordinator.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      select: { id: true, levels: true, userId: true },
    });

    for (const level of levels) {
      const conflict = existingCoordinators.find(
        (c) => c.levels.includes(level) && c.userId !== body.teacherId
      );
      if (conflict) {
        return NextResponse.json(
          { error: `Level "${level}" is already assigned to another coordinator at this school` },
          { status: 409 }
        );
      }
    }

    // Mode A: Assign an existing teacher
    if (body.teacherId) {
      const { teacherId } = body;

      // Verify teacher belongs to this school
      let teacher = null;
      try {
        teacher = await db.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
            OR: [
              { schoolId: user.schoolId },
              { teacherSchools: { some: { schoolId: user.schoolId!, status: "ACTIVE" } } },
            ],
          },
          select: { id: true, firstName: true, lastName: true, email: true, teacherCode: true },
        });
      } catch {
        teacher = await db.user.findFirst({
          where: { id: teacherId, schoolId: user.schoolId, role: "TEACHER" },
          select: { id: true, firstName: true, lastName: true, email: true, teacherCode: true },
        });
      }

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found in your school" }, { status: 404 });
      }

      // If teacher has no unique ID yet, generate one now
      if (!teacher.teacherCode) {
        const code = await uniqueTeacherCode();
        await db.user.update({ where: { id: teacherId }, data: { teacherCode: code } });
      }

      // Upsert: if this teacher already has a coordinator record at this school, update it
      const existing = await db.levelCoordinator.findUnique({
        where: { userId_schoolId: { userId: teacherId, schoolId: user.schoolId! } },
      });

      if (existing) {
        const updated = await db.levelCoordinator.update({
          where: { id: existing.id },
          data: { title: title.trim(), levels, isActive: true },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        });
        return NextResponse.json({ coordinator: updated });
      }

      const coordinator = await db.levelCoordinator.create({
        data: {
          userId: teacherId,
          schoolId: user.schoolId!,
          title: title.trim(),
          levels,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      return NextResponse.json({ coordinator }, { status: 201 });
    }

    // Mode B: Create a new account for a non-teacher VP
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "email, password, firstName, and lastName are required for creating a new account" },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const emailConflict = await db.user.findUnique({ where: { email } });
    if (emailConflict) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);
    const teacherCode = await uniqueTeacherCode();

    // Create user, TeacherSchool link, and LevelCoordinator in a transaction
    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: "TEACHER",
          isVerified: true,
          schoolId: user.schoolId,
          teacherCode,
        },
      });

      await tx.teacherSchool.create({
        data: {
          teacherId: newUser.id,
          schoolId: user.schoolId!,
          status: "ACTIVE",
          isPrimary: true,
          joinedAt: new Date(),
        },
      });

      const coordinator = await tx.levelCoordinator.create({
        data: {
          userId: newUser.id,
          schoolId: user.schoolId!,
          title: title.trim(),
          levels,
        },
      });

      return { newUser, coordinator };
    });

    return NextResponse.json(
      {
        coordinator: {
          ...result.coordinator,
          user: {
            id: result.newUser.id,
            firstName: result.newUser.firstName,
            lastName: result.newUser.lastName,
            email: result.newUser.email,
            teacherCode: result.newUser.teacherCode,
          },
        },
        credentials: { email, password, teacherCode: result.newUser.teacherCode },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/coordinators error:", error);
    return NextResponse.json({ error: "Failed to create coordinator" }, { status: 500 });
  }
}
