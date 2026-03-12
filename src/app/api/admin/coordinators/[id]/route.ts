export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const VALID_LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

// PATCH: Update coordinator — title, levels, active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const coordinator = await db.levelCoordinator.findUnique({
      where: { id: params.id },
    });

    if (!coordinator || coordinator.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      if (body.title.trim().length > 100) {
        return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.levels !== undefined) {
      if (!Array.isArray(body.levels) || body.levels.length === 0) {
        return NextResponse.json({ error: "At least one level is required" }, { status: 400 });
      }
      const invalidLevels = body.levels.filter((l: string) => !VALID_LEVELS.includes(l));
      if (invalidLevels.length > 0) {
        return NextResponse.json(
          { error: `Invalid levels: ${invalidLevels.join(", ")}` },
          { status: 400 }
        );
      }

      // Check for level conflicts with other coordinators
      const others = await db.levelCoordinator.findMany({
        where: { schoolId: user.schoolId, isActive: true, id: { not: params.id } },
        select: { levels: true },
      });
      for (const level of body.levels) {
        if (others.some((c) => c.levels.includes(level))) {
          return NextResponse.json(
            { error: `Level "${level}" is already assigned to another coordinator` },
            { status: 409 }
          );
        }
      }

      updateData.levels = body.levels;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.canVerify !== undefined) {
      updateData.canVerify = Boolean(body.canVerify);
    }

    if (body.canRemark !== undefined) {
      updateData.canRemark = Boolean(body.canRemark);
    }

    const updated = await db.levelCoordinator.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ coordinator: updated });
  } catch (error) {
    console.error("PATCH /api/admin/coordinators/[id] error:", error);
    return NextResponse.json({ error: "Failed to update coordinator" }, { status: 500 });
  }
}

// DELETE: Deactivate a coordinator (soft delete — sets isActive=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const coordinator = await db.levelCoordinator.findUnique({
      where: { id: params.id },
    });

    if (!coordinator || coordinator.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
    }

    await db.levelCoordinator.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/coordinators/[id] error:", error);
    return NextResponse.json({ error: "Failed to deactivate coordinator" }, { status: 500 });
  }
}
