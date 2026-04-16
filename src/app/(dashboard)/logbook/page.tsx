"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  PenLine,
  ArrowUpRight,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { EntryCard } from "@/components/EntryCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";
import type { EntryWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { getDisplayName, getTimeGreeting } from "@/lib/greeting";

/* ── Types ──────────────────────────────────────────────── */

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

/* ── Helpers ────────────────────────────────────────────── */

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
  const uniqueDates = Array.from(
    new Set(entries.map((e) => new Date(e.date).toISOString().split("T")[0]))
  ).sort().reverse();
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
  return slots.findIndex(
    (slot) => minutesNow >= parseMinutes(slot.startTime) && minutesNow < parseMinutes(slot.endTime)
  );
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

type SlotStatus = "logged" | "current" | "upcoming" | "missed";

function getSlotStatus(
  slot: TimetableSlotInfo,
  index: number,
  currentSlotIndex: number,
  isLogged: boolean
): SlotStatus {
  if (isLogged) return "logged";
  if (index === currentSlotIndex) return "current";
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (parseMinutes(slot.endTime) < minutesNow) return "missed";
  return "upcoming";
}

function getSubjectAbbrev(name: string) {
  if (name.length <= 4) return name.toUpperCase();
  const words = name.split(/\s+/);
  if (words.length >= 2) return words.map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  return name.slice(0, 3).toUpperCase();
}

function getWeeklyBars(slots: TimetableSlotInfo[], entries: EntryWithRelations[]) {
  const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monday = startOfDay(new Date());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dayOfWeek = index + 1;
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const dayEntries = entries.filter((e) => new Date(e.date).toDateString() === date.toDateString());
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

/* ── Component ──────────────────────────────────────────── */

export default function LogbookPage() {
  const { isCoordinator, activeMode, switchMode } = useCoordinatorMode();
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<TimetableSlotInfo[]>([]);
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
          fetch("/api/auth/session"),
          fetch("/api/profile"),
        ]);

        if (!active) return;

        const [entriesRes, allSlotsRes, todaySlotsRes, sessionRes, profileRes] = responses;

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
    return () => { active = false; };
  }, [dayOfWeek, isWeekday]);

  /* ── Derived state ──────────────────────────────────── */

  const displayName = getDisplayName(firstName, lastName, gender);
  const greeting = getTimeGreeting();
  const streak = useMemo(() => getStreak(entries), [entries]);
  const currentSlotIndex = getCurrentSlotIndex(todaySlots);
  const pendingCount = Math.max(
    todaySlots.length - todaySlots.filter((slot) => entries.some((e) => getEntryMatch(e, slot))).length,
    0
  );
  const todayLoggedCount = todaySlots.length - pendingCount;
  const weeklyBars = useMemo(() => getWeeklyBars(allSlots, entries), [allSlots, entries]);
  const weeklyLogged = weeklyBars.reduce((sum, d) => sum + d.logged, 0);
  const weeklyTotal = weeklyBars.reduce((sum, d) => sum + d.total, 0);
  const complianceRate = weeklyTotal > 0 ? Math.min(100, Math.round((weeklyLogged / weeklyTotal) * 100)) : 0;
  const recentEntries = entries.slice(0, 3);

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="page-shell space-y-4 pt-4 lg:space-y-5">

      {/* ═══ Zone 1: Greeting Bar ═══ */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-content-tertiary">{greeting}</p>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-bold leading-tight text-content-primary">
            {loading ? <Skeleton className="h-8 w-48" /> : displayName || "Teacher"}
          </h1>
          <p className="font-mono text-caption text-content-tertiary">
            {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Coordinator mode switch */}
      {isCoordinator && activeMode === "teacher" && (
        <button
          type="button"
          onClick={() => switchMode("coordinator")}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] px-4 text-sm font-medium text-content-secondary transition hover:bg-[hsl(var(--surface-secondary))]"
        >
          Open coordinator mode
          <ArrowUpRight className="h-4 w-4" />
        </button>
      )}

      {/* ═══ Zone 2: Today's Schedule Card ═══ */}
      <section className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[17px] font-semibold text-content-primary">Today&apos;s Classes</h2>
          <span className="font-mono text-caption font-semibold text-content-tertiary">
            {todayLoggedCount}/{todaySlots.length || 0}
          </span>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[120px] shrink-0 rounded-md border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3">
                <Skeleton className="h-3 w-8 mb-2" />
                <Skeleton className="h-5 w-12 mb-1" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : isWeekday && todaySlots.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {todaySlots.map((slot, index) => {
              const isLogged = entries.some((e) => getEntryMatch(e, slot));
              const status = getSlotStatus(slot, index, currentSlotIndex, isLogged);
              const logHref = `/logbook/new?slotId=${slot.id}&assignmentId=${slot.assignment.id}`;

              return (
                <Link
                  key={slot.id}
                  href={status === "logged" ? "#" : logHref}
                  className={cn(
                    "relative flex w-[120px] shrink-0 flex-col rounded-md border p-3 transition active:scale-[0.99]",
                    status === "logged" && "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]",
                    status === "current" && "border-[hsl(var(--accent)/0.5)] border-2",
                    status === "upcoming" && "border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]",
                    status === "missed" && "border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.03)]",
                  )}
                  onClick={status === "logged" ? (e) => e.preventDefault() : undefined}
                >
                  {/* Period number */}
                  <span className="font-mono text-caption font-semibold text-content-secondary">
                    P{slot.periodNumber}
                  </span>

                  {/* Subject abbreviation */}
                  <span className={cn(
                    "mt-1 text-[15px] font-bold",
                    status === "current" ? "text-[hsl(var(--accent))]" : "text-content-primary",
                  )}>
                    {getSubjectAbbrev(slot.assignment.subjectName)}
                  </span>

                  {/* Class name */}
                  <span className="text-caption text-content-secondary truncate">
                    {slot.assignment.className}
                  </span>

                  {/* Time range */}
                  <span className="mt-1 font-mono text-[11px] text-content-tertiary">
                    {slot.startTime}–{slot.endTime}
                  </span>

                  {/* Status overlay */}
                  {status === "logged" && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    </span>
                  )}
                  {status === "current" && (
                    <span className="mt-2 text-[11px] font-semibold text-[hsl(var(--accent))]">
                      Log Now
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          /* No classes today / weekend */
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--surface-secondary))] text-2xl">
              ☕
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-content-primary">
              {isWeekday ? "No classes today" : "No classes today"}
            </h3>
            <p className="mt-1 text-[13px] text-content-tertiary">Enjoy your rest.</p>
          </div>
        )}
      </section>

      {/* ═══ Zone 3: Quick Stats Row ═══ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Compliance */}
        <div className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-3 text-center">
          <div className="mx-auto mb-1.5 flex h-12 w-12 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-12 w-12">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--surface-secondary))"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={complianceRate >= 80 ? "hsl(var(--success))" : complianceRate >= 50 ? "hsl(var(--warning))" : "hsl(var(--danger))"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${complianceRate}, 100`}
                className="transition-all duration-700 ease-out"
              />
              <text
                x="18" y="20.5"
                textAnchor="middle"
                className="fill-content-primary"
                style={{ fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-display)" }}
              >
                {loading ? "—" : `${complianceRate}%`}
              </text>
            </svg>
          </div>
          <p className="text-caption font-medium text-content-tertiary">This week</p>
        </div>

        {/* Streak */}
        <div className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-3 text-center">
          <div className="mx-auto mb-1.5 flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--warning)/0.1)]">
            <Flame className="h-6 w-6 text-[hsl(var(--warning))]" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-content-primary">
            {loading ? "—" : streak}
          </p>
          <p className="text-caption font-medium text-content-tertiary">Day streak</p>
        </div>

        {/* Logged today */}
        <div className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-3 text-center">
          <div className="mx-auto mb-1.5 flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--success)/0.1)]">
            <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-content-primary">
            {loading ? "—" : `${todayLoggedCount}/${todaySlots.length || 0}`}
          </p>
          <p className="text-caption font-medium text-content-tertiary">Logged today</p>
        </div>
      </div>

      {/* ═══ Zone 4: Weekly Progress ═══ */}
      <section className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[17px] font-semibold text-content-primary">This week</h2>
          <span className="font-mono text-caption font-medium text-content-tertiary">
            {weeklyLogged}/{weeklyTotal} periods
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {weeklyBars.map((bar) => (
            <div key={bar.key} className="flex flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end rounded-sm bg-[hsl(var(--surface-secondary))] p-1.5">
                <div
                  className={cn(
                    "w-full rounded-sm transition-all duration-500",
                    bar.ratio === 100
                      ? "bg-[hsl(var(--success))]"
                      : bar.ratio > 0
                        ? "bg-[hsl(var(--accent))]"
                        : "bg-[hsl(var(--border-muted))]",
                  )}
                  style={{ height: `${Math.max(bar.ratio, 8)}%` }}
                />
              </div>
              <div className="text-center">
                <p className={cn(
                  "font-mono text-[11px]",
                  bar.isToday ? "font-bold text-content-primary" : "font-medium text-content-tertiary"
                )}>
                  {bar.key}
                </p>
                <p className="text-[10px] text-content-tertiary">{bar.logged}/{bar.total}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Zone 5: Recent Entries ═══ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-content-primary">Recent</h2>
          <Link href="/history" className="inline-flex items-center gap-1 text-[13px] font-medium text-[hsl(var(--accent-text))]">
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentEntries.length > 0 ? (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-[hsl(var(--surface-secondary))]">
              <BookOpen className="h-7 w-7 text-content-tertiary" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-content-primary">Your logbook is empty</h3>
            <p className="mt-1 text-[13px] text-content-tertiary">Tap + to log your first class.</p>
            <Link
              href="/logbook/new"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-6 text-[13px] font-semibold text-white active:scale-[0.97]"
            >
              <PenLine className="h-4 w-4" />
              Log your first class
            </Link>
          </div>
        )}
      </section>

      {/* Bottom nav spacer */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
