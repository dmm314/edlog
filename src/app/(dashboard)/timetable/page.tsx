"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Calendar, Clock, BookOpen, ArrowLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SlotAssignment {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignment: SlotAssignment;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
];

const COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", accent: "bg-blue-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", accent: "bg-emerald-500" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", accent: "bg-purple-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", accent: "bg-cyan-500" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", accent: "bg-indigo-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", accent: "bg-orange-500" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Simple string hash -> deterministic colour index */
function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/** Get JS day-of-week (1=Mon … 5=Fri) for today, or 0 if weekend */
function getTodayDow(): number {
  const jsDay = new Date().getDay(); // 0=Sun … 6=Sat
  if (jsDay === 0 || jsDay === 6) return 0;
  return jsDay; // 1=Mon … 5=Fri
}

/** Collect every unique period across all days, sorted by startTime */
function buildPeriodTimeline(slotsByDay: Record<number, TimetableSlot[]>) {
  const seen = new Map<string, { startTime: string; endTime: string; periodLabel: string }>();
  for (const slots of Object.values(slotsByDay)) {
    for (const s of slots) {
      if (!seen.has(s.periodLabel)) {
        seen.set(s.periodLabel, {
          startTime: s.startTime,
          endTime: s.endTime,
          periodLabel: s.periodLabel,
        });
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function TimetableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-10 bg-slate-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
      {/* Slot skeletons */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium text-base">No timetable yet</p>
      <p className="text-slate-400 text-sm mt-1.5 max-w-[260px] mx-auto leading-relaxed">
        Your school administrator will set up your weekly timetable once classes and subjects are assigned.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slot card                                                          */
/* ------------------------------------------------------------------ */

function SlotCard({ slot }: { slot: TimetableSlot }) {
  const color = hashColor(slot.assignment.subjectName);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${color.border} ${color.bg} p-4 transition-all hover:shadow-md`}
    >
      {/* Accent left bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent} rounded-l-xl`}
      />

      <div className="ml-2">
        {/* Period & time */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {slot.periodLabel}
          </span>
          <span className="text-slate-300">&middot;</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            {slot.startTime} &ndash; {slot.endTime}
          </span>
        </div>

        {/* Subject */}
        <p className={`font-bold text-[15px] leading-tight ${color.text}`}>
          {slot.assignment.subjectName}
        </p>

        {/* Class */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">
            {slot.assignment.className}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Free period placeholder                                            */
/* ------------------------------------------------------------------ */

function FreePeriod({
  periodLabel,
  startTime,
  endTime,
}: {
  periodLabel: string;
  startTime: string;
  endTime: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4">
      <div className="ml-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {periodLabel}
          </span>
          <span className="text-slate-200">&middot;</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <Clock className="w-3 h-3" />
            {startTime} &ndash; {endTime}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-300 italic">Free Period</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function TimetablePage() {
  const [slotsByDay, setSlotsByDay] = useState<Record<number, TimetableSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to today if weekday, otherwise Monday
  const todayDow = getTodayDow();
  const [activeDay, setActiveDay] = useState(todayDow || 1);

  /* ----- Fetch all 5 days in parallel ----- */
  useEffect(() => {
    async function fetchAllDays() {
      try {
        const results = await Promise.all(
          [1, 2, 3, 4, 5].map((day) =>
            fetch(`/api/timetable/slots?dayOfWeek=${day}`).then((res) => {
              if (!res.ok) throw new Error(`Failed to fetch day ${day}`);
              return res.json() as Promise<TimetableSlot[]>;
            })
          )
        );
        const mapped: Record<number, TimetableSlot[]> = {};
        results.forEach((slots, idx) => {
          mapped[idx + 1] = slots;
        });
        setSlotsByDay(mapped);
      } catch {
        setError("Failed to load timetable. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllDays();
  }, []);

  /* ----- Derived data ----- */
  const totalSlots = useMemo(
    () => Object.values(slotsByDay).reduce((acc, s) => acc + s.length, 0),
    [slotsByDay]
  );

  const periodTimeline = useMemo(() => buildPeriodTimeline(slotsByDay), [slotsByDay]);

  /** For a given day, build an ordered list of period rows (slot or free) */
  const buildDaySchedule = useCallback(
    (dayOfWeek: number) => {
      const daySlots = slotsByDay[dayOfWeek] || [];
      // Index slots by periodLabel for quick lookup
      const slotMap = new Map<string, TimetableSlot>();
      for (const s of daySlots) {
        slotMap.set(s.periodLabel, s);
      }
      return periodTimeline.map((period) => ({
        ...period,
        slot: slotMap.get(period.periodLabel) ?? null,
      }));
    },
    [slotsByDay, periodTimeline]
  );

  const activeSchedule = useMemo(
    () => buildDaySchedule(activeDay),
    [activeDay, buildDaySchedule]
  );

  /* ----- Unique subjects count ----- */
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const slots of Object.values(slotsByDay)) {
      for (const s of slots) {
        set.add(s.assignment.subjectId);
      }
    }
    return set.size;
  }, [slotsByDay]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ============ Header ============ */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Logbook
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">My Timetable</h1>
              <p className="text-brand-400 text-sm">
                {loading
                  ? "Loading..."
                  : `${totalSlots} slot${totalSlots !== 1 ? "s" : ""} across ${uniqueSubjects} subject${uniqueSubjects !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          {!loading && totalSlots > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-white">{totalSlots}</p>
                <p className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold">
                  Periods
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-white">{uniqueSubjects}</p>
                <p className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold">
                  Subjects
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-white">
                  {new Set(
                    Object.values(slotsByDay)
                      .flat()
                      .map((s) => s.assignment.classId)
                  ).size}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold">
                  Classes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ Content ============ */}
      <div className="px-5 mt-4 max-w-lg mx-auto">
        {loading ? (
          <TimetableSkeleton />
        ) : error ? (
          <div className="card p-6 text-center">
            <p className="text-red-500 font-medium text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-brand-700 font-semibold"
            >
              Retry
            </button>
          </div>
        ) : totalSlots === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ---- Day tabs ---- */}
            <div className="flex gap-1.5 mb-5">
              {DAYS.map((day) => {
                const isActive = activeDay === day.value;
                const isToday = todayDow === day.value;
                const daySlotCount = (slotsByDay[day.value] || []).length;

                return (
                  <button
                    key={day.value}
                    onClick={() => setActiveDay(day.value)}
                    className={`
                      relative flex-1 py-2.5 rounded-xl text-center transition-all
                      ${
                        isActive
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                          : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                      }
                    `}
                  >
                    <span className="text-xs font-bold">{day.short}</span>
                    {/* Slot count dot */}
                    {daySlotCount > 0 && !isActive && (
                      <span className="block text-[10px] text-slate-400 leading-tight">
                        {daySlotCount}
                      </span>
                    )}
                    {daySlotCount > 0 && isActive && (
                      <span className="block text-[10px] text-white/70 leading-tight">
                        {daySlotCount}
                      </span>
                    )}
                    {daySlotCount === 0 && (
                      <span className="block text-[10px] text-slate-300 leading-tight">
                        &mdash;
                      </span>
                    )}
                    {/* Today indicator */}
                    {isToday && (
                      <span
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 ${
                          isActive
                            ? "bg-yellow-400 border-brand-600"
                            : "bg-brand-500 border-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ---- Day label ---- */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">
                {DAYS.find((d) => d.value === activeDay)?.label}
                {todayDow === activeDay && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </h2>
              <span className="text-xs text-slate-400">
                {(slotsByDay[activeDay] || []).length} period
                {(slotsByDay[activeDay] || []).length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ---- Slots for the active day ---- */}
            {activeSchedule.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No periods scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSchedule.map((row) =>
                  row.slot ? (
                    <SlotCard key={row.slot.id} slot={row.slot} />
                  ) : (
                    <FreePeriod
                      key={`free-${row.periodLabel}`}
                      periodLabel={row.periodLabel}
                      startTime={row.startTime}
                      endTime={row.endTime}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
