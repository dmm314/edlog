import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Generate reminder notifications for teachers who haven't filled their logbook
// Intended for a Saturday cron job but can also be triggered manually
export async function POST(request: Request) {
  try {
    // Authorization check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute current week boundaries (Monday → Friday)
    const now = new Date();
    const currentDow = now.getUTCDay(); // 0=Sun ... 6=Sat
    const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;

    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setUTCDate(monday.getUTCDate() + 4);
    friday.setUTCHours(23, 59, 59, 999);

    // Fetch teachers with timetable assignments
    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        isVerified: true,
        assignments: {
          some: {
            timetableSlots: { some: {} },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        assignments: {
          include: {
            class: true,
            subject: true,
            timetableSlots: true,
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const teacher of teachers) {
      // Fetch entries for the current week
      const weekEntries = await db.logbookEntry.findMany({
        where: {
          teacherId: teacher.id,
          date: { gte: monday, lte: friday },
          status: { not: "DRAFT" },
        },
        select: {
          period: true,
          date: true,
          timetableSlotId: true,
        },
      });

      // Build filled period lookup
      const filledSet = new Set<string>();

      for (const entry of weekEntries) {
        if (!entry.period) continue;

        const dateStr = entry.date.toISOString().split("T")[0];
        filledSet.add(`${dateStr}-P${entry.period}`);
      }

      const unfilledPeriods: {
        day: string;
        period: string;
        className: string;
        subject: string;
      }[] = [];

      const dayNames = [
        "",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];

      // Check each weekday
      for (let d = 0; d < 5; d++) {
        const checkDate = new Date(monday);
        checkDate.setUTCDate(monday.getUTCDate() + d);

        if (checkDate > now) break;

        const dow = d + 1;
        const dateStr = checkDate.toISOString().split("T")[0];

        for (const assignment of teacher.assignments) {
          for (const slot of assignment.timetableSlots) {
            if (slot.dayOfWeek !== dow) continue;

            const periodMatch = slot.periodLabel?.match(/\d+/);
            const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;

            if (!periodNum) continue;

            const key = `${dateStr}-P${periodNum}`;

            if (!filledSet.has(key)) {
              unfilledPeriods.push({
                day: dayNames[dow],
                period: slot.periodLabel || `Period ${periodNum}`,
                className: assignment.class.name,
                subject: assignment.subject.name,
              });
            }
          }
        }
      }

      if (unfilledPeriods.length === 0) continue;

      // Check if reminder already exists
      const existingReminder = await db.notification.findFirst({
        where: {
          userId: teacher.id,
          type: "LOG_REMINDER",
          createdAt: { gte: monday },
        },
      });

      if (existingReminder) continue;

      const preview = unfilledPeriods.slice(0, 5);
      const moreCount = unfilledPeriods.length - preview.length;

      const details = preview
        .map(
          (p) =>
            `• ${p.day}: ${p.period} — ${p.subject} (${p.className})`
        )
        .join("\n");

      const message = `You have ${
        unfilledPeriods.length
      } unfilled period${
        unfilledPeriods.length !== 1 ? "s" : ""
      } this week:

${details}${moreCount > 0 ? `

...and ${moreCount} more` : ""}

Please fill your logbook before the end of the weekend.`;

      await db.notification.create({
        data: {
          userId: teacher.id,
          type: "LOG_REMINDER",
          title: `${
            unfilledPeriods.length
          } Unfilled Period${
            unfilledPeriods.length !== 1 ? "s" : ""
          } This Week`,
          message,
          link: "/logbook",
        },
      });

      notificationsCreated++;
    }

    return NextResponse.json({
      success: true,
      teachersChecked: teachers.length,
      notificationsCreated,
      weekStart: monday.toISOString().split("T")[0],
      weekEnd: friday.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("POST /api/notifications/reminders error:", error);

    return NextResponse.json(
      { error: "Failed to generate reminders" },
      { status: 500 }
    );
  }
}
