export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    void request.nextUrl.searchParams.get("includeLastWeek");

    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;

    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    const entries = await db.logbookEntry.findMany({
      where: {
        teacherId: user.id,
        date: { gte: lastMonday },
      },
      select: {
        id: true,
        date: true,
        status: true,
        timetableSlotId: true,
        period: true,
        classId: true,
        moduleName: true,
        topicText: true,
      },
    });

    const slotEntryMap: Record<
      string,
      {
        entryId: string;
        status: string;
        date: string;
        moduleName: string | null;
        topicText: string | null;
      }
    > = {};

    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split("T")[0];

      if (entry.timetableSlotId) {
        const key = `${entry.timetableSlotId}:${dateStr}`;
        // Keep the most recent (latest date wins)
        if (!slotEntryMap[key] || dateStr > slotEntryMap[key].date) {
          slotEntryMap[key] = {
            entryId: entry.id,
            status: entry.status,
            date: dateStr,
            moduleName: entry.moduleName,
            topicText: entry.topicText,
          };
        }
      }

      if (entry.period !== null) {
        const key = `period:${entry.period}:${entry.classId}:${dateStr}`;
        if (!slotEntryMap[key] || dateStr > slotEntryMap[key].date) {
          slotEntryMap[key] = {
            entryId: entry.id,
            status: entry.status,
            date: dateStr,
            moduleName: entry.moduleName,
            topicText: entry.topicText,
          };
        }
      }
    }

    return NextResponse.json({ slotEntries: slotEntryMap });
  } catch (error) {
    console.error("GET /api/timetable/slot-status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch slot status" },
      { status: 500 }
    );
  }
}
