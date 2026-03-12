"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Clock,
  BookOpen,
  Layers,
  FileText,
  GraduationCap,
  Calendar,
  PenTool,
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_NAMES_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface ClassLevel {
  level: string;
  classes: {
    id: string;
    name: string;
    level: string;
    section: string | null;
    subjects: string[];
  }[];
}

interface PeriodInfo {
  periodNum: number;
  label: string;
  startTime: string;
  endTime: string;
}

interface SlotInfo {
  id: string;
  dayOfWeek: number;
  periodNum: number | null;
  periodLabel: string;
  startTime: string;
  endTime: string;
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
  timetableSlotId: string | null;
}

type View = "levels" | "classes" | "timetable";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const mOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const fOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${monday.toLocaleDateString("en-GB", mOpts)} — ${friday.toLocaleDateString("en-GB", fOpts)}`;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "VERIFIED":
      return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    case "FLAGGED":
      return <AlertTriangle className="w-3 h-3 text-red-500" />;
    case "SUBMITTED":
      return <Send className="w-3 h-3 text-[var(--accent)]" />;
    default:
      return <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "VERIFIED": return "border-l-emerald-500 bg-[var(--badge-verified-bg)]";
    case "FLAGGED": return "border-l-red-500 bg-[var(--badge-flagged-bg)]";
    case "SUBMITTED": return "border-l-amber-500 bg-[var(--badge-submitted-bg)]";
    default: return "border-l-[var(--text-quaternary)] bg-[var(--bg-tertiary)]";
  }
}

function getLevelColor(level: string): { bg: string; text: string; border: string } {
  if (level.includes("1")) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
  if (level.includes("2")) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  if (level.includes("3")) return { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" };
  if (level.includes("4")) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  if (level.includes("5")) return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
  if (level.toLowerCase().includes("lower")) return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
  if (level.toLowerCase().includes("upper")) return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
  return { bg: "bg-[var(--bg-tertiary)]", text: "text-[var(--text-secondary)]", border: "border-[var(--border-primary)]" };
}

const HISTORY_STATE_KEY = "edlog_history_state";

function saveHistoryState(state: { view: View; level: string; classId: string; className: string }) {
  try { sessionStorage.setItem(HISTORY_STATE_KEY, JSON.stringify(state)); } catch {}
}

function loadHistoryState(): { view: View; level: string; classId: string; className: string } | null {
  try {
    const saved = sessionStorage.getItem(HISTORY_STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export default function HistoryPage() {
  const saved = useMemo(() => loadHistoryState(), []);
  const [view, setView] = useState<View>(saved?.view || "levels");
  const [levels, setLevels] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedLevel, setSelectedLevel] = useState<string>(saved?.level || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(saved?.classId || "");
  const [selectedClassName, setSelectedClassName] = useState<string>(saved?.className || "");

  // Timetable data
  const [periods, setPeriods] = useState<PeriodInfo[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [entries, setEntries] = useState<EntryInfo[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // Week navigation
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));

  // Entry detail sheet
  const [selectedEntry, setSelectedEntry] = useState<EntryInfo | null>(null);

  // Fetch teacher's class levels on mount
  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await fetch("/api/teacher/entry-timetable");
        if (res.ok) {
          const data = await res.json();
          setLevels(data.levels || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchLevels();
  }, []);

  // Fetch timetable data when class + week changes
  useEffect(() => {
    if (!selectedClassId) return;
    async function fetchTimetable() {
      setLoadingTimetable(true);
      try {
        const weekStart = currentMonday.toISOString().split("T")[0];
        const res = await fetch(
          `/api/teacher/entry-timetable?classId=${selectedClassId}&weekStart=${weekStart}`
        );
        if (res.ok) {
          const data = await res.json();
          setPeriods(data.periods || []);
          setSlots(data.slots || []);
          setEntries(data.entries || []);
          if (data.className) setSelectedClassName(data.className);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingTimetable(false);
      }
    }
    fetchTimetable();
  }, [selectedClassId, currentMonday]);

  // Get classes for selected level
  const classesForLevel = useMemo(() => {
    const lvl = levels.find((l) => l.level === selectedLevel);
    return lvl?.classes || [];
  }, [levels, selectedLevel]);

  // Build timetable grid
  const timetableGrid = useMemo(() => {
    const grid: Record<string, { slot: SlotInfo | null; entry: EntryInfo | null }> = {};

    for (const slot of slots) {
      if (slot.periodNum !== null) {
        const key = `${slot.dayOfWeek}-${slot.periodNum}`;
        grid[key] = { slot, entry: null };
      }
    }

    for (const entry of entries) {
      let periodNum = entry.period;
      if (!periodNum && entry.timetableSlotId) {
        const slot = slots.find((s) => s.id === entry.timetableSlotId);
        if (slot) periodNum = slot.periodNum;
      }
      if (periodNum !== null && periodNum !== undefined) {
        const key = `${entry.dayOfWeek}-${periodNum}`;
        if (grid[key]) {
          grid[key].entry = entry;
        } else {
          grid[key] = { slot: null, entry };
        }
      }
    }

    return grid;
  }, [slots, entries]);

  // Week navigation
  function goToPrevWeek() {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function goToNextWeek() {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  function goToCurrentWeek() {
    setCurrentMonday(getMonday(new Date()));
  }

  const isCurrentWeek = useMemo(() => {
    const today = getMonday(new Date());
    return currentMonday.getTime() === today.getTime();
  }, [currentMonday]);

  // Navigate drill-down (with session persistence)
  function selectLevel(level: string) {
    setSelectedLevel(level);
    setView("classes");
    saveHistoryState({ view: "classes", level, classId: "", className: "" });
  }

  function selectClass(cls: { id: string; name: string }) {
    setSelectedClassId(cls.id);
    setSelectedClassName(cls.name);
    setCurrentMonday(getMonday(new Date()));
    setView("timetable");
    saveHistoryState({ view: "timetable", level: selectedLevel, classId: cls.id, className: cls.name });
  }

  function goBack() {
    if (view === "timetable") {
      setView("classes");
      setSelectedClassId("");
      setPeriods([]);
      setSlots([]);
      setEntries([]);
      saveHistoryState({ view: "classes", level: selectedLevel, classId: "", className: "" });
    } else if (view === "classes") {
      setView("levels");
      setSelectedLevel("");
      saveHistoryState({ view: "levels", level: "", classId: "", className: "" });
    }
  }

  // Count entries per class
  const totalEntryCount = useMemo(() => {
    return entries.length;
  }, [entries]);

  // ─── LEVELS VIEW ───
  if (view === "levels") {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="page-header px-5 pt-10 pb-8 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <FolderOpen className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>My Entries</h1>
            </div>
            <p className="text-[var(--header-text-muted)] text-sm" style={{ fontFamily: "var(--font-body)" }}>Browse your logbook entries by class</p>
          </div>
        </div>

        <div className="px-5 mt-5 max-w-lg mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-5 bg-[var(--skeleton-base)] rounded w-1/3 mb-2" />
                  <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-14 h-14 text-[var(--text-quaternary)] mx-auto mb-4" />
              <p className="text-[var(--text-tertiary)] font-semibold text-lg">No classes assigned</p>
              <p className="text-[var(--text-tertiary)] text-sm mt-1.5">
                Contact your school administrator to get assigned to classes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {levels.map((lvl, i) => {
                const lc = getLevelColor(lvl.level);
                const totalSubjects = new Set(lvl.classes.flatMap((c) => c.subjects)).size;
                return (
                  <button
                    key={lvl.level}
                    onClick={() => selectLevel(lvl.level)}
                    className="card w-full text-left p-4 flex items-center gap-4 group hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] animate-fade-slide-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className={`w-12 h-12 ${lc.bg} ${lc.border} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${lc.text}`} style={{ fontFamily: "var(--font-mono)" }}>
                        {lvl.level.replace("Form ", "F").replace("Lower Sixth", "L6").replace("Upper Sixth", "U6")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] text-[15px]" style={{ fontFamily: "var(--font-body)" }}>{lvl.level}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{lvl.classes.length}</span> {lvl.classes.length === 1 ? "class" : "classes"} &middot; <span style={{ fontFamily: "var(--font-mono)" }}>{totalSubjects}</span> {totalSubjects === 1 ? "subject" : "subjects"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CLASSES VIEW ───
  if (view === "classes") {
    const lc = getLevelColor(selectedLevel);
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="page-header px-5 pt-10 pb-8 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <button onClick={goBack} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </button>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{selectedLevel}</h1>
            <p className="text-[var(--header-text-muted)] text-sm mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Select a class to view entries</p>
          </div>
        </div>

        <div className="px-5 mt-5 max-w-lg mx-auto">
          {classesForLevel.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-tertiary)]">No classes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {classesForLevel.map((cls, i) => (
                <button
                  key={cls.id}
                  onClick={() => selectClass(cls)}
                  className="card p-4 text-left group hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] animate-fade-slide-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`w-10 h-10 ${lc.bg} ${lc.border} border rounded-xl flex items-center justify-center mb-3`}>
                    <span className={`text-xs font-bold ${lc.text}`} style={{ fontFamily: "var(--font-mono)" }}>
                      {cls.section || cls.name.split(" ").pop()}
                    </span>
                  </div>
                  <p className="font-bold text-[var(--text-primary)] text-sm" style={{ fontFamily: "var(--font-body)" }}>{cls.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cls.subjects.slice(0, 3).map((s) => (
                      <span key={s} className="text-[9px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>
                        {s}
                      </span>
                    ))}
                    {cls.subjects.length > 3 && (
                      <span className="text-[9px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full px-2 py-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                        +{cls.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── TIMETABLE VIEW ───
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="page-header px-5 pt-10 pb-5 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <button onClick={goBack} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {selectedLevel}
          </button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{selectedClassName}</h1>
          <p className="text-[var(--header-text-muted)] text-sm mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>{totalEntryCount}</span> {totalEntryCount === 1 ? "entry" : "entries"} this week
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="px-5 mt-4 max-w-lg mx-auto">
        <div className="card p-3 flex items-center justify-between">
          <button onClick={goToPrevWeek} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">{formatWeekLabel(currentMonday)}</p>
            {!isCurrentWeek && (
              <button onClick={goToCurrentWeek} className="text-[10px] text-[var(--accent-text)] font-semibold mt-0.5">
                Go to current week
              </button>
            )}
            {isCurrentWeek && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Current week</p>
            )}
          </div>
          <button onClick={goToNextWeek} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="px-5 mt-4 max-w-lg mx-auto">
        {loadingTimetable ? (
          <div className="card p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-14 h-14 bg-[var(--skeleton-base)] rounded-lg flex-shrink-0" />
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex-1 h-14 bg-[var(--bg-tertiary)] rounded-lg" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : periods.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] font-medium">No timetable configured</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">Contact your administrator</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="card overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-[56px_repeat(5,1fr)] bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                <div className="p-2 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Period</span>
                </div>
                {DAY_NAMES.map((day, i) => {
                  const dateForDay = new Date(currentMonday);
                  dateForDay.setDate(dateForDay.getDate() + i);
                  const isToday = new Date().toDateString() === dateForDay.toDateString();
                  return (
                    <div key={day} className={`p-2 text-center ${isToday ? "bg-[var(--accent-light)]" : ""}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"}`}>
                        {day}
                      </span>
                      <p className={`text-[9px] ${isToday ? "text-[var(--accent)] font-bold" : "text-[var(--text-tertiary)]"}`}>
                        {dateForDay.getDate()}/{dateForDay.getMonth() + 1}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Period Rows */}
              {periods.map((period) => (
                <div key={period.periodNum} className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-[var(--border-secondary)] last:border-b-0">
                  {/* Period label */}
                  <div className="p-1.5 flex flex-col items-center justify-center border-r border-[var(--border-secondary)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-mono)" }}>P{period.periodNum}</span>
                    <span className="text-[8px] text-[var(--text-tertiary)] leading-tight" style={{ fontFamily: "var(--font-mono)" }}>{period.startTime}</span>
                    <span className="text-[8px] text-[var(--text-tertiary)] leading-tight" style={{ fontFamily: "var(--font-mono)" }}>{period.endTime}</span>
                  </div>

                  {/* Day cells */}
                  {[1, 2, 3, 4, 5].map((dayOfWeek) => {
                    const key = `${dayOfWeek}-${period.periodNum}`;
                    const cell = timetableGrid[key];
                    const hasSlot = cell?.slot;
                    const hasEntry = cell?.entry;

                    const dateForDay = new Date(currentMonday);
                    dateForDay.setDate(dateForDay.getDate() + dayOfWeek - 1);
                    const isToday = new Date().toDateString() === dateForDay.toDateString();

                    if (hasEntry) {
                      return (
                        <button
                          key={dayOfWeek}
                          onClick={() => setSelectedEntry(hasEntry)}
                          className={`p-1 m-0.5 rounded-lg border-l-[4px] text-left transition-all active:scale-95 ${getStatusColor(hasEntry.status)} ${isToday ? "ring-1 ring-[var(--accent)]" : ""}`}
                        >
                          <div className="flex items-center gap-0.5 mb-0.5">
                            <StatusIcon status={hasEntry.status} />
                            <span className="text-[8px] font-bold text-[var(--text-secondary)] truncate" style={{ fontFamily: "var(--font-body)" }}>{hasEntry.subject}</span>
                          </div>
                          <p className="text-[7px] text-[var(--text-tertiary)] line-clamp-2 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
                            {hasEntry.topicText || "No topic"}
                          </p>
                        </button>
                      );
                    }

                    if (hasSlot) {
                      return (
                        <div key={dayOfWeek} className={`p-1 m-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center ${isToday ? "ring-1 ring-[var(--accent-muted)]" : ""}`}>
                          <span className="text-[8px] font-medium text-[var(--text-tertiary)] text-center">{hasSlot.subject}</span>
                          <span className="text-[7px] text-[var(--text-quaternary)] mt-0.5">No entry</span>
                        </div>
                      );
                    }

                    return (
                      <div key={dayOfWeek} className={`m-0.5 rounded-lg ${isToday ? "bg-[var(--accent-light)]/30" : ""}`} />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-[var(--text-tertiary)]">Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                <span className="text-[10px] text-[var(--text-tertiary)]">Submitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-[var(--text-tertiary)]">Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)]" />
                <span className="text-[10px] text-[var(--text-tertiary)]">Empty</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Entry Detail Bottom Sheet */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--text-quaternary)] rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-3 right-4 p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{ background: "var(--bg-secondary)" }}
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>

            {/* Entry header */}
            <div className="px-5 py-3 mt-1" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">{selectedEntry.subject}</p>
                  <p className="text-white/70 text-xs">
                    {selectedClassName} &middot; {new Date(selectedEntry.date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge status={selectedEntry.status as "VERIFIED" | "SUBMITTED" | "FLAGGED" | "DRAFT"}>
                  {selectedEntry.status.charAt(0) + selectedEntry.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Entry details */}
            <div className="p-5 space-y-0 divide-y divide-[var(--border-secondary)]">
              {/* Module & Topic */}
              <div className="pb-4">
                {selectedEntry.moduleName && (
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Module</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{selectedEntry.moduleName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PenTool className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Topic Covered</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{selectedEntry.topicText || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Period & Duration */}
              <div className="py-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="text-center bg-[var(--bg-tertiary)] rounded-xl py-3 px-2">
                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)] mx-auto mb-1" />
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase" style={{ fontFamily: "var(--font-body)" }}>Period</p>
                    <p className="text-xs font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>P{selectedEntry.period || "—"}</p>
                  </div>
                  <div className="text-center bg-[var(--bg-tertiary)] rounded-xl py-3 px-2">
                    <BookOpen className="w-4 h-4 text-[var(--text-tertiary)] mx-auto mb-1" />
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase" style={{ fontFamily: "var(--font-body)" }}>Duration</p>
                    <p className="text-xs font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>{selectedEntry.duration} min</p>
                  </div>
                  <div className="text-center bg-[var(--bg-tertiary)] rounded-xl py-3 px-2">
                    <Clock className="w-4 h-4 text-[var(--text-tertiary)] mx-auto mb-1" />
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase" style={{ fontFamily: "var(--font-body)" }}>Day</p>
                    <p className="text-xs font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>{DAY_NAMES_FULL[selectedEntry.dayOfWeek - 1] || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Attendance & Engagement */}
              {(selectedEntry.studentAttendance || selectedEntry.engagementLevel) && (
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedEntry.studentAttendance !== null && (
                      <div className="text-center bg-[var(--bg-tertiary)] rounded-xl py-3 px-2">
                        <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase" style={{ fontFamily: "var(--font-body)" }}>Attendance</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]"><span style={{ fontFamily: "var(--font-mono)" }}>{selectedEntry.studentAttendance}</span> students</p>
                      </div>
                    )}
                    {selectedEntry.engagementLevel && (
                      <div className="text-center bg-[var(--bg-tertiary)] rounded-xl py-3 px-2">
                        <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase">Engagement</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                          {selectedEntry.engagementLevel.charAt(0) + selectedEntry.engagementLevel.slice(1).toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Objectives */}
              {selectedEntry.objectives && (
                <div className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Objectives</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{Array.isArray(selectedEntry.objectives) ? selectedEntry.objectives.map((o: { text: string }) => o.text).join(", ") : selectedEntry.objectives}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEntry.notes && (
                <div className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Notes</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{selectedEntry.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* View full entry / add reflection */}
            <div className="px-5 pb-4">
              <a
                href={`/logbook/${selectedEntry.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                style={{
                  background: "var(--accent)",
                  color: "white",
                }}
              >
                <FileText className="w-4 h-4" />
                View Full Entry &amp; Remarks
              </a>
            </div>

            {/* Bottom padding for safe area + bottom nav clearance */}
            <div className="h-24" />
          </div>
        </div>
      )}
    </div>
  );
}
