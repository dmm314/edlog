export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json({ error: "No region assigned" }, { status: 400 });
    }

    const [teacherCount, schoolCount, schools] = await Promise.all([
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
      db.school.findMany({
        where: { regionId: user.regionId, status: "ACTIVE" },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Recent announcements
    const recentAnnouncements = await db.notification.findMany({
      where: {
        type: "REGIONAL_ANNOUNCEMENT",
        senderRole: "REGIONAL_ADMIN",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const seen = new Map<string, { title: string; message: string; createdAt: Date; count: number }>();
    for (const n of recentAnnouncements) {
      const key = `${n.title}|||${n.message}`;
      if (!seen.has(key)) {
        seen.set(key, { title: n.title, message: n.message, createdAt: n.createdAt, count: 1 });
      } else {
        seen.get(key)!.count++;
      }
    }
    const grouped = Array.from(seen.values()).slice(0, 5);

    return NextResponse.json({ teacherCount, schoolCount, schools, recentAnnouncements: grouped });
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
    const { title, message, target, schoolId, teacherId } = body;

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

    const targetMode = target || "all";

    // Target: specific teacher
    if (targetMode === "teacher") {
      if (!teacherId || typeof teacherId !== "string") {
        return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
      }
      // Verify teacher exists in region
      const teacher = await db.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          teacherSchools: {
            some: {
              school: { regionId: user.regionId },
              status: "ACTIVE",
            },
          },
        },
      });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found in your region" }, { status: 404 });
      }

      await db.notification.create({
        data: {
          userId: teacherId,
          type: "REGIONAL_ANNOUNCEMENT",
          title: title.trim(),
          message: message.trim(),
          isRead: false,
          link: null,
          senderRole: "REGIONAL_ADMIN",
          schoolId: null,
        },
      });

      return NextResponse.json({ success: true, teacherCount: 1 });
    }

    // Target: specific school
    if (targetMode === "school") {
      if (!schoolId || typeof schoolId !== "string") {
        return NextResponse.json({ error: "School ID is required" }, { status: 400 });
      }
      // Verify school is in region
      const school = await db.school.findFirst({
        where: { id: schoolId, regionId: user.regionId },
      });
      if (!school) {
        return NextResponse.json({ error: "School not found in your region" }, { status: 404 });
      }

      const teachers = await db.user.findMany({
        where: {
          role: "TEACHER",
          teacherSchools: {
            some: {
              schoolId: schoolId,
              status: "ACTIVE",
            },
          },
        },
        select: { id: true },
      });

      if (teachers.length === 0) {
        return NextResponse.json({ error: "No active teachers found at this school" }, { status: 400 });
      }

      await db.notification.createMany({
        data: teachers.map((t) => ({
          userId: t.id,
          type: "REGIONAL_ANNOUNCEMENT" as const,
          title: title.trim(),
          message: message.trim(),
          isRead: false,
          link: null,
          senderRole: "REGIONAL_ADMIN",
          schoolId: schoolId,
        })),
      });

      return NextResponse.json({ success: true, teacherCount: teachers.length });
    }

    // Target: all teachers in region (default)
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
        type: "REGIONAL_ANNOUNCEMENT" as const,
        title: title.trim(),
        message: message.trim(),
        isRead: false,
        link: null,
        senderRole: "REGIONAL_ADMIN",
        schoolId: null,
      })),
    });

    return NextResponse.json({ success: true, teacherCount: teachers.length });
  } catch (error) {
    console.error("POST /api/regional/notifications/broadcast error:", error);
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
