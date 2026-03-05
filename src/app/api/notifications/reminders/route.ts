export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Generate reminder notifications for teachers who haven't filled their logbook
// This should be called by a cron job on Saturday, or can be triggered manually
export async function POST(request: Request) {
  try {
    // Simple auth check — require a secret key or admin role
    await request.json().catch(() => ({}));
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if CRON_SECRET matches, or if no secret is set (dev mode)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current week boundaries (Monday to Friday)
    const now = new Date();
    const currentDow = now.getUTCDay(); // 0=Sun...6=Sat
    const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setUTCDate(monday.getUTCDate() + 4);
    friday.setUTCHours(23, 59, 59, 999);

    // Get all teachers with timetable slots
    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        isVerified: true,
        assignments: { some: { periods: { some: {} } } },
      },
      select: {
        id: true,
        firstName: true,
        assignments: {
          include: {
            class: true,
            subject: true,
            periods: true,
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const teacher of teachers) {
      // Get all entries for this teacher this week (excluding drafts)
      const weekEntries = await db.logbookEntry.findMany({
        where: {
          teacherId: teacher.id,
          date: { gte: monday, lte: friday },
          status: { not: "DRAFT" },
        },
        select: { period: true, date: true, timetableSlotId: true },
      });

      // Build a set of filled (date+period) combos
      const filledSet = new Set<string>();
      for (const entry of weekEntries) {
        if (entry.period) {
          const dateStr = entry.date.toISOString().split("T")[0];
          filledSet.add(`${dateStr}-P${entry.period}`);
        }
      }

      // Check each day up to today
      const unfilledPeriods: { day: string; period: string; className: string; subject: string }[] = [];

      for (let d = 0; d < 5; d++) {
        const checkDate = new Date(monday);
        checkDate.setUTCDate(monday.getUTCDate() + d);
        if (checkDate > now) break; // Skip future days

        const dow = d + 1; // 1=Mon...5=Fri
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        for (const assignment of teacher.assignments) {
          for (const slot of assignment.periods) {
            if (slot.dayOfWeek !== dow) continue;

            const periodMatch = slot.periodLabel?.match(/\d+/);
            const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
            if (periodNum === null) continue;

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

      // Check if we already sent a reminder this week for this teacher
      const existingReminder = await db.notification.findFirst({
        where: {
          userId: teacher.id,
          type: "LOG_REMINDER",
          createdAt: { gte: monday },
        },
      });

      if (existingReminder) continue; // Already reminded this week

      // Build notification message
      const topUnfilled = unfilledPeriods.slice(0, 5);
      const moreCount = unfilledPeriods.length - topUnfilled.length;

      const details = topUnfilled
        .map((p) => `• ${p.day}: ${p.period} — ${p.subject} (${p.className})`)
        .join("\n");

      const message = `You have ${unfilledPeriods.length} unfilled period${unfilledPeriods.length !== 1 ? "s" : ""} this week:\n\n${details}${moreCount > 0 ? `\n\n...and ${moreCount} more` : ""}\n\nPlease fill your logbook before the end of the weekend.`;

      await db.notification.create({
        data: {
          userId: teacher.id,
          type: "LOG_REMINDER",
          title: `${unfilledPeriods.length} Unfilled Period${unfilledPeriods.length !== 1 ? "s" : ""} This Week`,
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
