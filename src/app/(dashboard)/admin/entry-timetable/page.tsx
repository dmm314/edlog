"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle,
  Flag,
  X,
  FileText,
  Users,
  FolderOpen,
  FolderClosed,
  AlertTriangle,
} from "lucide-react";

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
];

interface PeriodSchedule {
  periodNum: number;
  label: string;
  startTime: string;
  endTime: string;
}

interface SlotTeacher {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

interface TimetableSlotInfo {
  id: string;
  dayOfWeek: number;
  periodNum: number | null;
  periodLabel: string;
  startTime: string;
  endTime: string;
  teacher: SlotTeacher;
  subject: string;
}

interface EntryInfo {
  id: string;
  date: string;
  dayOfWeek: number;
  period: number | null;
  duration: number;
  status: string;
  topicText: string | null;
  moduleName: string | null;
  notes: string | null;
  objectives: string | null;
  studentAttendance: number | null;
  engagementLevel: string | null;
  subject: string;
  teacher: SlotTeacher;
  timetableSlotId: string | null;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
  slotCount: number;
  teacherCount: number;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const monStr = monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const friStr = friday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${monStr} – ${friStr}`;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getStatusColor(status: string) {
  switch (status) {
    case "VERIFIED": return "bg-[hsl(var(--success))]";
    case "FLAGGED": return "bg-[hsl(var(--danger))]";
    case "DRAFT": return "bg-[var(--text-tertiary)]";
    default: return "bg-[hsl(var(--accent))]";
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "VERIFIED": return "bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]";
    case "FLAGGED": return "bg-[hsl(var(--danger)/0.1)] border-[hsl(var(--danger)/0.2)] text-[hsl(var(--danger))]";
    case "DRAFT": return "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)]";
    default: return "bg-[hsl(var(--accent-soft))] border-[hsl(var(--accent)/0.2)] text-[hsl(var(--accent))]";
  }
}

function getSubjectColor(index: number): string {
  const colors = [
    "from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))]",
    "from-[hsl(var(--success))] to-[hsl(var(--success))]",
    "from-[hsl(var(--accent-strong))] to-[hsl(var(--accent-text))]",
    "from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))]",
    "from-[hsl(var(--danger))] to-[hsl(var(--danger))]",
    "from-[hsl(var(--accent))] to-[hsl(var(--accent))]",
  ];
  return colors[index % colors.length];
}

function getSubjectBgLight(index: number): string {
  const colors = [
    "bg-[hsl(var(--accent-soft))] border-[hsl(var(--accent)/0.2)]",
    "bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.2)]",
    "bg-[hsl(var(--accent-muted))] border-[hsl(var(--accent)/0.2)]",
    "bg-[hsl(var(--accent-soft))] border-[hsl(var(--accent)/0.2)]",
    "bg-[hsl(var(--danger)/0.1)] border-[hsl(var(--danger)/0.2)]",
    "bg-[hsl(var(--accent-soft))] border-[hsl(var(--accent)/0.2)]",
  ];
  return colors[index % colors.length];
}

function getSubjectText(index: number): string {
  const colors = [
    "text-[hsl(var(--accent-text))]",
    "text-[hsl(var(--success))]",
    "text-[hsl(var(--accent-strong))]",
    "text-[hsl(var(--accent-text))]",
    "text-[hsl(var(--danger))]",
    "text-[hsl(var(--accent))]",
  ];
  return colors[index % colors.length];
}

const LEVEL_ORDER = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

const ADMIN_ET_STATE_KEY = "edlog_admin_et_state";

function saveAdminETState(classId: string | null) {
  try { sessionStorage.setItem(ADMIN_ET_STATE_KEY, JSON.stringify({ classId })); } catch {}
}

function loadAdminETState(): { classId: string | null } | null {
  try {
    const saved = sessionStorage.getItem(ADMIN_ET_STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export default function EntryTimetablePage() {
  const savedState = useMemo(() => loadAdminETState(), []);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(savedState?.classId || null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const [periods, setPeriods] = useState<PeriodSchedule[]>([]);
  const [slots, setSlots] = useState<TimetableSlotInfo[]>([]);
  const [entries, setEntries] = useState<EntryInfo[]>([]);
  const [className, setClassName] = useState("");

  // Detail modal
  const [selectedEntry, setSelectedEntry] = useState<EntryInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlotInfo | null>(null);

  // Unfilled periods folder
  const [unfilledOpen, setUnfilledOpen] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/admin/timetable");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  // Fetch entry timetable data when class or week changes
  useEffect(() => {
    if (!selectedClassId) return;
    async function fetchEntryTimetable() {
      setLoadingGrid(true);
      try {
        const params = new URLSearchParams({
          classId: selectedClassId!,
          weekStart: formatDateISO(weekStart),
        });
        const res = await fetch(`/api/admin/entry-timetable?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPeriods(data.periods);
          setSlots(data.slots);
          setEntries(data.entries);
          setClassName(data.className);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingGrid(false);
      }
    }
    fetchEntryTimetable();
  }, [selectedClassId, weekStart]);

  function navigateWeek(direction: number) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  function goToCurrentWeek() {
    setWeekStart(getMonday(new Date()));
  }

  const isCurrentWeek = useMemo(() => {
    const currentMonday = getMonday(new Date());
    return formatDateISO(weekStart) === formatDateISO(currentMonday);
  }, [weekStart]);

  // Build subject color map
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    slots.forEach((s) => {
      if (!map.has(s.subject)) map.set(s.subject, idx++);
    });
    entries.forEach((e) => {
      if (!map.has(e.subject)) map.set(e.subject, idx++);
    });
    return map;
  }, [slots, entries]);

  // Build grid: periodNum -> dayOfWeek -> { slot?, entry? }
  const grid = useMemo(() => {
    const g: Record<number, Record<number, { slot: TimetableSlotInfo | null; entry: EntryInfo | null }>> = {};

    for (const p of periods) {
      g[p.periodNum] = {};
      for (const day of DAYS) {
        g[p.periodNum][day.value] = { slot: null, entry: null };
      }
    }

    // Fill in timetable slots (permanent)
    for (const slot of slots) {
      if (slot.periodNum && g[slot.periodNum]) {
        g[slot.periodNum][slot.dayOfWeek] = {
          ...g[slot.periodNum][slot.dayOfWeek],
          slot,
        };
      }
    }

    // Fill in entries (dynamic per week)
    for (const entry of entries) {
      if (entry.period && g[entry.period]) {
        g[entry.period][entry.dayOfWeek] = {
          ...g[entry.period][entry.dayOfWeek],
          entry,
        };
      }
    }

    return g;
  }, [periods, slots, entries]);

  // Stats for the week
  const weekStats = useMemo(() => {
    const totalSlots = slots.length; // Slots per week = total slots for the class
    const filledCount = entries.length;
    const verifiedCount = entries.filter((e) => e.status === "VERIFIED").length;
    return { totalSlots, filledCount, verifiedCount };
  }, [slots, entries]);

  // Compute unfilled periods this week (slots without entries)
  const unfilledPeriods = useMemo(() => {
    const filled = new Set(
      entries.map((e) => `${e.dayOfWeek}-${e.period}`)
    );
    // Also match entries to slots by timetableSlotId
    const filledSlotIds = new Set(
      entries.filter((e) => e.timetableSlotId).map((e) => e.timetableSlotId)
    );

    return slots.filter((slot) => {
      if (filledSlotIds.has(slot.id)) return false;
      const periodMatch = slot.periodLabel.match(/\d+/);
      const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
      if (periodNum && filled.has(`${slot.dayOfWeek}-${periodNum}`)) return false;
      return true;
    }).map((slot) => {
      const dayLabel = DAYS.find((d) => d.value === slot.dayOfWeek)?.label || `Day ${slot.dayOfWeek}`;
      return { ...slot, dayLabel };
    });
  }, [slots, entries]);

  // Group classes by level for hierarchical navigation
  const groupedByLevel = useMemo(() => {
    const groups: Record<string, ClassOption[]> = {};
    for (const cls of classes) {
      const level = cls.level || "Other";
      if (!groups[level]) groups[level] = [];
      groups[level].push(cls);
    }
    return [
      ...LEVEL_ORDER.filter((l) => groups[l]?.length > 0).map((level) => ({
        level,
        classes: [...groups[level]].sort((a, b) => a.name.localeCompare(b.name)),
        totalSlots: groups[level].reduce((sum, c) => sum + c.slotCount, 0),
        compliance: (() => {
          const allReady = groups[level].every((c) => c.slotCount > 0 && c.teacherCount > 0);
          const someReady = groups[level].some((c) => c.slotCount > 0 && c.teacherCount > 0);
          return allReady ? "green" : someReady ? "amber" : "red";
        })(),
      })),
      // Any levels not in LEVEL_ORDER
      ...Object.keys(groups)
        .filter((l) => !LEVEL_ORDER.includes(l))
        .map((level) => ({
          level,
          classes: [...groups[level]].sort((a, b) => a.name.localeCompare(b.name)),
          totalSlots: groups[level].reduce((sum, c) => sum + c.slotCount, 0),
          compliance: "amber" as const,
        })),
    ];
  }, [classes]);

  // ─── CLASS LIST VIEW ───
  if (!selectedClassId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-tertiary)] pb-24">
        <div className="bg-gradient-to-br from-[var(--header-from)] via-[var(--header-via)] to-[var(--header-to)] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
          <div className="max-w-lg mx-auto relative">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--header-text-muted)]" />Entry Timetable
            </h1>
            <p className="text-[var(--header-text-muted)] text-sm mt-0.5">View teacher entries by class and week</p>
          </div>
        </div>

        <div className="px-5 mt-4 max-w-lg mx-auto space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 animate-pulse flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-[var(--skeleton-base)] rounded w-24 mb-1.5" />
                    <div className="h-3 bg-[var(--skeleton-base)] rounded w-36" />
                  </div>
                  <div className="h-4 w-4 bg-[var(--skeleton-base)] rounded" />
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-semibold">No classes set up yet</p>
              <Link href="/admin/classes" className="text-sm text-[var(--accent-text)] font-semibold mt-2 inline-block">Add classes first</Link>
            </div>
          ) : !expandedLevel ? (
            /* ── LEVEL GROUP VIEW ── */
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] px-1 pb-1">
                Select a Level
              </p>
              {groupedByLevel.map((group, gi) => {
                const dotColor =
                  group.compliance === "green"
                    ? "hsl(var(--success))"
                    : group.compliance === "amber"
                    ? "hsl(var(--accent-strong))"
                    : "hsl(var(--danger))";
                return (
                  <button
                    key={group.level}
                    onClick={() => setExpandedLevel(group.level)}
                    className="card p-4 w-full text-left flex items-center justify-between hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.98]"
                    style={{ animationDelay: `${gi * 40}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-bold text-[var(--text-primary)]"
                        style={{ fontSize: "15px" }}
                      >
                        {group.level.toUpperCase()}
                      </h4>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {group.classes.length} class{group.classes.length !== 1 ? "es" : ""}
                        {group.totalSlots > 0 && (
                          <span> · {group.totalSlots} slots/wk</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                        title={
                          group.compliance === "green"
                            ? "All classes set up"
                            : group.compliance === "amber"
                            ? "Some classes need setup"
                            : "No classes set up"
                        }
                      />
                      <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            /* ── CLASS LIST WITHIN A LEVEL ── */
            <>
              <button
                onClick={() => setExpandedLevel(null)}
                className="inline-flex items-center gap-1.5 text-sm mb-1 transition-colors"
                style={{ color: "var(--accent-text)" }}
              >
                <ChevronLeft className="w-4 h-4" />
                All Levels
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] px-1 pb-1">
                {expandedLevel}
              </p>
              {(groupedByLevel.find((g) => g.level === expandedLevel)?.classes ?? []).map((cls, i) => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); saveAdminETState(cls.id); }}
                  className="card p-4 w-full text-left flex items-center gap-3.5 hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.98]"
                  style={{
                    borderLeft: "4px solid transparent",
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSubjectColor(i)} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-xs font-bold text-white">{cls.name.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{cls.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{cls.slotCount} slot{cls.slotCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{cls.teacherCount} teacher{cls.teacherCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── ENTRY TIMETABLE GRID VIEW ───
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-tertiary)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--header-from)] via-[var(--header-via)] to-[var(--header-to)] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <button onClick={() => { setSelectedClassId(null); setSelectedEntry(null); setSelectedSlot(null); saveAdminETState(null); }}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />{expandedLevel || "All Classes"}
          </button>
          <h1 className="text-xl font-bold text-white">{className}</h1>
          <p className="text-[var(--header-text-muted)] text-sm mt-0.5">Entry timetable</p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Week Navigation */}
        <div className="card p-3 flex items-center justify-between">
          <button onClick={() => navigateWeek(-1)} className="w-9 h-9 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors active:scale-95">
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="text-center flex-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">{formatWeekRange(weekStart)}</p>
            {!isCurrentWeek && (
              <button onClick={goToCurrentWeek} className="text-[11px] text-[var(--accent-text)] font-semibold mt-0.5 hover:underline">
                Go to current week
              </button>
            )}
            {isCurrentWeek && (
              <p className="text-[11px] text-[var(--accent-text)] font-semibold mt-0.5">Current Week</p>
            )}
          </div>
          <button onClick={() => navigateWeek(1)} className="w-9 h-9 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors active:scale-95">
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{weekStats.totalSlots}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Scheduled</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-[var(--accent-text)]">{weekStats.filledCount}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Filled</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-[hsl(var(--success))]">{weekStats.verifiedCount}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Verified</p>
          </div>
        </div>

        {/* Unfilled Periods Folder */}
        {!loadingGrid && unfilledPeriods.length > 0 && (
          <div className="card overflow-hidden">
            <button
              onClick={() => setUnfilledOpen(!unfilledOpen)}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
            >
              {unfilledOpen ? (
                <FolderOpen className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
              ) : (
                <FolderClosed className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Unfilled Periods
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {unfilledPeriods.length} period{unfilledPeriods.length !== 1 ? "s" : ""} without entries this week
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[hsl(var(--accent-strong))] bg-[hsl(var(--accent-soft))] px-2 py-0.5 rounded-full">
                  {unfilledPeriods.length}
                </span>
                <ChevronRight className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${unfilledOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {unfilledOpen && (
              <div className="border-t border-[var(--border-secondary)] divide-y divide-[var(--border-secondary)]">
                {DAYS.map((day) => {
                  const dayUnfilled = unfilledPeriods.filter((p) => p.dayOfWeek === day.value);
                  if (dayUnfilled.length === 0) return null;
                  return (
                    <div key={day.value} className="px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">
                        {day.label}
                      </p>
                      <div className="space-y-1.5">
                        {dayUnfilled.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => { setSelectedSlot(slot); setSelectedEntry(null); }}
                            className="w-full flex items-center gap-2.5 bg-[hsl(var(--accent-soft))]/70 hover:bg-[hsl(var(--accent-soft))] border border-[hsl(var(--accent)/0.1)] rounded-lg px-3 py-2 text-left transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--accent-glow))] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                                {slot.subject} &middot; {slot.periodLabel}
                              </p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">
                                {slot.teacher.firstName} {slot.teacher.lastName} &middot; {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Timetable Grid */}
        {loadingGrid ? (
          <div className="card p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent)] rounded-full mx-auto mb-3" />
            <p className="text-sm text-[var(--text-tertiary)]">Loading timetable...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="card p-6 text-center">
            <Calendar className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)] font-medium">No period schedule set up</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[var(--bg-tertiary)]/80 border-b border-[var(--border-secondary)]">
                    <th className="px-1.5 py-2.5 text-left text-[var(--text-tertiary)] font-semibold w-[52px] sticky left-0 bg-[var(--bg-tertiary)]/80 z-10">
                      Period
                    </th>
                    {DAYS.map((day) => {
                      const dateForDay = new Date(weekStart);
                      dateForDay.setDate(dateForDay.getDate() + day.value - 1);
                      const isToday = formatDateISO(dateForDay) === formatDateISO(new Date());
                      return (
                        <th key={day.value} className={`px-1 py-2.5 text-center font-semibold min-w-[54px] ${isToday ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"}`}>
                          <span className="block">{day.short}</span>
                          <span className={`block text-[9px] mt-0.5 ${isToday ? "text-[var(--accent-text)] font-bold" : "text-[var(--text-quaternary)]"}`}>
                            {dateForDay.getDate()}/{dateForDay.getMonth() + 1}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.periodNum} className="border-b border-[var(--border-secondary)] last:border-0">
                      <td className="px-1.5 py-1 align-top sticky left-0 bg-[var(--bg-elevated)] z-10">
                        <div className="font-semibold text-[var(--text-secondary)] text-[11px]">P{period.periodNum}</div>
                        <div className="text-[9px] text-[var(--text-tertiary)] whitespace-nowrap">{period.startTime}</div>
                      </td>
                      {DAYS.map((day) => {
                        const cell = grid[period.periodNum]?.[day.value];
                        const slot = cell?.slot;
                        const entry = cell?.entry;
                        const dateForDay = new Date(weekStart);
                        dateForDay.setDate(dateForDay.getDate() + day.value - 1);
                        const isToday = formatDateISO(dateForDay) === formatDateISO(new Date());
                        const colorIdx = slot ? (subjectColorMap.get(slot.subject) ?? 0) : (entry ? (subjectColorMap.get(entry.subject) ?? 0) : 0);

                        if (!slot && !entry) {
                          return (
                            <td key={day.value} className="px-0.5 py-1 align-top">
                              <div className={`h-[42px] rounded-lg border border-dashed ${isToday ? "border-[var(--accent)]/30" : "border-[var(--border-secondary)]"}`} style={isToday ? { background: "color-mix(in srgb, var(--accent-light) 30%, transparent)" } : undefined} />
                            </td>
                          );
                        }

                        // Has a slot (permanent timetable) — show with or without entry
                        if (slot) {
                          return (
                            <td key={day.value} className="px-0.5 py-1 align-top">
                              <button
                                onClick={() => { setSelectedSlot(slot); setSelectedEntry(entry || null); }}
                                className={`w-full min-h-[42px] rounded-lg border p-1 text-left transition-all hover:shadow-sm active:scale-95 relative ${
                                  entry
                                    ? `${getSubjectBgLight(colorIdx)}`
                                    : `border-[var(--border-primary)] bg-[var(--bg-tertiary)] ${isToday ? "border-[var(--accent)]/30" : ""}`
                                }`}
                              >
                                <p className={`font-bold truncate leading-tight ${entry ? getSubjectText(colorIdx) : "text-[var(--text-tertiary)]"}`}>
                                  {slot.subject.length > 6 ? slot.subject.slice(0, 6) + "…" : slot.subject}
                                </p>
                                <p className="text-[9px] text-[var(--text-tertiary)] truncate mt-0.5">
                                  {slot.teacher.firstName.charAt(0)}.{slot.teacher.lastName.charAt(0)}
                                </p>
                                {/* Status indicator */}
                                {entry && (
                                  <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${getStatusColor(entry.status)}`} />
                                )}
                                {!entry && (
                                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[var(--bg-tertiary)]" />
                                )}
                              </button>
                            </td>
                          );
                        }

                        // Entry without slot (manual entry)
                        return (
                          <td key={day.value} className="px-0.5 py-1 align-top">
                            <button
                              onClick={() => { setSelectedSlot(null); setSelectedEntry(entry); }}
                              className={`w-full min-h-[42px] rounded-lg border p-1 text-left transition-all hover:shadow-sm active:scale-95 relative ${getSubjectBgLight(colorIdx)}`}
                            >
                              <p className={`font-bold truncate leading-tight ${getSubjectText(colorIdx)}`}>
                                {entry!.subject.length > 6 ? entry!.subject.slice(0, 6) + "…" : entry!.subject}
                              </p>
                              <p className="text-[9px] text-[var(--text-tertiary)] truncate mt-0.5">
                                {entry!.teacher.firstName.charAt(0)}.{entry!.teacher.lastName.charAt(0)}
                              </p>
                              <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${getStatusColor(entry!.status)}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-3 py-2.5 border-t border-[var(--border-secondary)] flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))]" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--danger))]" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-tertiary)]" />
                <span>Empty</span>
              </div>
            </div>
          </div>
        )}

        {/* Entry Detail Modal */}
        {(selectedEntry || selectedSlot) && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedEntry(null); setSelectedSlot(null); }}>
            <div className="w-full max-w-lg bg-[var(--bg-elevated)] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[var(--bg-elevated)] z-10 px-5 pt-4 pb-3 border-b border-[var(--border-secondary)] flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {selectedEntry ? "Entry Details" : "Slot Details"}
                </h3>
                <button onClick={() => { setSelectedEntry(null); setSelectedSlot(null); }}
                  className="w-8 h-8 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors">
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              </div>

              <div className="p-5 pb-24 space-y-4">
                {/* Teacher info */}
                {(selectedEntry?.teacher || selectedSlot?.teacher) && (() => {
                  const teacher = selectedEntry?.teacher || selectedSlot!.teacher;
                  return (
                    <div className="flex items-center gap-3">
                      {teacher.photoUrl ? (
                        <Image src={teacher.photoUrl} alt={`${teacher.firstName} ${teacher.lastName}`} width={44} height={44}
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center ring-2 ring-white shadow-sm">
                          <span className="text-sm font-bold text-white">{teacher.firstName[0]}{teacher.lastName[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {selectedEntry?.subject || selectedSlot?.subject}
                          {selectedSlot && <span> &middot; {selectedSlot.periodLabel}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Entry details */}
                {selectedEntry ? (
                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBg(selectedEntry.status)}`}>
                        {selectedEntry.status === "VERIFIED" && <CheckCircle className="w-3 h-3" />}
                        {selectedEntry.status === "FLAGGED" && <Flag className="w-3 h-3" />}
                        {selectedEntry.status}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">{selectedEntry.date}</span>
                    </div>

                    {/* Topic */}
                    {selectedEntry.topicText && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--accent-light)" }}>
                          <BookOpen className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Topic</p>
                          <p className="text-sm text-[var(--text-secondary)] font-medium">{selectedEntry.topicText}</p>
                        </div>
                      </div>
                    )}

                    {/* Module */}
                    {selectedEntry.moduleName && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[hsl(var(--accent-soft))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Module</p>
                          <p className="text-sm text-[var(--text-secondary)] font-medium">{selectedEntry.moduleName}</p>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-[hsl(var(--accent-soft))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Duration</p>
                        <p className="text-sm text-[var(--text-secondary)] font-medium">{selectedEntry.duration} min</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedEntry.notes && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[hsl(var(--success)/0.1)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Notes</p>
                          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{selectedEntry.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Objectives */}
                    {selectedEntry.objectives && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[hsl(var(--accent-soft))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Objectives</p>
                          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{Array.isArray(selectedEntry.objectives) ? selectedEntry.objectives.map((o: { text: string }) => o.text).join(", ") : selectedEntry.objectives}</p>
                        </div>
                      </div>
                    )}

                    {/* Attendance & Engagement */}
                    {(selectedEntry.studentAttendance !== null || selectedEntry.engagementLevel) && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedEntry.studentAttendance !== null && (
                          <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Attendance</p>
                            <p className="text-sm font-bold text-[var(--text-secondary)] mt-0.5">{selectedEntry.studentAttendance} students</p>
                          </div>
                        )}
                        {selectedEntry.engagementLevel && (
                          <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Engagement</p>
                            <p className={`text-sm font-bold mt-0.5 ${
                              selectedEntry.engagementLevel === "HIGH" ? "text-[hsl(var(--success))]" :
                              selectedEntry.engagementLevel === "MEDIUM" ? "text-[hsl(var(--accent-strong))]" : "text-[hsl(var(--danger))]"
                            }`}>
                              {selectedEntry.engagementLevel}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : selectedSlot ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-7 h-7 text-[var(--text-quaternary)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] font-semibold">No entry submitted</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      {selectedSlot.teacher.firstName} {selectedSlot.teacher.lastName} has not filled in this period yet
                    </p>
                    <p className="text-xs text-[var(--text-quaternary)] mt-2">{selectedSlot.periodLabel} &middot; {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
