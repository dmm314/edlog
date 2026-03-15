export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
      include: {
        class: { select: { name: true, level: true, schoolId: true } },
        teacher: { select: { firstName: true, lastName: true } },
        assignment: { include: { subject: { select: { name: true } } } },
        topics: { include: { subject: { select: { name: true } } } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Ensure admin belongs to this school (scoped by class, not teacher primary school)
    if (entry.class.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subjectName =
      entry.assignment?.subject?.name ||
      entry.topics?.[0]?.subject?.name ||
      "Unknown subject";
    const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
    const className = entry.class?.name || "Unknown class";
    const level = entry.class?.level;
    const date = new Date(entry.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Find the coordinator for this entry's class level
    const coordinator = level
      ? await db.levelCoordinator.findFirst({
          where: {
            schoolId: user.schoolId ?? undefined,
            levels: { has: level },
            isActive: true,
          },
          include: { user: { select: { id: true } } },
        })
      : null;

    if (!coordinator) {
      return NextResponse.json(
        { error: `No VP assigned for ${level || "this level"}` },
        { status: 404 }
      );
    }

    await db.notification.create({
      data: {
        userId: coordinator.user.id,
        type: "GENERAL",
        title: "Admin flagged an entry for review",
        message: `The school admin has flagged a ${subjectName} entry for ${className} by ${teacherName} on ${date}. Please review it.`,
        link: `/coordinator/entries/${entry.id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/entries/[id]/notify-vp error:", error);
    return NextResponse.json(
      { error: "Failed to notify VP" },
      { status: 500 }
    );
  }
}
