export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const [teacherCount, schoolCount] = await Promise.all([
      db.user.count({
        where: {
          role: "TEACHER",
          teacherSchools: {
            some: {
              school: { regionId: user.regionId },
              status: "ACTIVE",
            },
          },
        },
      }),
      db.school.count({
        where: { regionId: user.regionId },
      }),
    ]);

    return NextResponse.json({ teacherCount, schoolCount });
  } catch (error) {
    console.error("GET /api/regional/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
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
            school: { regionId: user.regionId },
            status: "ACTIVE",
          },
        },
      },
      select: { id: true },
    });

    if (teachers.length === 0) {
      return NextResponse.json({ error: "No active teachers found in your region" }, { status: 400 });
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
    console.error("POST /api/regional/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
