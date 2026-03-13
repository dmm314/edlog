export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Lightweight endpoint: returns whether the current user is an active coordinator.
// Used by the dashboard layout to decide which navigation to show.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ isCoordinator: false });
    }

    const coordinator = await db.levelCoordinator.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      select: { id: true, title: true, levels: true },
    });

    return NextResponse.json({
      isCoordinator: !!coordinator,
      title: coordinator?.title ?? null,
      levels: coordinator?.levels ?? [],
    });
  } catch {
    // If the LevelCoordinator table doesn't exist yet, treat as non-coordinator
    return NextResponse.json({ isCoordinator: false });
  }
}
