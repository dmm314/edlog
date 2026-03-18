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
  Waves,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { DynamicEntryCard } from "@/components/DynamicEntryCard";
import { QuickActionsRow } from "@/components/QuickActionsRow";
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

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getEntryMatch(entry: EntryWithRelations, slot: TimetableSlotInfo) {
  const entryDate = new Date(entry.date);
  const today = new Date();
  return (
    entryDate.toDateString() === today.toDateString() &&
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
  const weeklyBars = useMemo(() => getWeeklyBars(allSlots, entries), [allSlots, entries]);
  const nextClass = useMemo(() => {
    const minutesNow = today.getHours() * 60 + today.getMinutes();
    return todaySlots.find((slot) => parseMinutes(slot.startTime) > minutesNow);
  }, [today, todaySlots]);
  const upcomingLabel = nextClass
    ? `${nextClass.assignment.subjectName} • ${nextClass.startTime}`
    : null;
  const feedEntries = entries.slice(0, 6);

  return (
    <div className="page-shell space-y-4 pt-4">
      <section className="page-header overflow-hidden rounded-[32px] px-5 pb-6 pt-5 text-white shadow-float">
        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{greeting}</p>
              <h1 className="font-display text-[2rem] leading-[1.05] text-white">
                {displayName || "Teacher"}
              </h1>
              <p className="max-w-[16rem] text-sm text-white/76">
                Your log feed is tuned for fast taps, live context, and clean follow-through.
              </p>
            </div>
            <NotificationBell />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-[24px] p-4">
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

            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
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

      <QuickActionsRow pendingCount={pendingCount} upcomingLabel={upcomingLabel} />

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
            {(notices.length ? notices : [{ id: "fallback", title: "You are clear", message: "No new notices right now.", createdAt: new Date().toISOString(), isRead: true }]).map((notice, index) => (
              <Link
                key={notice.id}
                href="/notifications"
                className={cn("story-pill min-w-[190px]", !notice.isRead && "motion-safe:animate-live-pulse")}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--accent-strong)))] text-white shadow-accent">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-content-primary">{notice.title}</span>
                  <span className="mt-1 block line-clamp-2 text-xs text-content-secondary">{notice.message}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">Today — {today.toLocaleDateString("en-GB", { weekday: "long" })}</p>
            <h2 className="text-lg font-bold text-content-primary">Tap the live class first</h2>
          </div>
          <span className="rounded-full bg-[hsl(var(--accent-soft))] px-3 py-1.5 font-mono text-[11px] font-bold text-[hsl(var(--accent-text))]">
            {todaySlots.length - pendingCount}/{todaySlots.length || 0} logged
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
          ) : todaySlots.length === 0 ? (
            <div className="card bg-dynamic-noise p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] shadow-accent">
                <Waves className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-content-primary">No classes in this slot</h3>
              <p className="mt-2 text-sm text-content-secondary">
                Use the quiet window to prepare, catch up, or open your full timetable.
              </p>
              <Link href="/timetable" className="btn-secondary mt-4 w-full">
                View timetable
              </Link>
            </div>
          ) : (
            todaySlots.map((slot, index) => {
              const matchedEntry = entries.find((entry) => getEntryMatch(entry, slot));
              const isLogged = Boolean(matchedEntry);
              const isCurrent = index === currentSlotIndex;
              const isUpcoming = index > currentSlotIndex || currentSlotIndex === -1;
              const logHref = `/logbook/new?slotId=${slot.id}&assignmentId=${slot.assignment.id}`;

              return (
                <article
                  key={slot.id}
                  className={cn(
                    "card p-4 transition-all duration-300",
                    isCurrent && "live-card scale-[1.01]",
                    isLogged && "opacity-70",
                  )}
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
                          <p className="mt-1 text-sm text-content-secondary">
                            {slot.assignment.className}
                            {matchedEntry?.moduleName ? ` • ${matchedEntry.moduleName}` : ""}
                          </p>
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
                          <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border border-dashed", isUpcoming ? "border-[hsl(var(--border-strong))] text-content-tertiary" : "border-[hsl(var(--border-primary))] text-content-tertiary")}> 
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

        <div className="grid grid-cols-5 gap-2">
          {weeklyBars.map((bar, index) => (
            <div key={bar.key} className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-[18px] bg-[hsl(var(--surface-secondary))] p-2">
                <div
                  className={cn(
                    "w-full rounded-[12px] transition-all duration-700 ease-[var(--ease-spring)]",
                    bar.ratio === 100 ? "bg-[linear-gradient(180deg,hsl(var(--success)),color-mix(in_srgb,hsl(var(--success))_68%,white))]" : bar.ratio > 0 ? "bg-dynamic-accent" : "bg-[hsl(var(--surface-tertiary))]",
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

      {nextClass ? (
        <section className="card overflow-hidden p-4">
          <div className="absolute inset-y-4 left-0 w-1 rounded-full bg-dynamic-accent" />
          <div className="pl-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-tertiary">Next class</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">{nextClass.assignment.subjectName}</h3>
                <p className="text-sm text-content-secondary">{nextClass.assignment.className}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-[hsl(var(--accent-text))]">{nextClass.startTime}</p>
                <p className="text-xs text-content-tertiary">Starts later today</p>
              </div>
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

        <div className="feed-grid">
          {feedEntries.length > 0 ? (
            feedEntries.map((entry, index) => (
              <DynamicEntryCard
                key={entry.id}
                entry={entry}
                priority={index === 0 ? "live" : "default"}
              />
            ))
          ) : (
            <div className="card bg-dynamic-noise p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] shadow-accent">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-content-primary">Your feed will come alive here</h3>
              <p className="mt-2 text-sm text-content-secondary">Create the first entry and Edlog starts building your live teaching record.</p>
              <Link href="/logbook/new" className="btn-primary mt-4 w-full">
                Create first entry
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
