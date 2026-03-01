import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const weekStart = searchParams.get("weekStart"); // ISO date string (Monday)

    // If no classId, return the teacher's assigned classes grouped by level
    if (!classId) {
      const assignments = await db.teacherAssignment.findMany({
        where: { teacherId: user.id },
        include: {
          class: { select: { id: true, name: true, level: true, section: true } },
          subject: { select: { id: true, name: true } },
        },
        orderBy: [{ class: { level: "asc" } }, { class: { name: "asc" } }],
      });

      // Group classes by level
      const classMap = new Map<string, { id: string; name: string; level: string; section: string | null; subjects: string[] }>();
      for (const a of assignments) {
        const existing = classMap.get(a.class.id);
        if (existing) {
          if (!existing.subjects.includes(a.subject.name)) {
            existing.subjects.push(a.subject.name);
          }
        } else {
          classMap.set(a.class.id, {
            id: a.class.id,
            name: a.class.name,
            level: a.class.level,
            section: a.class.section,
            subjects: [a.subject.name],
          });
        }
      }

      const classes = Array.from(classMap.values());

      // Group by level
      const levelMap = new Map<string, typeof classes>();
      for (const c of classes) {
        const arr = levelMap.get(c.level) || [];
        arr.push(c);
        levelMap.set(c.level, arr);
      }

      const levels = Array.from(levelMap.entries()).map(([level, cls]) => ({
        level,
        classes: cls.sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return NextResponse.json({ levels });
    }

    // classId provided — return timetable + entries for the week
    if (!weekStart) {
      return NextResponse.json(
        { error: "weekStart is required when classId is provided" },
        { status: 400 }
      );
    }

    // Verify teacher has assignment for this class
    const hasAssignment = await db.teacherAssignment.findFirst({
      where: { teacherId: user.id, classId },
    });
    if (!hasAssignment) {
      return NextResponse.json({ error: "No assignment for this class" }, { status: 403 });
    }

    const cls = await db.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Calculate week boundaries (Monday to Friday)
    const weekStartDate = new Date(weekStart + "T00:00:00Z");
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4); // Friday

    // Get period schedule
    let periods = await db.periodSchedule.findMany({
      where: { schoolId: cls.schoolId },
      orderBy: { periodNum: "asc" },
    });

    if (periods.length === 0) {
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
        data: defaults.map((d) => ({ ...d, schoolId: cls.schoolId })),
        skipDuplicates: true,
      });
      periods = await db.periodSchedule.findMany({
        where: { schoolId: cls.schoolId },
        orderBy: { periodNum: "asc" },
      });
    }

    // Get timetable slots for this class where the teacher is assigned
    const slots = await db.timetableSlot.findMany({
      where: {
        assignment: { classId, teacherId: user.id },
      },
      include: {
        assignment: {
          include: {
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Get entries for this teacher + class in the given week
    const entries = await db.logbookEntry.findMany({
      where: {
        teacherId: user.id,
        classId,
        date: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      include: {
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
        subject: slot.assignment.subject.name,
      };
    });

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
    console.error("GET /api/teacher/entry-timetable error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry timetable" },
      { status: 500 }
    );
  }
}
