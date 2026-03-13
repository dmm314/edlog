"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

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
  className: string;
  classId: string;
  level: string;
  subject: string;
  subjectId: string;
}

interface CoordinatorInfo {
  levels: string[];
  title: string;
}

export default function CoordinatorTimetablePage() {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(
    // Default to current weekday (1–5), fallback to Monday
    Math.min(Math.max(new Date().getDay(), 1), 5)
  );

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch timetable + coordinator info in parallel; dashboard is optional
        const [ttRes, checkRes] = await Promise.all([
          fetch("/api/coordinator/timetable"),
          fetch("/api/coordinator/check"),
        ]);

        if (ttRes.ok) {
          const data = await ttRes.json();
          setSlots(data.slots || []);
        } else {
          const err = await ttRes.json().catch(() => ({}));
          setError(err.error || "Failed to load timetable");
        }

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCoordinator({
            levels: checkData.levels || [],
            title: checkData.title || "Level Coordinator",
          });
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const slotsByDay = useMemo(() => {
    const map: Record<number, SlotInfo[]> = {};
    for (const day of DAYS) {
      map[day.value] = slots
        .filter((s) => s.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [slots]);

  const selectedSlots = useMemo(
    () => slotsByDay[selectedDay] || [],
    [slotsByDay, selectedDay]
  );

  // Group by class for selected day
  const slotsByClass = useMemo(() => {
    const map = new Map<string, { className: string; level: string; slots: SlotInfo[] }>();
    for (const slot of selectedSlots) {
      if (!map.has(slot.classId)) {
        map.set(slot.classId, {
          className: slot.className,
          level: slot.level,
          slots: [],
        });
      }
      map.get(slot.classId)!.slots.push(slot);
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [selectedSlots]);

  const levelSummary = coordinator?.levels.join(", ") || "";

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Coordinator
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-violet-300" />
            <h1 className="text-xl font-bold text-white">Timetable</h1>
          </div>
          <p className="text-white/60 text-sm">
            {levelSummary ? `${levelSummary} — view only` : "Your levels — view only"}
          </p>

          {/* Day tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {DAYS.map((day) => {
              const count = slotsByDay[day.value]?.length ?? 0;
              const isActive = selectedDay === day.value;
              return (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: isActive ? "white" : "rgba(255,255,255,0.12)",
                    color: isActive ? "#4C1D95" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {day.short}
                  {count > 0 && (
                    <span
                      className="ml-1 text-[9px] font-bold"
                      style={{ color: isActive ? "#6D28D9" : "rgba(255,255,255,0.5)" }}
                    >
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
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="skeleton h-4 w-20 mb-3" />
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex gap-2">
                      <div className="skeleton h-3 w-12" />
                      <div className="skeleton h-3 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : selectedSlots.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
            <p className="font-bold text-[var(--text-primary)]">
              No classes on {DAYS.find((d) => d.value === selectedDay)?.label}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              No timetable slots found for your levels on this day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {slotsByClass.map(({ className, level, slots: classSlots }) => (
              <div key={className} className="card overflow-hidden">
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", borderBottom: "1px solid #C4B5FD" }}
                >
                  <span className="text-sm font-bold" style={{ color: "#3B0764" }}>{className}</span>
                  <span className="text-[10px] text-[#5B21B6] font-medium">{level}</span>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  {classSlots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <div key={slot.id} className="px-4 py-3 flex items-start gap-3">
                        <div className="w-14 flex-shrink-0">
                          <p className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
                            {slot.startTime}
                          </p>
                          <p className="text-[10px] text-[var(--text-quaternary)]">
                            {slot.endTime}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{slot.subject}</p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{slot.teacher}</p>
                          <p className="text-[10px] text-[var(--text-quaternary)] mt-0.5">{slot.periodLabel}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-quaternary)] text-center mt-6">
          View only — contact the school admin to modify timetable slots
        </p>
      </div>
    </div>
  );
}
