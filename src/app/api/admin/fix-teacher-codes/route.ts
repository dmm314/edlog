export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function generateTeacherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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
  return `TCH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all users without a teacher code in this school
    const usersWithoutCode = await db.user.findMany({
      where: {
        teacherCode: null,
        schoolId: user.schoolId ?? undefined,
        role: "TEACHER",
      },
      select: { id: true },
    });

    if (usersWithoutCode.length === 0) {
      return NextResponse.json({ updated: 0, message: "All accounts already have codes" });
    }

    let updated = 0;
    for (const u of usersWithoutCode) {
      const code = await uniqueTeacherCode();
      await db.user.update({
        where: { id: u.id },
        data: { teacherCode: code },
      });
      updated++;
    }

    return NextResponse.json({ updated, message: `Assigned codes to ${updated} account(s)` });
  } catch (error) {
    console.error("fix-teacher-codes error:", error);
    return NextResponse.json({ error: "Failed to fix teacher codes" }, { status: 500 });
  }
}
