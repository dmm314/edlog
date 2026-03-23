"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Layers3,
  PenLine,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { QuickActionsRow } from "@/components/dashboard/QuickActionsRow";
import { EntryCard } from "@/components/EntryCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";
import type { EntryWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { getDisplayName, getTimeGreeting } from "@/lib/greeting";

interface TimetableSlotInfo {
  id: string;
  periodNumber: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  assignment: {
    id: string;
    classId: string;
    className: string;
    classLevel?: string;
    subjectId: string;
    subjectName: string;
  };
}

interface AssignmentSummary {
  id: string;
  class: { id: string; name: string; level: string };
  subject: { id: string; name: string; code: string };
  entryCount: number;
  timetableSlots: Array<{ id: string; day: number; period: string; time: string }>;
}

interface StoryNotice {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface NextClassInfo {
  type: "prep-soon" | "up-next" | "rest-long";
  message: string;
  detail?: string;
  hint?: string;
}

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WEEKEND_MESSAGES = [
  "You've earned this rest. Recharge and come back strong.",
  "Teaching is a marathon, not a sprint. Rest up.",
  "Take this time to do something you love outside the classroom.",
  "Your students are lucky to have you. Now go enjoy your weekend.",
  "A well-rested teacher is a great teacher. See you Monday.",
];

const FREE_DAY_MESSAGES = [
  "Use this time to prepare, mark, or simply breathe.",
  "A day to catch up on planning or just enjoy some quiet.",
  "No rush today. The classroom will be there tomorrow.",
  "Great teachers prepare on days like this. Or rest. Both are valid.",
];

const ALL_CAUGHT_UP_MESSAGES = [
  "Every class logged. Your students' progress is being recorded.",
  "All done! Consistency like this is what makes great teachers.",
  "100% logged today. That's the standard.",
  "Another day of complete records. Your future self will thank you.",
];

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function differenceInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86400000);
}

function getRotatingMessage(messages: string[]) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((startOfDay(now).getTime() - yearStart.getTime()) / 86400000);
  return messages[dayOfYear % messages.length];
}

function getStreak(entries: EntryWithRelations[]) {
  const uniqueDates = Array.from(new Set(entries.map((entry) => new Date(entry.date).toISOString().split("T")[0]))).sort().reverse();
  if (!uniqueDates.length) return 0;

  let streak = 0;
  const cursor = startOfDay(new Date());
  const todayKey = cursor.toISOString().split("T")[0];
  if (uniqueDates[0] !== todayKey) {
    const diff = differenceInDays(cursor, new Date(uniqueDates[0]));
    if (diff > 1) return 0;
    if (diff === 1) cursor.setDate(cursor.getDate() - 1);
  }

  for (const dateKey of uniqueDates) {
    const currentKey = cursor.toISOString().split("T")[0];
    if (dateKey === currentKey) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getCurrentSlotIndex(slots: TimetableSlotInfo[]) {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return slots.findIndex((slot) => minutesNow >= parseMinutes(slot.startTime) && minutesNow < parseMinutes(slot.endTime));
}

function getEntryMatch(entry: EntryWithRelations, slot: TimetableSlotInfo, referenceDate = new Date()) {
  const entryDate = new Date(entry.date);
  return (
    entryDate.toDateString() === referenceDate.toDateString() &&
    entry.class.id === slot.assignment.classId &&
    ((entry.assignment?.subject.id && entry.assignment.subject.id === slot.assignment.subjectId) ||
      entry.topics?.some((topic) => topic.subject?.id === slot.assignment.subjectId) ||
      false) &&
    (entry.period === slot.periodNumber || entry.timetableSlot?.id === slot.id)
  );
}

function getWeeklyBars(slots: TimetableSlotInfo[], entries: EntryWithRelations[]) {
  const monday = startOfDay(new Date());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dayOfWeek = index + 1;
    const daySlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek);
    const dayEntries = entries.filter((entry) => new Date(entry.date).toDateString() === date.toDateString());
    const total = daySlots.length;
    const logged = dayEntries.length;
    const ratio = total === 0 ? 0 : Math.min(100, Math.round((logged / total) * 100));
    return {
      key: weekdayShort[date.getDay()],
      logged,
      total,
      ratio,
      date,
      isToday: startOfDay(date).getTime() === startOfDay(new Date()).getTime(),
    };
  });
}

