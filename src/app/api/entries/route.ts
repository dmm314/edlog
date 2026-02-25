import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createEntrySchema } from "@/lib/validations";
import { sanitizeHtml } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    if (user.role === "TEACHER") {
      where.teacherId = user.id;
    } else if (user.role === "SCHOOL_ADMIN") {
      where.teacher = { schoolId: user.schoolId };
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    if (classId) where.classId = classId;

    if (subjectId) {
      where.topic = { subjectId };
    }

    if (search) {
      where.OR = [
        { notes: { contains: search } },
        { objectives: { contains: search } },
        { topic: { name: { contains: search } } },
        { topic: { subject: { name: { contains: search } } } },
      ];
    }

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          class: true,
          topic: {
            include: { subject: true },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
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
    console.error("GET /api/entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create entries" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize text fields
    const notes = data.notes ? sanitizeHtml(data.notes) : null;
    const objectives = data.objectives
      ? sanitizeHtml(data.objectives)
      : null;

    const entry = await db.logbookEntry.create({
      data: {
        date: new Date(data.date),
        classId: data.classId,
        topicId: data.topicId,
        period: data.period ?? null,
        duration: data.duration,
        notes,
        objectives,
        signatureData: data.signatureData ?? null,
        status: "SUBMITTED",
        teacherId: user.id,
      },
      include: {
        class: true,
        topic: {
          include: { subject: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries error:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
