export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/validations";
import { sanitizeHtml } from "@/lib/utils";
import { createAuditLog } from "@/lib/services/audit.service";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
      include: {
        class: { include: { school: { select: { regionId: true } } } },
        topics: { include: { subject: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolId: true,
            school: { select: { name: true, regionId: true } },
          },
        },
        assignment: { include: { subject: true } },
        timetableSlot: true,
        views: {
          select: {
            viewerRole: true,
            viewerTitle: true,
            viewedAt: true,
            viewer: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { viewedAt: "asc" },
        },
        remarks: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, role: true, photoUrl: true } },
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Authorization check
    if (user.role === "TEACHER" && entry.teacherId !== user.id) {
      // Check if this teacher is a coordinator who has access to this entry's class level
      const coordinator = await db.levelCoordinator.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          schoolId: entry.class.schoolId || user.schoolId || undefined,
        },
      });

      if (!coordinator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Verify the entry's class is within coordinator's assigned levels
      const entryClass = await db.class.findUnique({
        where: { id: entry.classId },
        select: { level: true, schoolId: true },
      });

      const inScope =
        entryClass &&
        entryClass.schoolId === coordinator.schoolId &&
        coordinator.levels.includes(entryClass.level);

      if (!inScope) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    if (user.role === "SCHOOL_ADMIN" && entry.class.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "REGIONAL_ADMIN" && entry.class.school?.regionId !== user.regionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if editable (within 1 hour of creation, only by the teacher)
    const createdMs = new Date(entry.createdAt).getTime();
    const isEditable =
      user.role === "TEACHER" &&
      entry.teacherId === user.id &&
      Date.now() - createdMs < ONE_HOUR_MS;

    return NextResponse.json({ ...entry, isEditable });
  } catch (error) {
    console.error("GET /api/entries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
    });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Teachers can only edit their own entries within the 1-hour window
    if (user.role === "TEACHER") {
      if (entry.teacherId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check 1-hour window
      const createdMs = new Date(entry.createdAt).getTime();
      if (Date.now() - createdMs >= ONE_HOUR_MS) {
        return NextResponse.json(
          { error: "Entries can only be edited within 1 hour of submission." },
          { status: 403 }
        );
      }

      // Teachers cannot change status
      delete data.status;
    }

    // School admins can add remarks/observations but do not verify entries.
    if (user.role === "SCHOOL_ADMIN") {
      delete data.status;
    }

    // Sanitize text and build update data
    const updateData: Record<string, unknown> = {};
    if (data.date) updateData.date = new Date(data.date);
    if (data.classId) updateData.classId = data.classId;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.duration) updateData.duration = data.duration;
    if (data.moduleName !== undefined) updateData.moduleName = data.moduleName ? sanitizeHtml(data.moduleName) : null;
    if (data.topicText !== undefined) updateData.topicText = data.topicText ? sanitizeHtml(data.topicText) : null;
    if (data.notes !== undefined) updateData.notes = data.notes ? sanitizeHtml(data.notes) : null;
    if (data.objectives !== undefined) {
      updateData.objectives = Array.isArray(data.objectives)
        ? data.objectives.map((o) => ({ text: sanitizeHtml(o.text), proportion: o.proportion }))
        : data.objectives ? sanitizeHtml(data.objectives) : null;
    }
    if (data.signatureData !== undefined) updateData.signatureData = data.signatureData;
    if (data.status) updateData.status = data.status;
    if (data.studentAttendance !== undefined) updateData.studentAttendance = data.studentAttendance;
    if (data.engagementLevel !== undefined) updateData.engagementLevel = data.engagementLevel;
    // CBA fields
    if (data.familyOfSituation !== undefined) updateData.familyOfSituation = data.familyOfSituation ? sanitizeHtml(data.familyOfSituation) : null;
    if (data.bilingualActivity !== undefined) updateData.bilingualActivity = data.bilingualActivity;
    if (data.bilingualType !== undefined) updateData.bilingualType = data.bilingualType;
    if (data.bilingualNote !== undefined) updateData.bilingualNote = data.bilingualNote ? sanitizeHtml(data.bilingualNote) : null;
    if (data.integrationActivity !== undefined) updateData.integrationActivity = data.integrationActivity ? sanitizeHtml(data.integrationActivity) : null;
    if (data.integrationLevel !== undefined) updateData.integrationLevel = data.integrationLevel;
    if (data.integrationStatus !== undefined) updateData.integrationStatus = data.integrationStatus;
    if (data.lessonMode !== undefined) updateData.lessonMode = data.lessonMode;
    if (data.digitalTools !== undefined) updateData.digitalTools = data.digitalTools;
    // Assignment tracking
    if (data.assignmentGiven !== undefined) updateData.assignmentGiven = data.assignmentGiven;
    if (data.assignmentDetails !== undefined) updateData.assignmentDetails = data.assignmentDetails ? sanitizeHtml(data.assignmentDetails) : null;
    if (data.assignmentReviewed !== undefined) updateData.assignmentReviewed = data.assignmentReviewed;

    // Handle topic updates via many-to-many
    const topicConnect = data.topicIds?.length
      ? { set: data.topicIds.map((id: string) => ({ id })) }
      : data.topicId
        ? { set: [{ id: data.topicId }] }
        : undefined;

    const updated = await db.logbookEntry.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(topicConnect ? { topics: topicConnect } : {}),
      },
      include: {
        class: true,
        topics: { include: { subject: true } },
      },
    });

    await createAuditLog({
      entityType: "LogbookEntry",
      entityId: params.id,
      action: "EDITED",
      actorId: user.id,
      actorRole: user.role || "TEACHER",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/entries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
    });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (entry.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft entries can be deleted" },
        { status: 400 }
      );
    }

    await db.logbookEntry.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/entries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
