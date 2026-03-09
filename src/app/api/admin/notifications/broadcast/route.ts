export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherCount = await db.user.count({
      where: {
        role: "TEACHER",
        teacherSchools: {
          some: {
            schoolId: user.schoolId!,
            status: "ACTIVE",
          },
        },
      },
    });

    return NextResponse.json({ teacherCount });
  } catch (error) {
    console.error("GET /api/admin/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher count" }, { status: 500 });
  }
}

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

    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        teacherSchools: {
          some: {
            schoolId: user.schoolId,
            status: "ACTIVE",
          },
        },
      },
      select: { id: true },
    });

    if (teachers.length === 0) {
      return NextResponse.json({ error: "No active teachers found" }, { status: 400 });
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
    console.error("POST /api/admin/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
