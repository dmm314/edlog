"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronRight, Clock, Users } from "lucide-react";

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
];

interface SlotInfo {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  teacher: string;
  teacherId: string;
  teacherEmail: string;
  teacherPhone: string | null;
  className: string;
  classId: string;
  level: string;
  subject: string;
  subjectId: string;
}

interface ClassInfo {
  id: string;
  name: string;
  level: string;
}

interface CoordinatorInfo {
  levels: string[];
  title: string;
}

// Returns "HH:MM" from a slot's startTime string (which may be "HH:MM" or an ISO datetime)
function parseTime(t: string): { h: number; m: number } {
  const parts = t.includes("T") ? t.split("T")[1].split(":") : t.split(":");
  return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
}

function formatTime(t: string): string {
  const { h, m } = parseTime(t);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function isCurrentlyActive(slot: SlotInfo): boolean {
  const now = new Date();
  const todayDow = now.getDay(); // 0=Sun, 1=Mon...
  if (slot.dayOfWeek !== todayDow) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(slot.startTime);
  const end = parseTime(slot.endTime);
  const startMins = start.h * 60 + start.m;
  const endMins = end.h * 60 + end.m;
  return nowMins >= startMins && nowMins < endMins;
}

// Colour palette for classes (cycles by index)
const CLASS_COLORS = [
  { bg: "#EDE9FE", border: "#C4B5FD", text: "#3B0764", badge: "#6D28D9" },
  { bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A5F", badge: "#2563EB" },
  { bg: "#D1FAE5", border: "#6EE7B7", text: "#064E3B", badge: "#059669" },
  { bg: "#FEF3C7", border: "#FCD34D", text: "#78350F", badge: "#D97706" },
  { bg: "#FFE4E6", border: "#FCA5A5", text: "#7F1D1D", badge: "#E11D48" },
  { bg: "#F0FDF4", border: "#86EFAC", text: "#14532D", badge: "#16A34A" },
];

export default function CoordinatorTimetablePage() {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Two-step navigation: null = class picker, string = selected classId
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(
    Math.min(Math.max(new Date().getDay(), 1), 5)
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [ttRes, checkRes] = await Promise.all([
          fetch("/api/coordinator/timetable"),
          fetch("/api/coordinator/check"),
        ]);

        if (ttRes.ok) {
          const data = await ttRes.json();
          setSlots(data.slots || []);
          setClasses(data.classes || []);
        } else {
          const err = await ttRes.json().catch(() => ({}));
          setError(err.error || "Failed to load timetable");
        }

        if (checkRes.ok) {
          const d = await checkRes.json();
          setCoordinator({ levels: d.levels || [], title: d.title || "Level Coordinator" });
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Slots for the selected class, organised by day
  const selectedClassSlots = useMemo(() => {
    if (!selectedClassId) return [];
    return slots.filter((s) => s.classId === selectedClassId);
  }, [slots, selectedClassId]);

  const slotsByDay = useMemo(() => {
    const map: Record<number, SlotInfo[]> = {};
    for (const day of DAYS) {
      map[day.value] = selectedClassSlots
        .filter((s) => s.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [selectedClassSlots]);

  // Class stats helpers
  const classSlotCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of slots) {
      map[s.classId] = (map[s.classId] || 0) + 1;
    }
    return map;
  }, [slots]);

  // Unique teacher count per class
  const classTeacherCount = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const s of slots) {
      if (!map[s.classId]) map[s.classId] = new Set();
      map[s.classId].add(s.teacherId);
    }
    const result: Record<string, number> = {};
    for (const [id, set] of Object.entries(map)) result[id] = set.size;
    return result;
  }, [slots]);

  // Group classes by level
  const classesByLevel = useMemo(() => {
    const map = new Map<string, ClassInfo[]>();
    for (const c of classes) {
      if (!map.has(c.level)) map.set(c.level, []);
      map.get(c.level)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [classes]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const levelSummary = coordinator?.levels.join(", ") || "";
  const classColorIdx = classes.findIndex((c) => c.id === selectedClassId);
  const classColor = CLASS_COLORS[classColorIdx % CLASS_COLORS.length] ?? CLASS_COLORS[0];

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="px-5 pt-10 pb-6 rounded-b-[2rem]"
          style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}>
          <div className="max-w-lg mx-auto">
            <div className="skeleton h-4 w-24 !bg-white/10 mb-4" />
            <div className="skeleton h-7 w-32 !bg-white/15" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--skeleton-base)]" />
              <div className="flex-1">
                <div className="skeleton h-4 w-28 mb-2" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── CLASS PICKER view ───
  if (selectedClassId === null) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Header */}
        <div className="px-5 pt-10 pb-6 rounded-b-[2rem] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="max-w-lg mx-auto relative">
            <Link href="/coordinator"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Coordinator
            </Link>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-violet-300" />
              <h1 className="text-xl font-bold text-white">Timetable</h1>
            </div>
            <p className="text-white/60 text-sm">
              {levelSummary ? `${levelSummary} — select a class` : "Select a class to view its schedule"}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10">
                <Users className="w-3.5 h-3.5 text-violet-200" />
                <span className="text-xs font-semibold text-white/80">{classes.length} classes</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10">
                <Clock className="w-3.5 h-3.5 text-violet-200" />
                <span className="text-xs font-semibold text-white/80">{slots.length} slots total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 mt-4 max-w-lg mx-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {classes.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
              <p className="font-bold text-[var(--text-primary)]">No classes found</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                No classes have been set up for {levelSummary || "your levels"} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {classesByLevel.map(([level, levelClasses], levelIdx) => (
                <div key={level}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1"
                    style={{ color: "var(--text-tertiary)" }}>
                    {level}
                  </p>
                  <div className="space-y-2">
                    {levelClasses.sort((a, b) => a.name.localeCompare(b.name)).map((cls, clsIdx) => {
                      const globalIdx = classes.findIndex((c) => c.id === cls.id);
                      const color = CLASS_COLORS[(levelIdx * 2 + clsIdx) % CLASS_COLORS.length];
                      const slotCount = classSlotCount[cls.id] || 0;
                      const teacherCount = classTeacherCount[cls.id] || 0;
                      // Check if any slot is active right now
                      const hasLiveSlot = slots.some(
                        (s) => s.classId === cls.id && isCurrentlyActive(s)
                      );

                      return (
                        <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
                          className="w-full text-left flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.97] hover:shadow-sm"
                          style={{ background: color.bg, borderColor: color.border }}>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                              style={{ background: color.badge, color: "white" }}>
                              {cls.name.replace(/\s+/g, "").slice(-2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold" style={{ color: color.text }}>{cls.name}</p>
                                {hasLiveSlot && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: "#DCFCE7", color: "#15803D" }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                    LIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: color.text, opacity: 0.65 }}>
                                {slotCount} period{slotCount !== 1 ? "s" : ""} · {teacherCount} teacher{teacherCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: color.badge }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CLASS DETAIL view ───
  const currentDaySlots = slotsByDay[selectedDay] || [];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-6 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <button onClick={() => setSelectedClassId(null)}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Classes
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {selectedClass?.name.replace(/\s+/g, "").slice(-2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{selectedClass?.name}</h1>
              <p className="text-white/55 text-sm mt-0.5">{selectedClass?.level}</p>
            </div>
          </div>

          {/* Day tabs */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            {DAYS.map((day) => {
              const count = slotsByDay[day.value]?.length ?? 0;
              const isActive = selectedDay === day.value;
              const isToday = day.value === Math.min(Math.max(new Date().getDay(), 1), 5) && new Date().getDay() >= 1 && new Date().getDay() <= 5;
              return (
                <button key={day.value} onClick={() => setSelectedDay(day.value)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: isActive ? "white" : "rgba(255,255,255,0.12)",
                    color: isActive ? "#4C1D95" : "rgba(255,255,255,0.7)",
                  }}>
                  <span>{day.short}</span>
                  {isToday && !isActive && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-violet-300 inline-block" />
                  )}
                  {count > 0 && (
                    <span className="ml-1.5 text-[9px]"
                      style={{ color: isActive ? "#6D28D9" : "rgba(255,255,255,0.45)" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {currentDaySlots.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
            <p className="font-bold text-[var(--text-primary)]">
              No periods on {DAYS.find((d) => d.value === selectedDay)?.label}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {selectedClass?.name} has no timetable slots on this day.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentDaySlots.map((slot) => {
              const active = isCurrentlyActive(slot);
              return (
                <div key={slot.id}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={{
                    background: active ? "#F0FDF4" : "var(--bg-elevated)",
                    borderColor: active ? "#86EFAC" : "var(--border-primary)",
                    boxShadow: active ? "0 0 0 2px rgba(134,239,172,0.4)" : undefined,
                  }}>
                  <div className="px-4 py-3.5 flex items-start gap-3">
                    {/* Time column */}
                    <div className="w-16 flex-shrink-0 pt-0.5">
                      <p className="text-xs font-bold tabular-nums" style={{ color: active ? "#15803D" : "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {formatTime(slot.startTime)}
                      </p>
                      <p className="text-[10px] tabular-nums mt-0.5" style={{ color: "var(--text-quaternary)", fontFamily: "var(--font-mono)" }}>
                        {formatTime(slot.endTime)}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: active ? "#14532D" : "var(--text-primary)" }}>
                          {slot.subject}
                        </p>
                        {active && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: active ? "#166534" : "var(--text-secondary)" }}>
                        {slot.periodLabel}
                      </p>

                      {/* Teacher info */}
                      <div className="mt-2.5 pt-2.5 flex items-center justify-between gap-2"
                        style={{ borderTop: `1px solid ${active ? "#BBF7D0" : "var(--border-secondary)"}` }}>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: active ? "#15803D" : "var(--text-primary)" }}>
                            {slot.teacher}
                          </p>
                          {slot.teacherEmail && (
                            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              {slot.teacherEmail}
                            </p>
                          )}
                        </div>
                        {slot.teacherPhone && (
                          <a href={`tel:${slot.teacherPhone}`}
                            className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: active ? "#DCFCE7" : "var(--bg-secondary)", color: active ? "#15803D" : "var(--accent-text)" }}>
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-[var(--text-quaternary)] text-center mt-6">
          View only — contact the school admin to modify timetable slots
        </p>
      </div>
    </div>
  );
}
