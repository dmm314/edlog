export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/utils";
import { getDisplayName } from "@/lib/greeting";
import { createAuditLog } from "@/lib/services/audit.service";

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

    // Support both old API (teacherId, classId, from, to) and DataTable API (filter[...], search, sort, order, cursor/offset)
    const teacherId = searchParams.get("teacherId") || searchParams.get("filter[teacher]");
    const classId = searchParams.get("classId") || searchParams.get("filter[class]");
    const status = searchParams.get("status") || searchParams.get("filter[status]");
    const from = searchParams.get("from") || searchParams.get("filter[dateFrom]");
    const to = searchParams.get("to") || searchParams.get("filter[dateTo]");
    const search = searchParams.get("search");
    const sortField = searchParams.get("sort") || "date";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || searchParams.get("cursor") || "0");
    const includeFilters = searchParams.get("includeFilters") === "true";

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
    if (search) {
      where.OR = [
        { topics: { some: { name: { contains: search, mode: "insensitive" } } } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
        { class: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Build orderBy
    type Order = "asc" | "desc";
    const ord: Order = sortOrder;
    const orderByMap: Record<string, unknown> = {
      date: { date: ord },
      teacher: { teacher: { lastName: ord } },
      class: { class: { name: ord } },
      status: { status: ord },
    };
    const orderBy = orderByMap[sortField] ?? { date: ord };

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
          },
          class: { select: { id: true, name: true, level: true, section: true } },
          topics: { include: { subject: { select: { id: true, name: true } } } },
          remarks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { author: { select: { firstName: true, lastName: true } } },
          },
          views: {
            select: {
              viewerRole: true,
              viewerTitle: true,
              viewedAt: true,
              viewer: { select: { id: true, firstName: true, lastName: true, gender: true } },
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.logbookEntry.count({ where }),
    ]);

    // Build filter options scoped to coordinator's levels (only when requested)
    let filters = null;
    if (includeFilters) {
      const [teachers, classes] = await Promise.all([
        db.user.findMany({
          where: {
            assignments: { some: { classId: { in: classIds } } },
          },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { lastName: "asc" },
        }),
        db.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true, level: true },
          orderBy: { name: "asc" },
        }),
      ]);

      filters = {
        teachers: teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
        classes: classes.map((c) => ({ value: c.id, label: c.name })),
        statuses: [
          { value: "SUBMITTED", label: "Submitted" },
          { value: "VERIFIED", label: "Verified" },
          { value: "FLAGGED", label: "Flagged" },
          { value: "DRAFT", label: "Draft" },
        ],
      };
    }

    return NextResponse.json({
      entries,
      total,
      // DataTable pagination format
      pagination: { total, offset, limit, hasMore: offset + limit < total },
      ...(filters ? { filters } : {}),
    });
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
        teacher: { select: { id: true, firstName: true, lastName: true, gender: true } },
        class: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await createAuditLog({
      entityType: "LogbookEntry",
      entityId: entryId,
      action: status as "VERIFIED" | "FLAGGED",
      actorId: user.id,
      actorRole: "LEVEL_COORDINATOR",
      metadata: {
        previousStatus: entry.status,
        newStatus: status,
        verifierName: resolvedVerifierName,
        verifierTitle: resolvedVerifierTitle,
        ...(remark?.trim() ? { remark: remark.trim() } : {}),
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
          remarkType: "coordinator_review",
        },
      });
    }

    // Always notify the teacher when an entry is reviewed
    await db.notification.create({
      data: {
        userId: updated.teacher.id,
        type: "LOG_REVIEWED",
        title: `Entry ${status === "VERIFIED" ? "verified" : "flagged"} by ${resolvedVerifierTitle}`,
        message: `Your entry for ${updated.class.name} has been ${status === "VERIFIED" ? "verified" : "flagged"} by ${resolvedVerifierTitle} (${getDisplayName(user.firstName, user.lastName, user.gender)}).`,
        link: `/logbook`,
        senderRole: "TEACHER",
        schoolId: ctx.coordinator.schoolId,
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error("PATCH /api/coordinator/entries error:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
