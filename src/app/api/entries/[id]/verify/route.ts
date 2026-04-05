export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/utils";
import { createAuditLog } from "@/lib/services/audit.service";

/**
 * POST /api/entries/[id]/verify
 *
 * Verify or flag an entry. Available to:
 *   - SCHOOL_ADMIN (for entries in their school)
 *   - REGIONAL_ADMIN (for entries in their region)
 *   - TEACHER with LevelCoordinator role (for entries in their assigned levels)
 *
 * Body: {
 *   status: "VERIFIED" | "FLAGGED",
 *   remark?: string,
 *   verifierName?: string,
 *   verifierTitle?: string,
 *   signature?: string (base64)
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, remark, verifierName, verifierTitle, signature } = body;

    if (!status || !["VERIFIED", "FLAGGED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be VERIFIED or FLAGGED" },
        { status: 400 }
      );
    }

    // Fetch entry with class info for authorization
    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
      include: {
        class: { select: { schoolId: true, level: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Authorization
    let resolvedTitle = verifierTitle || "";
    let canVerify = false;

    if (user.role === "SCHOOL_ADMIN") {
      if (entry.class.schoolId !== user.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      canVerify = true;
      resolvedTitle = resolvedTitle || "School Admin";
    } else if (user.role === "REGIONAL_ADMIN") {
      // Check entry belongs to a school in this admin's region
      const school = await db.school.findUnique({
        where: { id: entry.class.schoolId },
        select: { regionId: true },
      });
      if (school?.regionId !== user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      canVerify = true;
      resolvedTitle = resolvedTitle || "Regional Inspector";
    } else if (user.role === "TEACHER") {
      // Check if teacher is a level coordinator with canVerify permission
      const coordinator = await db.levelCoordinator.findFirst({
        where: {
          userId: user.id,
          schoolId: entry.class.schoolId,
          isActive: true,
          canVerify: true,
        },
      });

      if (!coordinator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Entry's class must be in coordinator's assigned levels
      if (!coordinator.levels.includes(entry.class.level)) {
        return NextResponse.json(
          { error: "Entry is not in your assigned levels" },
          { status: 403 }
        );
      }

      canVerify = true;
      resolvedTitle = resolvedTitle || coordinator.title;
    }

    if (!canVerify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedName = verifierName?.trim() || `${user.firstName} ${user.lastName}`;

    // Update entry with verification metadata
    const updated = await db.logbookEntry.update({
      where: { id: params.id },
      data: {
        status,
        verifiedById: user.id,
        verifiedByName: resolvedName,
        verifiedByTitle: resolvedTitle,
        verifiedAt: new Date(),
        verificationSignature: signature || null,
      },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Audit log
    await createAuditLog({
      entityType: "LogbookEntry",
      entityId: params.id,
      action: status,
      actorId: user.id,
      actorRole: user.role || "TEACHER",
      metadata: {
        previousStatus: entry.status,
        newStatus: status,
        verifierName: resolvedName,
        verifierTitle: resolvedTitle,
      },
    });

    // Add remark if provided
    if (remark?.trim()) {
      const remarkType = user.role === "REGIONAL_ADMIN"
        ? "inspector_note"
        : user.role === "SCHOOL_ADMIN"
          ? "admin_verification"
          : "coordinator_review";

      await db.entryRemark.create({
        data: {
          entryId: params.id,
          authorId: user.id,
          authorRole: user.role || "TEACHER",
          content: sanitizeHtml(remark.trim()),
          remarkType,
        },
      });
    }

    // Notify the teacher
    await db.notification.create({
      data: {
        userId: updated.teacher.id,
        type: "LOG_REVIEWED",
        title: `Entry ${status === "VERIFIED" ? "verified" : "flagged"} by ${resolvedTitle}`,
        message: `Your entry for ${updated.class.name} has been ${status === "VERIFIED" ? "verified" : "flagged"} by ${resolvedName} (${resolvedTitle}).`,
        link: `/logbook`,
        senderRole: user.role,
        schoolId: entry.class.schoolId,
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error("POST /api/entries/[id]/verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify entry" },
      { status: 500 }
    );
  }
}
