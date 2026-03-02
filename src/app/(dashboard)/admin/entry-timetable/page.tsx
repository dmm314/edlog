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
    case "VERIFIED": return "bg-emerald-500";
    case "FLAGGED": return "bg-red-500";
    case "DRAFT": return "bg-slate-400";
    default: return "bg-blue-500";
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "VERIFIED": return "bg-emerald-50 border-emerald-200 text-emerald-700";
    case "FLAGGED": return "bg-red-50 border-red-200 text-red-700";
    case "DRAFT": return "bg-slate-50 border-slate-200 text-slate-600";
    default: return "bg-blue-50 border-blue-200 text-blue-700";
  }
}

function getSubjectColor(index: number): string {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  return colors[index % colors.length];
}

function getSubjectBgLight(index: number): string {
  const colors = [
    "bg-blue-50 border-blue-200",
    "bg-emerald-50 border-emerald-200",
    "bg-violet-50 border-violet-200",
    "bg-amber-50 border-amber-200",
    "bg-rose-50 border-rose-200",
    "bg-cyan-50 border-cyan-200",
  ];
  return colors[index % colors.length];
}

function getSubjectText(index: number): string {
  const colors = [
    "text-blue-700",
    "text-emerald-700",
    "text-violet-700",
    "text-amber-700",
    "text-rose-700",
    "text-cyan-700",
  ];
  return colors[index % colors.length];
}

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

  // ─── CLASS LIST VIEW ───
  if (!selectedClassId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
          <div className="max-w-lg mx-auto relative">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />Entry Timetable
            </h1>
            <p className="text-brand-400/70 text-sm mt-0.5">View teacher entries by class and week</p>
          </div>
        </div>

        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">No classes set up yet</p>
              <Link href="/admin/classes" className="text-sm text-brand-600 font-semibold mt-2 inline-block">Add classes first</Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Select a Class</p>
              {classes.map((cls, i) => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); saveAdminETState(cls.id); }}
                  className="card p-4 w-full text-left flex items-center gap-3.5 hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.98]"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSubjectColor(i)} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <span className="text-sm font-bold text-white">{cls.name.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{cls.slotCount} slots
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{cls.teacherCount} teachers
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <button onClick={() => { setSelectedClassId(null); setSelectedEntry(null); setSelectedSlot(null); saveAdminETState(null); }}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />All Classes
          </button>
          <h1 className="text-xl font-bold text-white">{className}</h1>
          <p className="text-brand-400/70 text-sm mt-0.5">Entry timetable</p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Week Navigation */}
        <div className="card p-3 flex items-center justify-between">
          <button onClick={() => navigateWeek(-1)} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-95">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center flex-1">
            <p className="text-sm font-bold text-slate-900">{formatWeekRange(weekStart)}</p>
            {!isCurrentWeek && (
              <button onClick={goToCurrentWeek} className="text-[11px] text-brand-600 font-semibold mt-0.5 hover:underline">
                Go to current week
              </button>
            )}
            {isCurrentWeek && (
              <p className="text-[11px] text-brand-600 font-semibold mt-0.5">Current Week</p>
            )}
          </div>
          <button onClick={() => navigateWeek(1)} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-95">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{weekStats.totalSlots}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Scheduled</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-brand-600">{weekStats.filledCount}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Filled</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{weekStats.verifiedCount}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verified</p>
          </div>
        </div>

        {/* Timetable Grid */}
        {loadingGrid ? (
          <div className="card p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading timetable...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="card p-6 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No period schedule set up</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-1.5 py-2.5 text-left text-slate-400 font-semibold w-[52px] sticky left-0 bg-slate-50/80 z-10">
                      Period
                    </th>
                    {DAYS.map((day) => {
                      const dateForDay = new Date(weekStart);
                      dateForDay.setDate(dateForDay.getDate() + day.value - 1);
                      const isToday = formatDateISO(dateForDay) === formatDateISO(new Date());
                      return (
                        <th key={day.value} className={`px-1 py-2.5 text-center font-semibold min-w-[54px] ${isToday ? "text-brand-700" : "text-slate-400"}`}>
                          <span className="block">{day.short}</span>
                          <span className={`block text-[9px] mt-0.5 ${isToday ? "text-brand-500 font-bold" : "text-slate-300"}`}>
                            {dateForDay.getDate()}/{dateForDay.getMonth() + 1}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.periodNum} className="border-b border-slate-50 last:border-0">
                      <td className="px-1.5 py-1 align-top sticky left-0 bg-white z-10">
                        <div className="font-semibold text-slate-700 text-[11px]">P{period.periodNum}</div>
                        <div className="text-[9px] text-slate-400 whitespace-nowrap">{period.startTime}</div>
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
                              <div className={`h-[42px] rounded-lg border border-dashed ${isToday ? "border-brand-200 bg-brand-50/30" : "border-slate-100"}`} />
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
                                    : `border-slate-200 bg-slate-50/50 ${isToday ? "border-brand-200" : ""}`
                                }`}
                              >
                                <p className={`font-bold truncate leading-tight ${entry ? getSubjectText(colorIdx) : "text-slate-400"}`}>
                                  {slot.subject.length > 6 ? slot.subject.slice(0, 6) + "…" : slot.subject}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate mt-0.5">
                                  {slot.teacher.firstName.charAt(0)}.{slot.teacher.lastName.charAt(0)}
                                </p>
                                {/* Status indicator */}
                                {entry && (
                                  <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${getStatusColor(entry.status)}`} />
                                )}
                                {!entry && (
                                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-slate-200" />
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
                              <p className="text-[9px] text-slate-400 truncate mt-0.5">
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
            <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span>Empty</span>
              </div>
            </div>
          </div>
        )}

        {/* Entry Detail Modal */}
        {(selectedEntry || selectedSlot) && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedEntry(null); setSelectedSlot(null); }}>
            <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedEntry ? "Entry Details" : "Slot Details"}
                </h3>
                <button onClick={() => { setSelectedEntry(null); setSelectedSlot(null); }}
                  className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
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
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center ring-2 ring-white shadow-sm">
                          <span className="text-sm font-bold text-white">{teacher.firstName[0]}{teacher.lastName[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-xs text-slate-400">
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
                      <span className="text-xs text-slate-400">{selectedEntry.date}</span>
                    </div>

                    {/* Topic */}
                    {selectedEntry.topicText && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Topic</p>
                          <p className="text-sm text-slate-700 font-medium">{selectedEntry.topicText}</p>
                        </div>
                      </div>
                    )}

                    {/* Module */}
                    {selectedEntry.moduleName && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Module</p>
                          <p className="text-sm text-slate-700 font-medium">{selectedEntry.moduleName}</p>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration</p>
                        <p className="text-sm text-slate-700 font-medium">{selectedEntry.duration} min</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedEntry.notes && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedEntry.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Objectives */}
                    {selectedEntry.objectives && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Objectives</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedEntry.objectives}</p>
                        </div>
                      </div>
                    )}

                    {/* Attendance & Engagement */}
                    {(selectedEntry.studentAttendance !== null || selectedEntry.engagementLevel) && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedEntry.studentAttendance !== null && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attendance</p>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedEntry.studentAttendance} students</p>
                          </div>
                        )}
                        {selectedEntry.engagementLevel && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Engagement</p>
                            <p className={`text-sm font-bold mt-0.5 ${
                              selectedEntry.engagementLevel === "HIGH" ? "text-emerald-600" :
                              selectedEntry.engagementLevel === "MEDIUM" ? "text-amber-600" : "text-red-500"
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
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-semibold">No entry submitted</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedSlot.teacher.firstName} {selectedSlot.teacher.lastName} has not filled in this period yet
                    </p>
                    <p className="text-xs text-slate-300 mt-2">{selectedSlot.periodLabel} &middot; {selectedSlot.startTime} - {selectedSlot.endTime}</p>
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
