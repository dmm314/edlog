export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Helper: get coordinator + class IDs scoped to their levels
async function getCoordinatorContext(userId: string, schoolId?: string | null) {
  const coordinator = await db.levelCoordinator.findFirst({
    where: { userId, isActive: true, ...(schoolId ? { schoolId } : {}) },
  });
  if (!coordinator) return null;

  const classes = await db.class.findMany({
    where: { schoolId: coordinator.schoolId, level: { in: coordinator.levels } },
    select: { id: true },
  });

  return { coordinator, classIds: classes.map((c) => c.id) };
}

// GET: return teacher count at this level + recent announcements
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getCoordinatorContext(user.id, user.schoolId);
    if (!ctx) return NextResponse.json({ error: "No coordinator role" }, { status: 403 });

    const { coordinator, classIds } = ctx;

    const [teacherRows, recentNotifications] = await Promise.all([
      db.teacherAssignment.findMany({
        where: { classId: { in: classIds }, schoolId: coordinator.schoolId },
        select: { teacherId: true },
        distinct: ["teacherId"],
      }),
      db.notification.findMany({
        where: { type: "SCHOOL_ANNOUNCEMENT", schoolId: coordinator.schoolId, senderRole: "LEVEL_COORDINATOR" },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const teacherCount = teacherRows.length;

    // Deduplicate broadcast copies by title+message
    const seen = new Map<string, { title: string; message: string; createdAt: Date; count: number }>();
    for (const n of recentNotifications) {
      const key = `${n.title}|||${n.message}`;
      if (!seen.has(key)) {
        seen.set(key, { title: n.title, message: n.message, createdAt: n.createdAt, count: 1 });
      } else {
        seen.get(key)!.count++;
      }
    }

    return NextResponse.json({
      teacherCount,
      levels: coordinator.levels,
      recentAnnouncements: Array.from(seen.values()).slice(0, 20),
    });
  } catch (error) {
    console.error("GET /api/coordinator/announcements error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST: broadcast announcement to teachers at coordinator's levels
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getCoordinatorContext(user.id, user.schoolId);
    if (!ctx) return NextResponse.json({ error: "No coordinator role" }, { status: 403 });

    const { coordinator, classIds } = ctx;
    const body = await request.json();
    const { title, message, teacherId: targetTeacherId } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (title.length > 100) return NextResponse.json({ error: "Title max 100 characters" }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (message.length > 500) return NextResponse.json({ error: "Message max 500 characters" }, { status: 400 });

    let recipientIds: string[];

    if (targetTeacherId) {
      // Direct message: verify teacher is assigned within coordinator's scope
      const assignment = await db.teacherAssignment.findFirst({
        where: { teacherId: targetTeacherId, classId: { in: classIds }, schoolId: coordinator.schoolId },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Teacher not found in your scope" }, { status: 400 });
      }
      recipientIds = [targetTeacherId];
    } else {
      // Broadcast: get distinct teachers at this coordinator's levels
      const teacherRows = await db.teacherAssignment.findMany({
        where: { classId: { in: classIds }, schoolId: coordinator.schoolId },
        select: { teacherId: true },
        distinct: ["teacherId"],
      });
      if (teacherRows.length === 0) {
        return NextResponse.json({ error: "No teachers found at your levels" }, { status: 400 });
      }
      recipientIds = teacherRows.map((r) => r.teacherId);
    }

    await db.notification.createMany({
      data: recipientIds.map((id) => ({
        userId: id,
        type: "SCHOOL_ANNOUNCEMENT",
        title: title.trim(),
        message: message.trim(),
        senderRole: "LEVEL_COORDINATOR",
        schoolId: coordinator.schoolId,
      })),
    });

    return NextResponse.json({ teacherCount: recipientIds.length });
  } catch (error) {
    console.error("POST /api/coordinator/announcements error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
