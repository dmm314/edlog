export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/utils";

// Helper: get coordinator record and class IDs for the current user
async function getCoordinatorContext(userId: string, schoolId?: string | null) {
  const coordinator = await db.levelCoordinator.findFirst({
    where: {
      userId,
      isActive: true,
      ...(schoolId ? { schoolId } : {}),
    },
  });

  if (!coordinator) return null;

  const classes = await db.class.findMany({
    where: {
      schoolId: coordinator.schoolId,
      level: { in: coordinator.levels },
    },
    select: { id: true },
  });

  return {
    coordinator,
    classIds: classes.map((c) => c.id),
  };
}

// GET: List entries for the coordinator's assigned levels
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCoordinatorContext(user.id, user.schoolId);
    if (!ctx) {
      return NextResponse.json({ error: "No active coordinator role found" }, { status: 403 });
    }

    const { classIds } = ctx;
    const { searchParams } = new URL(request.url);

    const teacherId = searchParams.get("teacherId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause — always scoped to coordinator's class IDs
    const where: Record<string, unknown> = {
      classId: { in: classIds },
    };

    if (teacherId) where.teacherId = teacherId;
    if (classId) {
      // Validate the requested classId is within the coordinator's scope
      if (!classIds.includes(classId)) {
        return NextResponse.json({ error: "Class not in your assigned levels" }, { status: 403 });
      }
      where.classId = classId;
    }
    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          class: { select: { id: true, name: true, level: true, section: true } },
          topics: { include: { subject: { select: { id: true, name: true } } } },
          remarks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { author: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      db.logbookEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total });
  } catch (error) {
    console.error("GET /api/coordinator/entries error:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// PATCH: Verify or flag an entry (with optional remark and signature)
// Body: { entryId, status: "VERIFIED"|"FLAGGED", remark?, verifierName, verifierTitle?, signature? }
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCoordinatorContext(user.id, user.schoolId);
    if (!ctx) {
      return NextResponse.json({ error: "No active coordinator role found" }, { status: 403 });
    }

    if (!ctx.coordinator.canVerify) {
      return NextResponse.json({ error: "You do not have permission to verify entries" }, { status: 403 });
    }

    const body = await request.json();
    const { entryId, status, remark, verifierName, verifierTitle, signature } = body;

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    if (!status || !["VERIFIED", "FLAGGED"].includes(status)) {
      return NextResponse.json({ error: "status must be VERIFIED or FLAGGED" }, { status: 400 });
    }

    // Verify the entry is within the coordinator's scope
    const entry = await db.logbookEntry.findUnique({
      where: { id: entryId },
      select: { id: true, classId: true, status: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (!ctx.classIds.includes(entry.classId)) {
      return NextResponse.json({ error: "Entry is not in your assigned levels" }, { status: 403 });
    }

    const resolvedVerifierName =
      verifierName?.trim() || `${user.firstName} ${user.lastName}`;
    const resolvedVerifierTitle =
      verifierTitle?.trim() || ctx.coordinator.title;

    // Update entry status and verification metadata
    const updated = await db.logbookEntry.update({
      where: { id: entryId },
      data: {
        status,
        verifiedById: user.id,
        verifiedByName: resolvedVerifierName,
        verifiedByTitle: resolvedVerifierTitle,
        verifiedAt: new Date(),
        verificationSignature: signature || null,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } },
      },
    });

    // Optionally add a remark
    if (remark && remark.trim().length > 0 && ctx.coordinator.canRemark) {
      await db.entryRemark.create({
        data: {
          entryId,
          authorId: user.id,
          authorRole: "LEVEL_COORDINATOR",
          content: sanitizeHtml(remark.trim()),
          remarkType: "admin_verification",
        },
      });

      // Notify the teacher
      await db.notification.create({
        data: {
          userId: updated.teacher.id,
          type: "LOG_REVIEWED",
          title: "Entry reviewed by coordinator",
          message: `Your entry for ${updated.class.name} has been ${status === "VERIFIED" ? "verified" : "flagged"} by ${resolvedVerifierTitle}.`,
          link: `/logbook`,
          senderRole: "TEACHER", // coordinator has TEACHER base role
          schoolId: ctx.coordinator.schoolId,
        },
      });
    }

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error("PATCH /api/coordinator/entries error:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
