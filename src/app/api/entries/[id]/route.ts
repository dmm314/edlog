export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/validations";
import { sanitizeHtml } from "@/lib/utils";

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
        class: true,
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
          schoolId: entry.teacher.schoolId || user.schoolId || undefined,
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
    if (user.role === "SCHOOL_ADMIN" && entry.teacher.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "REGIONAL_ADMIN" && entry.teacher.school?.regionId !== user.regionId) {
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

    // Admins can change status to VERIFIED or FLAGGED
    if (user.role === "SCHOOL_ADMIN" && data.status) {
      if (data.status !== "VERIFIED" && data.status !== "FLAGGED") {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
    }

    // Sanitize text
    const updateData: Record<string, unknown> = {};
    if (data.date) updateData.date = new Date(data.date);
    if (data.classId) updateData.classId = data.classId;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.duration) updateData.duration = data.duration;
    if (data.notes !== undefined) updateData.notes = data.notes ? sanitizeHtml(data.notes) : null;
    if (data.objectives !== undefined) updateData.objectives = data.objectives ? sanitizeHtml(data.objectives) : null;
    if (data.signatureData !== undefined) updateData.signatureData = data.signatureData;
    if (data.status) updateData.status = data.status;
    if (data.studentAttendance !== undefined) updateData.studentAttendance = data.studentAttendance;
    if (data.engagementLevel !== undefined) updateData.engagementLevel = data.engagementLevel;

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
