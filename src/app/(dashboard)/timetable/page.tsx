"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { getSubjectColor } from "@/lib/colors";

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
  jointWith?: string[];
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Get JS day-of-week (1=Mon … 5=Fri) for today, or 0 if weekend */
function getTodayDow(): number {
  const jsDay = new Date().getDay();
  if (jsDay === 0 || jsDay === 6) return 0;
  return jsDay;
}

/** Get subject abbreviation (first 3-4 chars) */
function abbrev(name: string): string {
  if (name.length <= 4) return name;
  // Use first letters of words if multi-word
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
  }
  return name.slice(0, 4);
}

/** Get class abbreviation */
function classAbbrev(name: string): string {
  // e.g. "Form 3 A" -> "F3A", "Lower Sixth Science" -> "LS-Sci"
  return name
    .replace("Form ", "F")
    .replace("Lower Sixth", "L6")
    .replace("Upper Sixth", "U6")
    .split(" ")
    .join("")
    .slice(0, 6);
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

/** Determine if a period is the "current" one right now */
function isCurrentPeriod(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return nowMin >= startMin && nowMin < endMin;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function TimetableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[48px_repeat(5,1fr)] bg-[var(--bg-tertiary)]">
        <div className="p-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-2">
            <div className="h-3 bg-[var(--skeleton-base)] rounded w-8 mx-auto animate-pulse" />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-[var(--border-secondary)]">
          <div className="p-2 flex items-center justify-center">
            <div className="h-3 w-6 bg-[var(--skeleton-base)] rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="p-1">
              <div className="h-12 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            </div>
          ))}
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
      <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-[var(--text-quaternary)]" />
      </div>
      <p className="text-[var(--text-tertiary)] font-medium text-base" style={{ fontFamily: "var(--font-body)" }}>
        No timetable yet
      </p>
      <p className="text-[var(--text-tertiary)] text-sm mt-1.5 max-w-[260px] mx-auto leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        Your school administrator will set up your weekly timetable once classes and subjects are assigned.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function TimetablePage() {
  const router = useRouter();
  const [slotsByDay, setSlotsByDay] = useState<Record<number, TimetableSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayDow = getTodayDow();

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

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const slots of Object.values(slotsByDay)) {
      for (const s of slots) {
        set.add(s.assignment.subjectId);
      }
    }
    return set.size;
  }, [slotsByDay]);

  /** Build a lookup: dayOfWeek-periodLabel -> slot */
  const slotGrid = useMemo(() => {
    const grid: Record<string, TimetableSlot> = {};
    for (const [day, slots] of Object.entries(slotsByDay)) {
      for (const slot of slots) {
        grid[`${day}-${slot.periodLabel}`] = slot;
      }
    }
    return grid;
  }, [slotsByDay]);

  function handleCellTap(slot: TimetableSlot) {
    const params = new URLSearchParams({
      assignmentId: slot.assignment.id,
      slotId: slot.id,
    });
    router.push(`/logbook/new?${params.toString()}`);
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* ============ Header ============ */}
      <div className="page-header px-5 pt-10 pb-6 rounded-b-2xl">
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
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                My Timetable
              </h1>
              <p className="text-[var(--header-text-muted)] text-sm" style={{ fontFamily: "var(--font-body)" }}>
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
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {totalSlots}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--header-text-muted)] font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                  Periods
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {uniqueSubjects}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--header-text-muted)] font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                  Subjects
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {new Set(
                    Object.values(slotsByDay)
                      .flat()
                      .map((s) => s.assignment.classId)
                  ).size}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--header-text-muted)] font-semibold" style={{ fontFamily: "var(--font-body)" }}>
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
            <p className="text-red-500 font-medium text-sm" style={{ fontFamily: "var(--font-body)" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-[var(--accent-text)] font-semibold"
            >
              Retry
            </button>
          </div>
        ) : totalSlots === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ---- 5-column Grid ---- */}
            <div className="card overflow-hidden animate-fade-slide-in">
              {/* Column headers: Mon–Fri */}
              <div className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-[var(--border-primary)]">
                <div className="p-2" />
                {DAYS.map((day) => {
                  const isToday = todayDow === day.value;
                  return (
                    <div
                      key={day.value}
                      className={`p-2 text-center ${isToday ? "bg-amber-100/60" : "bg-[var(--bg-tertiary)]"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isToday ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"
                        }`}
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {day.short}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Period rows */}
              {periodTimeline.map((period, rowIdx) => {
                const isCurrent = todayDow > 0 && isCurrentPeriod(period.startTime, period.endTime);
                return (
                  <div
                    key={period.periodLabel}
                    className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-[var(--border-secondary)] last:border-b-0 animate-fade-slide-in"
                    style={{ animationDelay: `${rowIdx * 80}ms` }}
                  >
                    {/* Period label */}
                    <div className="p-1.5 flex flex-col items-center justify-center border-r border-[var(--border-secondary)]">
                      <span
                        className="text-[10px] font-bold text-[var(--text-secondary)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {period.periodLabel}
                      </span>
                      <span
                        className="text-[8px] text-[var(--text-tertiary)] leading-tight"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {period.startTime}
                      </span>
                    </div>

                    {/* Day cells */}
                    {DAYS.map((day) => {
                      const slot = slotGrid[`${day.value}-${period.periodLabel}`];
                      const isToday = todayDow === day.value;
                      const isCurrentCell = isToday && isCurrent;

                      if (slot) {
                        const color = getSubjectColor(slot.assignment.subjectName);
                        return (
                          <button
                            key={day.value}
                            onClick={() => handleCellTap(slot)}
                            className={`p-1 m-0.5 rounded-lg text-left transition-all active:scale-[0.97] duration-[80ms] ${color.bg} ${
                              isCurrentCell ? "ring-2 ring-[var(--accent)]" : ""
                            } ${isToday && !isCurrentCell ? "bg-amber-50/50" : ""}`}
                            style={{ borderRadius: "8px" }}
                          >
                            <p
                              className={`text-[12px] font-bold leading-tight ${color.text}`}
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              {abbrev(slot.assignment.subjectName)}
                            </p>
                            <p
                              className="text-[10px] font-medium text-[var(--text-tertiary)] leading-tight mt-0.5"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              {classAbbrev(slot.assignment.className)}
                            </p>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={day.value}
                          className={`m-0.5 rounded-lg ${
                            isToday ? "bg-amber-50/30" : ""
                          } ${isCurrentCell ? "ring-2 ring-[var(--accent-muted)]" : ""}`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Map(
                    Object.values(slotsByDay)
                      .flat()
                      .map((s) => [s.assignment.subjectId, s.assignment.subjectName])
                  ).entries()
                ).map(([id, name]) => {
                  const color = getSubjectColor(name);
                  return (
                    <div key={id} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${color.accent}`} />
                      <span className="text-[10px] text-[var(--text-tertiary)]" style={{ fontFamily: "var(--font-body)" }}>
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
