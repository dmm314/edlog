"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  GraduationCap,
  X,
} from "lucide-react";
import Link from "next/link";

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
];

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignmentId: string;
  teacher: string;
  className: string;
  classId: string;
  subject: string;
}

interface AssignmentOption {
  id: string;
  teacher: string;
  className: string;
  classId: string;
  subject: string;
}

interface PeriodSchedule {
  id: string;
  periodNum: number;
  label: string;
  startTime: string;
  endTime: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
  slotCount: number;
  teacherCount: number;
}

export default function TimetableManagementPage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [periods, setPeriods] = useState<PeriodSchedule[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Selected class view
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    assignmentId: "",
    dayOfWeek: "1",
    selectedPeriods: [] as number[],
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  async function fetchTimetable() {
    try {
      const res = await fetch("/api/admin/timetable");
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots);
        setAssignments(data.assignments);
        setPeriods(data.periods);
        setClasses(data.classes);
      } else {
        setError(data.error || "Failed to load timetable");
      }
    } catch (e) {
      console.error("Timetable fetch error:", e);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  function togglePeriod(periodNum: number) {
    setForm((prev) => {
      const already = prev.selectedPeriods.includes(periodNum);
      if (already) {
        return { ...prev, selectedPeriods: prev.selectedPeriods.filter((p) => p !== periodNum) };
      }
      if (prev.selectedPeriods.length >= 2) return prev; // max 2
      return { ...prev, selectedPeriods: [...prev.selectedPeriods, periodNum].sort((a, b) => a - b) };
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.assignmentId || form.selectedPeriods.length === 0) return;

    setSaving(true);
    setError("");
    try {
      const newSlots: TimetableSlot[] = [];
      let hadError = false;
      for (const periodNum of form.selectedPeriods) {
        const period = periods.find((p) => p.periodNum === periodNum);
        if (!period) continue;

        const res = await fetch("/api/admin/timetable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: form.assignmentId,
            dayOfWeek: form.dayOfWeek,
            periodNum,
            startTime: period.startTime,
            endTime: period.endTime,
            periodLabel: period.label,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          newSlots.push(data);
        } else {
          setError(data.error || `Failed to add slot for ${period.label}`);
          hadError = true;
        }
      }
      if (newSlots.length > 0) {
        setSlots((prev) => [...prev, ...newSlots]);
        setForm({
          assignmentId: "",
          dayOfWeek: form.dayOfWeek,
          selectedPeriods: [],
        });
        if (!hadError) setShowForm(false);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slotId: string) {
    setDeleting(slotId);
    try {
      const res = await fetch(`/api/admin/timetable?id=${slotId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete slot");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeleting(null);
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Filter slots and assignments for the selected class
  const classSlots = useMemo(
    () => slots.filter((s) => s.classId === selectedClassId),
    [slots, selectedClassId]
  );

  const classAssignments = useMemo(
    () => assignments.filter((a) => a.classId === selectedClassId),
    [assignments, selectedClassId]
  );

  // Build timetable grid: period → day → slot
  const timetableGrid = useMemo(() => {
    const grid: Record<number, Record<number, TimetableSlot | null>> = {};
    for (const period of periods) {
      grid[period.periodNum] = {};
      for (const day of DAYS) {
        grid[period.periodNum][day.value] = null;
      }
    }
    for (const slot of classSlots) {
      const periodNum = periods.find(
        (p) => p.label === slot.periodLabel
      )?.periodNum;
      if (periodNum && grid[periodNum]) {
        grid[periodNum][slot.dayOfWeek] = slot;
      }
    }
    return grid;
  }, [classSlots, periods]);

  // Update class counts when slots change
  const classesWithCounts = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      slotCount: slots.filter((s) => s.classId === c.id).length,
    }));
  }, [classes, slots]);

  // ─── CLASS LIST VIEW ──────────────────────────────────
  if (!selectedClassId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">Manage Timetable</h1>
            <p className="text-brand-400 text-sm mt-0.5">
              Select a class to view or edit its timetable
            </p>
          </div>
        </div>

        <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-500 font-bold text-xs mt-0.5 flex-shrink-0 hover:underline">Dismiss</button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : classesWithCounts.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No classes set up yet</p>
              <Link
                href="/admin/classes"
                className="text-sm text-brand-600 font-medium mt-2 inline-block"
              >
                Add classes first
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {classesWithCounts.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className="card p-4 w-full text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {cls.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cls.slotCount} timetable{" "}
                        {cls.slotCount === 1 ? "slot" : "slots"}
                      </span>
                      <span>
                        {cls.teacherCount} teacher
                        {cls.teacherCount !== 1 ? "s" : ""} assigned
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {!loading && classes.length > 0 && (
            <p className="text-center text-xs text-slate-400">
              {slots.length} total slot{slots.length !== 1 ? "s" : ""} across
              all classes
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── CLASS TIMETABLE VIEW ─────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => {
              setSelectedClassId(null);
              setShowForm(false);
            }}
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            All Classes
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {selectedClass?.name}
              </h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {classSlots.length} slot{classSlots.length !== 1 ? "s" : ""}{" "}
                scheduled
              </p>
            </div>
            {classAssignments.length > 0 && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
              >
                {showForm ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* No assignments warning */}
        {classAssignments.length === 0 && (
          <div className="card p-4 border-l-4 border-amber-400">
            <p className="text-sm font-medium text-slate-900">
              No teachers assigned to this class
            </p>
            <p className="text-xs text-slate-500 mt-1">
              You need to assign teachers to this class before adding timetable
              slots.
            </p>
            <Link
              href="/admin/assignments"
              className="text-sm text-brand-600 font-medium mt-2 inline-block"
            >
              Assign teachers
            </Link>
          </div>
        )}

        {/* Add Slot Form */}
        {showForm && classAssignments.length > 0 && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Timetable Slot for {selectedClass?.name}
            </h3>

            <div>
              <label className="label-field">Teacher / Subject</label>
              <select
                value={form.assignmentId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    assignmentId: e.target.value,
                  }))
                }
                className="input-field"
              >
                <option value="">Select teacher &amp; subject</option>
                {classAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.teacher} — {a.subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Day</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dayOfWeek: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">
                  Period{" "}
                  <span className="text-slate-400 font-normal">(select up to 2)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {periods.map((p) => {
                    const selected = form.selectedPeriods.includes(p.periodNum);
                    const disabled = !selected && form.selectedPeriods.length >= 2;
                    return (
                      <button
                        key={p.periodNum}
                        type="button"
                        onClick={() => togglePeriod(p.periodNum)}
                        disabled={disabled}
                        className={`text-left px-2.5 py-2 rounded-lg border-2 text-xs transition-all ${
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : disabled
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-semibold">{p.label}</span>
                        <span className="block text-[10px] mt-0.5 opacity-70">
                          {p.startTime} - {p.endTime}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !form.assignmentId || form.selectedPeriods.length === 0}
              className="btn-primary text-sm"
            >
              {saving ? "Adding..." : "Add Slot"}
            </button>
          </form>
        )}

        {/* Timetable Grid */}
        {periods.length > 0 && classSlots.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-2 py-2.5 text-left text-slate-400 font-medium w-16">
                      Period
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day.value}
                        className="px-1.5 py-2.5 text-center text-slate-400 font-medium"
                      >
                        {day.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr
                      key={period.periodNum}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-2 py-2 align-top">
                        <div className="font-medium text-slate-700">
                          P{period.periodNum}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {period.startTime}
                        </div>
                      </td>
                      {DAYS.map((day) => {
                        const slot =
                          timetableGrid[period.periodNum]?.[day.value];
                        return (
                          <td
                            key={day.value}
                            className="px-1 py-1.5 align-top"
                          >
                            {slot ? (
                              <div className="bg-brand-50 border border-brand-100 rounded-lg p-1.5 relative group">
                                <p className="font-medium text-brand-800 text-[10px] leading-tight truncate">
                                  {slot.subject}
                                </p>
                                <p className="text-[9px] text-brand-500 truncate mt-0.5">
                                  {slot.teacher.split(" ")[0]}
                                </p>
                                <button
                                  onClick={() => handleDelete(slot.id)}
                                  disabled={deleting === slot.id}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-8 rounded-lg border border-dashed border-slate-200" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : classSlots.length === 0 && classAssignments.length > 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No timetable slots yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Tap &quot;Add Slot&quot; to fill in the timetable
            </p>
          </div>
        ) : null}

        {/* Slot list (detailed view) */}
        {classSlots.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              All Slots ({classSlots.length})
            </h3>
            <div className="space-y-2">
              {classSlots
                .sort(
                  (a, b) =>
                    a.dayOfWeek - b.dayOfWeek ||
                    a.startTime.localeCompare(b.startTime)
                )
                .map((slot) => (
                  <div key={slot.id} className="card p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                            {slot.periodLabel}
                          </span>
                          <span className="text-xs text-slate-400">
                            {
                              DAYS.find((d) => d.value === slot.dayOfWeek)
                                ?.label
                            }
                          </span>
                          <span className="text-xs text-slate-400">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {slot.subject}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {slot.teacher}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={deleting === slot.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
