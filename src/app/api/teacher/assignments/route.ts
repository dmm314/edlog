export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await db.teacherAssignment.findMany({
      where: { teacherId: user.id },
      include: {
        class: {
          select: { id: true, name: true, level: true, stream: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        division: {
          select: { id: true, name: true },
        },
        periods: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            periodLabel: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        _count: {
          select: { entries: true },
        },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    });

    return NextResponse.json(
      assignments.map((a) => ({
        id: a.id,
        class: a.class,
        subject: a.subject,
        division: a.division,
        entryCount: a._count.entries,
        timetableSlots: a.periods.map((p) => ({
          id: p.id,
          day: p.dayOfWeek,
          period: p.periodLabel,
          time: `${p.startTime} - ${p.endTime}`,
        })),
      }))
    );
  } catch (error) {
    console.error("GET /api/teacher/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
