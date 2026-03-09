export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hodAssignments = await db.headOfDepartment.findMany({
      where: { teacherId: user.id },
      select: { subjectId: true },
    });

    if (hodAssignments.length === 0) {
      return NextResponse.json({ error: "Not an HOD" }, { status: 403 });
    }

    const hodSubjectIds = hodAssignments.map((h) => h.subjectId);

    const teacherCount = await db.user.count({
      where: {
        role: "TEACHER",
        id: { not: user.id },
        schoolId: user.schoolId,
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
    });

    return NextResponse.json({ teacherCount });
  } catch (error) {
    console.error("GET /api/hod/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher count" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hodAssignments = await db.headOfDepartment.findMany({
      where: { teacherId: user.id },
      include: { subject: { select: { name: true } } },
    });

    if (hodAssignments.length === 0) {
      return NextResponse.json({ error: "Not an HOD" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.length > 100) {
      return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: "Message must be 500 characters or less" }, { status: 400 });
    }

    const hodSubjectIds = hodAssignments.map((h) => h.subjectId);

    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        id: { not: user.id },
        schoolId: user.schoolId,
        assignments: { some: { subjectId: { in: hodSubjectIds } } },
      },
      select: { id: true },
    });

    if (teachers.length === 0) {
      return NextResponse.json({ error: "No teachers found in your department" }, { status: 400 });
    }

    await db.notification.createMany({
      data: teachers.map((t) => ({
        userId: t.id,
        type: "GENERAL" as const,
        title: title.trim(),
        message: message.trim(),
        isRead: false,
        link: null,
      })),
    });

    return NextResponse.json({ success: true, teacherCount: teachers.length });
  } catch (error) {
    console.error("POST /api/hod/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