function getNextScheduledClassInfo(slots: TimetableSlotInfo[], now: Date): NextClassInfo | null {
  if (!slots.length) return null;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const candidates = slots
    .map((slot) => {
      let daysAway = (slot.dayOfWeek - currentDay + 7) % 7;
      const slotMinutes = parseMinutes(slot.startTime);
      if (daysAway === 0 && slotMinutes <= currentMinutes) {
        daysAway = 7;
      }

      return {
        slot,
        daysAway,
        minutesAway: daysAway * 1440 + (slotMinutes - currentMinutes),
      };
    })
    .sort((a, b) => a.minutesAway - b.minutesAway);

  const nextCandidate = candidates[0];
  if (!nextCandidate) return null;

  const { slot, daysAway, minutesAway } = nextCandidate;
  const detail = `${slot.assignment.subjectName} • ${slot.assignment.className} • ${weekdayLong[slot.dayOfWeek]} at ${slot.startTime}`;

  if (daysAway === 0 && minutesAway <= 120) {
    return {
      type: "prep-soon",
      message: `${slot.assignment.subjectName} starts soon`,
      detail,
      hint: "A quick glance at your notes now will make the lesson feel effortless.",
    };
  }

  if (daysAway === 0) {
    return {
      type: "up-next",
      message: "Another class is lined up for later today.",
      detail,
      hint: "Take a breather, then step back in with the calm of a prepared teacher.",
    };
  }

  return {
    type: daysAway >= 2 ? "rest-long" : "up-next",
    message: daysAway === 1 ? "Done for today!" : "No more classes until later in the week.",
    detail,
    hint: daysAway === 1
      ? "Rest well — tomorrow brings another room full of learners."
      : "A little breathing room now can become your best planning time.",
  };
}

