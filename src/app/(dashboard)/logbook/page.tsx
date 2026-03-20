"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Flame,
  Layers3,
  PenLine,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { QuickActionsRow } from "@/components/dashboard/QuickActionsRow";
import { DynamicEntryCard } from "@/components/DynamicEntryCard";
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
  const nextClass = useMemo(() => {
    const minutesNow = today.getHours() * 60 + today.getMinutes();
    return todaySlots.find((slot) => parseMinutes(slot.startTime) > minutesNow);
  }, [today, todaySlots]);
  const feedEntries = entries.slice(0, 6);
  const allClassesDone = !loading && isWeekday && todaySlots.length > 0 && pendingCount === 0;

  return (
    <div className="page-shell space-y-4 pt-4 lg:space-y-5">
      <section className="page-header overflow-hidden rounded-[32px] px-5 pb-6 pt-5 text-white shadow-float lg:px-6 lg:pb-7">
        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{greeting}</p>
              <h1 className="font-display text-[2rem] leading-[1.05] text-white">{displayName || "Teacher"}</h1>
              <p className="max-w-[16rem] text-sm text-white/76">
                Your log feed is tuned for fast taps, live context, and clean follow-through.
              </p>
            </div>
            <NotificationBell />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
            <div className="glass-panel rounded-[24px] p-4 lg:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dynamic-accent text-white shadow-accent motion-safe:animate-spring-bounce">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-black text-white">{streak > 0 ? `${streak} days` : "Start today"}</p>
                  <p className="text-xs text-white/70">Logging streak</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm lg:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90">
                  <Layers3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xl font-black text-white">{syllabusCoverage}%</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/66">Syllabus coverage</p>
                </div>
              </div>
            </div>
          </div>

          {isCoordinator && activeMode === "teacher" ? (
            <button
              type="button"
              onClick={() => switchMode("coordinator")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white/84 transition hover:bg-white/12"
            >
              Open coordinator mode
              <ArrowUpRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>

      <QuickActionsRow />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">Stories-style notices</p>
            <h2 className="text-lg font-bold text-content-primary">What changed today</h2>
          </div>
          <Link href="/notifications" className="text-sm font-semibold text-[hsl(var(--accent-text))]">
            View all
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-3 pr-2">
            {(notices.length
              ? notices
              : [{ id: "fallback", title: "You are clear", message: "No new notices right now.", createdAt: new Date().toISOString(), isRead: true }]
            ).map((notice, index) => (
              <Link
                key={notice.id}
                href="/notifications"
                className={cn("story-pill min-w-[190px] lg:min-w-0", !notice.isRead && "motion-safe:animate-live-pulse")}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--accent-strong)))] text-white shadow-accent">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-content-primary">{notice.title}</span>
                  <span className="mt-1 block line-clamp-2 text-xs text-content-secondary">{notice.message}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-content-tertiary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">
              Today — {today.toLocaleDateString("en-GB", { weekday: "long" })}
            </p>
            <h2 className="text-lg font-bold text-content-primary">Tap the live class first</h2>
          </div>
          <span className="rounded-full bg-[hsl(var(--accent-soft))] px-3 py-1.5 font-mono text-[11px] font-bold text-[hsl(var(--accent-text))]">
            {todayLoggedCount}/{todaySlots.length || 0} logged
          </span>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="card p-4">
                <div className="flex gap-3">
                  <div className="w-14 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-10 w-full rounded-2xl" />
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
                  className={cn("card p-4 transition-all duration-300", isCurrent && "live-card scale-[1.01]", isLogged && "opacity-70")}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex gap-4">
                    <div className="w-14 shrink-0 pt-1 text-left">
                      <p className={cn("font-mono text-xs font-bold", isCurrent ? "text-[hsl(var(--accent-text))]" : "text-content-secondary")}>{slot.startTime}</p>
                      <p className="mt-1 text-[11px] text-content-tertiary">{slot.periodLabel}</p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-content-primary">{slot.assignment.subjectName}</h3>
                          <p className="mt-1 text-sm text-content-secondary">{slot.assignment.className}</p>
                        </div>

                        {isLogged ? (
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]">
                            <CheckCircle2 className="h-5 w-5" />
                          </span>
                        ) : isCurrent ? (
                          <Link href={logHref} className="btn-primary px-4 py-2 text-sm shadow-accent">
                            <PenLine className="h-4 w-4" />
                            Log
                          </Link>
                        ) : (
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-2xl border border-dashed",
                              isUpcoming ? "border-[hsl(var(--border-strong))] text-content-tertiary" : "border-[hsl(var(--border-primary))] text-content-tertiary",
                            )}
                          >
                            <Clock3 className="h-4 w-4" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-content-tertiary">
                        <span className="font-mono">{slot.startTime}–{slot.endTime}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--surface-secondary))] px-2.5 py-1 font-semibold">
                          {isLogged ? "Done" : isCurrent ? "Live now" : isUpcoming ? "Upcoming" : "Missed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="card bg-dynamic-noise p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] shadow-accent">
                <Clock3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-content-primary">No classes queued for today</h3>
              <p className="mt-2 text-sm text-content-secondary">Your timetable will show live periods here as soon as they are scheduled.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">This week</p>
            <h2 className="text-lg font-bold text-content-primary">Progress that fills up like a feed</h2>
          </div>
          <span className="font-mono text-xs font-bold text-[hsl(var(--accent-text))]">
            {weeklyBars.reduce((sum, day) => sum + day.logged, 0)}/{weeklyBars.reduce((sum, day) => sum + day.total, 0)} periods
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 lg:gap-3">
          {weeklyBars.map((bar, index) => (
            <div key={bar.key} className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-[18px] bg-[hsl(var(--surface-secondary))] p-2">
                <div
                  className={cn(
                    "w-full rounded-[12px] transition-all duration-700 ease-[var(--ease-spring)]",
                    bar.ratio === 100
                      ? "bg-[linear-gradient(180deg,hsl(var(--success)),color-mix(in_srgb,hsl(var(--success))_68%,white))]"
                      : bar.ratio > 0
                        ? "bg-dynamic-accent"
                        : "bg-[hsl(var(--surface-tertiary))]",
                    bar.isToday && "shadow-accent",
                  )}
                  style={{ height: `${Math.max(bar.ratio, 12)}%`, transitionDelay: `${index * 100}ms` }}
                />
              </div>
              <div className="text-center">
                <p className={cn("font-mono text-[11px]", bar.isToday ? "font-extrabold text-content-primary" : "font-semibold text-content-tertiary")}>{bar.key}</p>
                <p className="text-[11px] text-content-tertiary">{bar.logged}/{bar.total}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {nextClassInfo ? (
        <section
          className="card p-5"
          style={
            nextClassInfo.type === "prep-soon"
              ? {
                  background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,191,36,0.03))",
                  border: "1px solid rgba(245,158,11,0.12)",
                }
              : {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(129,140,248,0.02))",
                  border: "1px solid rgba(99,102,241,0.08)",
                }
          }
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">{nextClassInfo.type === "prep-soon" ? "⏰" : nextClassInfo.type === "rest-long" ? "🌙" : "🕐"}</div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {nextClassInfo.message}
              </h3>
              {nextClassInfo.detail && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
                    marginTop: "3px",
                  }}
                >
                  {nextClassInfo.type === "rest-long" ? `Next up: ${nextClassInfo.detail}` : nextClassInfo.detail}
                </p>
              )}
              {nextClassInfo.hint && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: nextClassInfo.type === "prep-soon" ? "var(--accent-text)" : "var(--text-tertiary)",
                    fontWeight: nextClassInfo.type === "prep-soon" ? 600 : 400,
                    marginTop: "4px",
                    fontStyle: nextClassInfo.type === "prep-soon" ? "normal" : "italic",
                  }}
                >
                  {nextClassInfo.hint}
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">Recent feed</p>
            <h2 className="text-lg font-bold text-content-primary">Your latest entries</h2>
          </div>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--accent-text))]">
            Full history
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="feed-grid lg:grid-cols-2 xl:grid-cols-3">
          {feedEntries.length > 0 ? (
            feedEntries.map((entry, index) => <DynamicEntryCard key={entry.id} entry={entry} priority={index === 0 ? "live" : "default"} />)
          ) : (
            <div className="card bg-dynamic-noise p-5 text-center lg:col-span-full">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] shadow-accent">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-content-primary">Your feed will come alive here</h3>
              <p className="mt-2 text-sm text-content-secondary">Create the first entry and Edlog starts building your live teaching record.</p>
              <Link href="/logbook/new" className="btn-primary mt-4 w-full lg:w-auto">
                Create first entry
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
