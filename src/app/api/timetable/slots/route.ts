import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can access timetable slots" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dayOfWeekParam = searchParams.get("dayOfWeek");

    // dayOfWeek is optional — if omitted, return all weekdays
    const whereClause: Record<string, unknown> = {
      assignment: { teacherId: user.id },
    };

    if (dayOfWeekParam) {
      const dayOfWeek = parseInt(dayOfWeekParam);
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 5) {
        return NextResponse.json(
          { error: "dayOfWeek must be between 1 (Monday) and 5 (Friday)" },
          { status: 400 }
        );
      }
      whereClause.dayOfWeek = dayOfWeek;
    }

    const slots = await db.timetableSlot.findMany({
      where: whereClause,
      include: {
        assignment: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const result = slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      periodLabel: slot.periodLabel,
      assignment: {
        id: slot.assignment.id,
        classId: slot.assignment.classId,
        className: slot.assignment.class.name,
        subjectId: slot.assignment.subjectId,
        subjectName: slot.assignment.subject.name,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/timetable/slots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable slots" },
      { status: 500 }
    );
  }
}
