import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: "No school assigned" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const weekStart = searchParams.get("weekStart"); // ISO date string (Monday)

    if (!classId || !weekStart) {
      return NextResponse.json(
        { error: "classId and weekStart are required" },
        { status: 400 }
      );
    }

    // Verify class belongs to school
    const cls = await db.class.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Calculate week boundaries (Monday to Friday)
    const weekStartDate = new Date(weekStart + "T00:00:00Z");
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4); // Friday

    // Get period schedule
    let periods = await db.periodSchedule.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { periodNum: "asc" },
    });

    if (periods.length === 0) {
      // Auto-seed defaults
      const defaults = [
        { periodNum: 1, label: "Period 1", startTime: "07:30", endTime: "08:20" },
        { periodNum: 2, label: "Period 2", startTime: "08:20", endTime: "09:10" },
        { periodNum: 3, label: "Period 3", startTime: "09:10", endTime: "10:00" },
        { periodNum: 4, label: "Period 4", startTime: "10:30", endTime: "11:20" },
        { periodNum: 5, label: "Period 5", startTime: "11:20", endTime: "12:10" },
        { periodNum: 6, label: "Period 6", startTime: "12:10", endTime: "13:00" },
        { periodNum: 7, label: "Period 7", startTime: "14:00", endTime: "14:50" },
        { periodNum: 8, label: "Period 8", startTime: "14:50", endTime: "15:40" },
        { periodNum: 9, label: "Period 9", startTime: "15:40", endTime: "16:30" },
      ];
      await db.periodSchedule.createMany({
        data: defaults.map((d) => ({ ...d, schoolId: user.schoolId! })),
        skipDuplicates: true,
      });
      periods = await db.periodSchedule.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { periodNum: "asc" },
      });
    }

    // Get timetable slots for this class (permanent structure)
    const slots = await db.timetableSlot.findMany({
      where: {
        assignment: { classId, schoolId: user.schoolId },
      },
      include: {
        assignment: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Get entries for this class in the given week
    const entries = await db.logbookEntry.findMany({
      where: {
        classId,
        teacher: { schoolId: user.schoolId },
        date: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        assignment: {
          include: { subject: true },
        },
        topics: {
          include: { subject: true },
        },
        timetableSlot: true,
      },
      orderBy: { date: "asc" },
    });

    // Format slots: map by dayOfWeek -> periodNum
    const formattedSlots = slots.map((slot) => {
      const periodMatch = slot.periodLabel.match(/\d+/);
      const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        periodNum,
        periodLabel: slot.periodLabel,
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacher: {
          id: slot.assignment.teacher.id,
          firstName: slot.assignment.teacher.firstName,
          lastName: slot.assignment.teacher.lastName,
          photoUrl: slot.assignment.teacher.photoUrl,
        },
        subject: slot.assignment.subject.name,
      };
    });

    // Format entries with day of week info
    const formattedEntries = entries.map((entry) => {
      const entryDate = new Date(entry.date);
      const jsDay = entryDate.getUTCDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;

      const subjectName =
        entry.assignment?.subject?.name ??
        entry.topics?.[0]?.subject?.name ??
        "N/A";

      return {
        id: entry.id,
        date: entry.date.toISOString().split("T")[0],
        dayOfWeek,
        period: entry.period,
        duration: entry.duration,
        status: entry.status,
        topicText: entry.topicText,
        moduleName: entry.moduleName,
        notes: entry.notes,
        objectives: entry.objectives,
        studentAttendance: entry.studentAttendance,
        engagementLevel: entry.engagementLevel,
        subject: subjectName,
        teacher: {
          id: entry.teacher.id,
          firstName: entry.teacher.firstName,
          lastName: entry.teacher.lastName,
          photoUrl: entry.teacher.photoUrl,
        },
        timetableSlotId: entry.timetableSlotId,
      };
    });

    return NextResponse.json({
      periods: periods.map((p) => ({
        periodNum: p.periodNum,
        label: p.label,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
      slots: formattedSlots,
      entries: formattedEntries,
      className: cls.name,
    });
  } catch (error) {
    console.error("GET /api/admin/entry-timetable error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry timetable" },
      { status: 500 }
    );
  }
}
