import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/validations";
import { sanitizeHtml } from "@/lib/utils";

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
        topic: { include: { subject: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Authorization check
    if (user.role === "TEACHER" && entry.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "SCHOOL_ADMIN") {
      const teacher = await db.user.findUnique({
        where: { id: entry.teacherId },
      });
      if (teacher?.schoolId !== user.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(entry);
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

    // Teachers can only edit their own DRAFT or SUBMITTED entries
    if (user.role === "TEACHER") {
      if (entry.teacherId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (entry.status !== "DRAFT" && entry.status !== "SUBMITTED") {
        return NextResponse.json(
          { error: "Cannot edit a verified or flagged entry" },
          { status: 400 }
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
    const updateData: Record<string, unknown> = { ...data };
    if (data.notes) updateData.notes = sanitizeHtml(data.notes);
    if (data.objectives)
      updateData.objectives = sanitizeHtml(data.objectives);
    if (data.date) updateData.date = new Date(data.date);

    const updated = await db.logbookEntry.update({
      where: { id: params.id },
      data: updateData,
      include: {
        class: true,
        topic: { include: { subject: true } },
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
