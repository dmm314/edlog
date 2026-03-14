export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/entries/[id]/view — record that the current user has seen this entry
// Called from entry detail pages when a coordinator, admin, or HOD opens an entry.
// Teachers viewing their own entries are ignored (no self-view tracking).
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check what role this viewer has
    let viewerRole = user.role as string;
    let viewerTitle: string | null = null;

    // Check if they're a level coordinator (VP)
    const coordinator = await db.levelCoordinator.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (coordinator) {
      viewerRole = "LEVEL_COORDINATOR";
      viewerTitle = coordinator.title;
    } else if (user.role === "SCHOOL_ADMIN") {
      viewerRole = "SCHOOL_ADMIN";
      viewerTitle = "School Admin";
    } else if (user.role === "REGIONAL_ADMIN") {
      viewerRole = "REGIONAL_ADMIN";
      viewerTitle = "Regional Admin";
    } else {
      // Check if teacher is an HOD
      const hod = await db.headOfDepartment.findFirst({
        where: { teacherId: user.id },
        include: { subject: { select: { name: true } } },
      });
      if (hod) {
        viewerRole = "HOD";
        viewerTitle = `HOD ${hod.subject.name}`;
      } else {
        // Plain teacher viewing their own entry — don't record
        const entry = await db.logbookEntry.findUnique({
          where: { id: params.id },
          select: { teacherId: true },
        });
        if (entry?.teacherId === user.id) {
          return NextResponse.json({ success: true, skipped: true });
        }
      }
    }

    // Upsert — create first view or update viewedAt timestamp
    await db.entryView.upsert({
      where: { entryId_viewerId: { entryId: params.id, viewerId: user.id } },
      create: {
        entryId: params.id,
        viewerId: user.id,
        viewerRole,
        viewerTitle,
      },
      update: { viewedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/entries/[id]/view error:", error);
    // Don't fail noisily — view tracking is non-critical
    return NextResponse.json({ success: false });
  }
}