export default function LogbookPage() {
  const { isCoordinator, activeMode, switchMode } = useCoordinatorMode();
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<TimetableSlotInfo[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [notices, setNotices] = useState<StoryNotice[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        const params = new URLSearchParams({ from: from.toISOString().split("T")[0], limit: "18" });

        const responses = await Promise.all([
          fetch(`/api/entries?${params}`),
          fetch("/api/timetable/slots"),
          isWeekday ? fetch(`/api/timetable/slots?dayOfWeek=${dayOfWeek}`) : Promise.resolve(null),
          fetch("/api/teacher/assignments"),
          fetch("/api/notifications?unreadOnly=true"),
          fetch("/api/auth/session"),
          fetch("/api/profile"),
        ]);

        if (!active) return;

        const [entriesRes, allSlotsRes, todaySlotsRes, assignmentsRes, noticesRes, sessionRes, profileRes] = responses;

        if (entriesRes?.ok) {
          const data = await entriesRes.json();
          setEntries(data.entries ?? []);
        }

        if (allSlotsRes?.ok) {
          const data = await allSlotsRes.json();
          setAllSlots(Array.isArray(data) ? data : data.slots ?? []);
        }

        if (todaySlotsRes && "ok" in todaySlotsRes && todaySlotsRes.ok) {
          const data = await todaySlotsRes.json();
          setTodaySlots(Array.isArray(data) ? data : data.slots ?? []);
        }

        if (assignmentsRes?.ok) {
          setAssignments(await assignmentsRes.json());
        }

        if (noticesRes?.ok) {
          const data = await noticesRes.json();
          setNotices(Array.isArray(data) ? data.slice(0, 6) : []);
        }

        if (sessionRes?.ok) {
          const data = await sessionRes.json();
          setFirstName(data?.user?.firstName ?? "");
          setLastName(data?.user?.lastName ?? "");
        }

        if (profileRes?.ok) {
          const data = await profileRes.json();
          setGender(data?.gender ?? null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [dayOfWeek, isWeekday]);

  const displayName = getDisplayName(firstName, lastName, gender);
  const greeting = getTimeGreeting();
  const streak = useMemo(() => getStreak(entries), [entries]);
  const uniqueTopics = useMemo(
    () => new Set(entries.flatMap((entry) => entry.topics.map((topic) => `${topic.subject?.id ?? "x"}:${topic.name}`))).size,
    [entries],
  );
  const coverageTarget = Math.max(assignments.length * 10, 10);
  const syllabusCoverage = Math.min(100, Math.round((uniqueTopics / coverageTarget) * 100));
  const currentSlotIndex = getCurrentSlotIndex(todaySlots);
  const pendingCount = Math.max(todaySlots.length - todaySlots.filter((slot) => entries.some((entry) => getEntryMatch(entry, slot))).length, 0);
  const todayLoggedCount = todaySlots.length - pendingCount;
  const weeklyBars = useMemo(() => getWeeklyBars(allSlots, entries), [allSlots, entries]);
  const nextClassInfo = useMemo(() => {
    if (!isWeekday) {
      return { type: "rest-long" as const, message: getRotatingMessage(WEEKEND_MESSAGES), hint: "See you next week." };
    }
    if (todaySlots.length > 0 && pendingCount === 0) {
      return { type: "rest-long" as const, message: getRotatingMessage(ALL_CAUGHT_UP_MESSAGES) };
    }
    if (todaySlots.length === 0) {
      return { type: "rest-long" as const, message: getRotatingMessage(FREE_DAY_MESSAGES) };
    }
    return getNextScheduledClassInfo(allSlots, today);
  }, [isWeekday, todaySlots, pendingCount, allSlots, today]);
  const feedEntries = entries.slice(0, 6);

  return (
    <div className="page-shell space-y-4 pt-4 lg:space-y-5">
      {/* ─ Clean functional header ─ */}
      <section className="rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-5 lg:p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-content-tertiary">{greeting}</p>
              <h1 className="text-2xl font-bold text-content-primary">{displayName || "Teacher"}</h1>
              <div className="flex items-center gap-1.5">
                <span className="role-dot role-dot-teacher" />
                <span className="text-xs text-content-tertiary">Teacher</span>
              </div>
            </div>
            <NotificationBell />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold text-content-primary">{streak > 0 ? `${streak} days` : "Start today"}</p>
                <p className="text-xs text-content-tertiary">Logging streak</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]">
                <Layers3 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-lg font-bold text-content-primary">{syllabusCoverage}%</p>
                <p className="text-xs text-content-tertiary">Syllabus coverage</p>
              </div>
            </div>
          </div>

          {isCoordinator && activeMode === "teacher" ? (
            <button
              type="button"
              onClick={() => switchMode("coordinator")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-4 text-sm font-medium text-content-secondary transition hover:bg-[hsl(var(--surface-tertiary))]"
            >
              Open coordinator mode
              <ArrowUpRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>

      <QuickActionsRow />

      {/* ─ Notices ─ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content-primary">Notices</h2>
          <Link href="/notifications" className="text-sm font-medium text-[hsl(var(--accent-text))]">
            View all
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          <div className="flex gap-2 pr-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:pr-0">
            {(notices.length
              ? notices
              : [{ id: "fallback", title: "You are clear", message: "No new notices right now.", createdAt: new Date().toISOString(), isRead: true }]
            ).map((notice) => (
              <Link
                key={notice.id}
                href="/notifications"
                className="inline-flex items-center gap-3 rounded-xl px-4 py-3 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border-primary))] min-w-[190px] lg:min-w-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-content-primary">{notice.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-content-tertiary">{notice.message}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-content-tertiary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─ Two-column layout on desktop ─ */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">

      {/* ─ Today's timetable ─ */}
      <section className="section-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-content-primary">
              Today — {today.toLocaleDateString("en-GB", { weekday: "long" })}
            </h2>
          </div>
          <span className="rounded-full bg-[hsl(var(--surface-tertiary))] px-2.5 py-1 font-mono text-[11px] font-semibold text-content-secondary">
            {todayLoggedCount}/{todaySlots.length || 0} logged
          </span>
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-4">
                <div className="flex gap-3">
                  <div className="w-14 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))
          ) : isWeekday && todaySlots.length > 0 ? (
            todaySlots.map((slot, index) => {
              const matchedEntry = entries.find((entry) => getEntryMatch(entry, slot));
              const isLogged = Boolean(matchedEntry);
              const isCurrent = index === currentSlotIndex;
              const isUpcoming = currentSlotIndex === -1 || index > currentSlotIndex;
              const logHref = `/logbook/new?slotId=${slot.id}&assignmentId=${slot.assignment.id}`;

              return (
                <article
                  key={slot.id}
                  className={cn(
                    "rounded-xl border bg-[hsl(var(--surface-secondary))] p-4",
                    isCurrent ? "border-[hsl(var(--accent)/0.3)]" : "border-[hsl(var(--border-muted))]",
                    isLogged && "opacity-60",
                  )}
                >
                  <div className="flex gap-4">
                    <div className="w-14 shrink-0 pt-1 text-left">
                      <p className={cn("font-mono text-xs font-semibold", isCurrent ? "text-[hsl(var(--accent-text))]" : "text-content-secondary")}>{slot.startTime}</p>
                      <p className="mt-1 text-[11px] text-content-tertiary">{slot.periodLabel}</p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-content-primary">{slot.assignment.subjectName}</h3>
                          <p className="mt-0.5 text-sm text-content-secondary">{slot.assignment.className}</p>
                        </div>

                        {isLogged ? (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">
                            <CheckCircle2 className="h-5 w-5" />
                          </span>
                        ) : isCurrent ? (
                          <Link href={logHref} className="btn-primary px-4 py-2 text-sm">
                            <PenLine className="h-4 w-4" />
                            Log
                          </Link>
                        ) : (
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg border border-dashed",
                              isUpcoming ? "border-[hsl(var(--border-strong))] text-content-tertiary" : "border-[hsl(var(--border-primary))] text-content-tertiary",
                            )}
                          >
                            <Clock3 className="h-4 w-4" />
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-content-tertiary">
                        <span className="font-mono">{slot.startTime}–{slot.endTime}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--surface-tertiary))] px-2 py-0.5 font-medium">
                          {isLogged ? "Done" : isCurrent ? "Live now" : isUpcoming ? "Upcoming" : "Missed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--surface-tertiary))] text-content-tertiary">
                <Clock3 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-content-primary">No classes queued for today</h3>
              <p className="mt-1 text-sm text-content-tertiary">Your timetable will show periods here as soon as they are scheduled.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─ Weekly progress ─ */}
      <section className="section-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-content-primary">This week</h2>
          <span className="font-mono text-xs font-medium text-content-tertiary">
            {weeklyBars.reduce((sum, day) => sum + day.logged, 0)}/{weeklyBars.reduce((sum, day) => sum + day.total, 0)} periods
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {weeklyBars.map((bar) => (
            <div key={bar.key} className="flex flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end rounded-lg bg-[hsl(var(--surface-tertiary))] p-1.5">
                <div
                  className={cn(
                    "w-full rounded transition-all duration-500",
                    bar.ratio === 100
                      ? "bg-[hsl(var(--success))]"
                      : bar.ratio > 0
                        ? "bg-[hsl(var(--accent))]"
                        : "bg-[hsl(var(--border-muted))]",
                  )}
                  style={{ height: `${Math.max(bar.ratio, 10)}%` }}
                />
              </div>
              <div className="text-center">
                <p className={cn("font-mono text-[11px]", bar.isToday ? "font-bold text-content-primary" : "font-medium text-content-tertiary")}>{bar.key}</p>
                <p className="text-[10px] text-content-tertiary">{bar.logged}/{bar.total}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      </div>{/* end two-column layout */}

      {/* ─ Next class info ─ */}
      {nextClassInfo ? (
        <section
          className={cn(
            "section-card",
            nextClassInfo.type === "prep-soon" && "border-[hsl(var(--accent)/0.3)]",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-tertiary))] text-lg">
              {nextClassInfo.type === "prep-soon" ? "⏰" : nextClassInfo.type === "rest-long" ? "🌙" : "🕐"}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-content-primary">{nextClassInfo.message}</h3>
              {nextClassInfo.detail && (
                <p className="mt-1 text-sm text-content-tertiary">
                  {nextClassInfo.type === "rest-long" ? `Next up: ${nextClassInfo.detail}` : nextClassInfo.detail}
                </p>
              )}
              {nextClassInfo.hint && (
                <p className={cn(
                  "mt-1 text-sm",
                  nextClassInfo.type === "prep-soon"
                    ? "font-medium text-[hsl(var(--accent-text))]"
                    : "italic text-content-tertiary",
                )}>
                  {nextClassInfo.hint}
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─ Recent entries feed ─ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-content-primary">Recent entries</h2>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--accent-text))]">
            Full history
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="feed-grid lg:grid-cols-2 xl:grid-cols-3">
          {feedEntries.length > 0 ? (
            feedEntries.map((entry, index) => <EntryCard key={entry.id} entry={entry} priority={index === 0 ? "live" : "default"} />)
          ) : (
            <div className="rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-5 text-center lg:col-span-full">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--surface-tertiary))] text-content-tertiary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-content-primary">Your entries will appear here</h3>
              <p className="mt-1 text-sm text-content-tertiary">Create the first entry and Edlog starts building your teaching record.</p>
              <Link href="/logbook/new" className="btn-primary mt-4 w-full px-6 py-3 lg:w-auto">
                Create first entry
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
