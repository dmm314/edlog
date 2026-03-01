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
    const moduleName = searchParams.get("moduleName");
    const teacherId = searchParams.get("teacherId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    if (user.role === "TEACHER") {
      where.teacherId = user.id;
    } else if (user.role === "SCHOOL_ADMIN") {
      where.teacher = { schoolId: user.schoolId };
    } else if (user.role === "REGIONAL_ADMIN") {
      where.teacher = { school: { regionId: user.regionId } };
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    if (classId) where.classId = classId;

    // Support filtering by class name (for admin UI)
    const className = searchParams.get("className");
    if (className && !classId) {
      where.class = { name: className };
    }

    // teacherId filter (for admin filtering by specific teacher)
    if (teacherId && user.role !== "TEACHER") {
      where.teacherId = teacherId;
    }

    // Use AND array for combining OR conditions safely
    const andConditions: Record<string, unknown>[] = [];

    if (subjectId) {
      andConditions.push({
        OR: [
          { topics: { some: { subjectId } } },
          { assignment: { subjectId } },
        ],
      });
    }

    // Support filtering by subject name (for admin UI)
    const subjectName = searchParams.get("subjectName");
    if (subjectName && !subjectId) {
      andConditions.push({
        OR: [
          { topics: { some: { subject: { name: subjectName } } } },
          { assignment: { subject: { name: subjectName } } },
        ],
      });
    }

    if (moduleName) {
      where.moduleName = moduleName;
    }

    if (search) {
      andConditions.push({
        OR: [
          { notes: { contains: search, mode: "insensitive" } },
          { objectives: { contains: search, mode: "insensitive" } },
          { topicText: { contains: search, mode: "insensitive" } },
          { moduleName: { contains: search, mode: "insensitive" } },
          { topics: { some: { name: { contains: search, mode: "insensitive" } } } },
          { topics: { some: { subject: { name: { contains: search, mode: "insensitive" } } } } },
          { assignment: { subject: { name: { contains: search, mode: "insensitive" } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          class: true,
          topics: {
            include: { subject: true },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              photoUrl: true,
            },
          },
          assignment: {
            include: { subject: true },
          },
          timetableSlot: true,
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
    const topicText = data.topicText ? sanitizeHtml(data.topicText) : null;
    const moduleName = data.moduleName ? sanitizeHtml(data.moduleName) : null;

    // Build topic connections (support single topicId or array of topicIds)
    const topicIds = data.topicIds?.length
      ? data.topicIds
      : data.topicId
        ? [data.topicId]
        : [];

    // topicText (free-text) OR topicId is required
    if (topicIds.length === 0 && !topicText) {
      return NextResponse.json(
        { error: "A topic is required" },
        { status: 400 }
      );
    }

    const entry = await db.logbookEntry.create({
      data: {
        date: new Date(data.date),
        classId: data.classId,
        ...(topicIds.length > 0
          ? { topics: { connect: topicIds.map((id: string) => ({ id })) } }
          : {}),
        moduleName,
        topicText,
        assignmentId: data.assignmentId ?? null,
        timetableSlotId: data.timetableSlotId ?? null,
        period: data.period ?? null,
        duration: data.duration,
        notes,
        objectives,
        signatureData: data.signatureData ?? null,
        studentAttendance: data.studentAttendance ?? null,
        engagementLevel: data.engagementLevel ?? null,
        status: data.status || "SUBMITTED",
        teacherId: user.id,
      },
      include: {
        class: true,
        topics: {
          include: { subject: true },
        },
        assignment: {
          include: { subject: true },
        },
        timetableSlot: true,
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
