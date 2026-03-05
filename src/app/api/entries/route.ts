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

    // Support filtering by class level (for HOD filtering by form)
    const classLevel = searchParams.get("classLevel");
    if (classLevel) {
      where.class = { ...(where.class as Record<string, unknown> || {}), level: classLevel };
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

    // Filter by status
    const status = searchParams.get("status");
    if (status) {
      where.status = status;
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
            include: { subject: true, division: true },
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

    // topicText (free-text) OR topicId is required for submitted entries (not drafts or class-didn't-hold)
    if (topicIds.length === 0 && !topicText && data.status !== "DRAFT" && !data.classDidNotHold) {
      return NextResponse.json(
        { error: "A topic is required" },
        { status: 400 }
      );
    }

    // --- Server-side validation: teaching day & duplicate check ---
    const entryDate = new Date(data.date);
    const jsDay = entryDate.getUTCDay(); // 0=Sun ... 6=Sat
    // Convert to 1=Mon format used in timetable
    const timetableDow = jsDay === 0 ? 7 : jsDay;

    // The date entered must be a weekday (Mon-Fri) — the teaching date
    if (timetableDow > 5) {
      return NextResponse.json(
        { error: "The teaching date must be a weekday (Monday to Friday)" },
        { status: 400 }
      );
    }

    // Weekend submission rule: Teachers can only submit final entries (SUBMITTED status)
    // for the current week. The deadline is the end of the weekend (Sunday).
    // They can fill during the week or complete by end of weekend.
    const now = new Date();
    const entryWeekStart = getWeekStart(entryDate);
    const entryWeekEnd = getWeekEnd(entryDate); // Sunday end of that week

    // For SUBMITTED entries, check if we're still within the allowed window
    // Allowed: same week (Mon-Sun), or if it's the weekend after the teaching week
    if (data.status === "SUBMITTED") {
      const currentWeekStart = getWeekStart(now);
      const isCurrentWeek = entryWeekStart.getTime() === currentWeekStart.getTime();

      // Allow submission up to 3 days after the end of the teaching week (Wednesday next week)
      const submissionDeadline = new Date(entryWeekEnd);
      submissionDeadline.setDate(submissionDeadline.getDate() + 3);

      if (now > submissionDeadline && !isCurrentWeek) {
        return NextResponse.json(
          { error: "The submission window for this week has closed. You can only submit entries for the current week or the previous week (until Wednesday)." },
          { status: 400 }
        );
      }
    }

    // Check teacher has a timetable slot on this day
    const teacherSlotsOnDay = await db.timetableSlot.count({
      where: {
        dayOfWeek: timetableDow,
        assignment: { teacherId: user.id },
      },
    });

    if (teacherSlotsOnDay === 0 && !data.classDidNotHold) {
      return NextResponse.json(
        { error: "You do not have any classes scheduled on this day" },
        { status: 400 }
      );
    }

    // Prevent duplicate entries for the same teacher + date + period
    if (data.period) {
      const existingEntry = await db.logbookEntry.findFirst({
        where: {
          teacherId: user.id,
          date: entryDate,
          period: data.period,
          status: { not: "DRAFT" }, // Allow overwriting drafts
        },
      });

      if (existingEntry) {
        return NextResponse.json(
          { error: `You already have an entry for Period ${data.period} on this date. You cannot fill the same period twice.` },
          { status: 409 }
        );
      }

      // If there's an existing draft for this period, delete it before creating new one
      await db.logbookEntry.deleteMany({
        where: {
          teacherId: user.id,
          date: entryDate,
          period: data.period,
          status: "DRAFT",
        },
      });
    }

    // Also check by timetable slot ID to catch duplicates even without period
    if (data.timetableSlotId) {
      const existingBySlot = await db.logbookEntry.findFirst({
        where: {
          teacherId: user.id,
          date: entryDate,
          timetableSlotId: data.timetableSlotId,
          status: { not: "DRAFT" },
        },
      });

      if (existingBySlot) {
        return NextResponse.json(
          { error: "You already have an entry for this timetable slot on this date. You cannot fill the same slot twice." },
          { status: 409 }
        );
      }
    }

    // Determine the class IDs to create entries for
    // Multi-class: if classIds is provided, create an entry for each class
    const classIdsToCreate = data.classIds?.length ? data.classIds : [data.classId];
    const assignmentIdsToUse = data.assignmentIds?.length ? data.assignmentIds : [data.assignmentId ?? null];

    const createdEntries = [];

    for (let i = 0; i < classIdsToCreate.length; i++) {
      const thisClassId = classIdsToCreate[i];
      const thisAssignmentId = assignmentIdsToUse[i] ?? assignmentIdsToUse[0] ?? null;

      const entry = await db.logbookEntry.create({
        data: {
          date: new Date(data.date),
          classId: thisClassId,
          ...(topicIds.length > 0
            ? { topics: { connect: topicIds.map((id: string) => ({ id })) } }
            : {}),
          moduleName: data.classDidNotHold ? "Class Did Not Hold" : moduleName,
          topicText: data.classDidNotHold ? "Class did not hold" : topicText,
          assignmentId: thisAssignmentId,
          timetableSlotId: i === 0 ? (data.timetableSlotId ?? null) : null,
          period: data.period ?? null,
          duration: data.classDidNotHold ? 0 : data.duration,
          notes: data.classDidNotHold ? (notes || "Class did not hold for this period") : notes,
          objectives,
          signatureData: data.signatureData ?? null,
          studentAttendance: data.classDidNotHold ? 0 : (data.studentAttendance ?? null),
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
            include: { subject: true, division: true },
          },
          timetableSlot: true,
        },
      });

      createdEntries.push(entry);
    }

    // Return single entry for backwards compatibility, or array if multi-class
    if (createdEntries.length === 1) {
      return NextResponse.json(createdEntries[0], { status: 201 });
    }
    return NextResponse.json(createdEntries, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries error:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}

// Helper: Get Monday of the week for a given date
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Helper: Get Sunday end of the week for a given date
function getWeekEnd(d: Date): Date {
  const start = getWeekStart(d);
  start.setUTCDate(start.getUTCDate() + 6); // Sunday
  start.setUTCHours(23, 59, 59, 999);
  return start;
}
