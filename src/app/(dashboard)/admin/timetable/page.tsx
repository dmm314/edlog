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
  jointWith?: string[];
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

  // Double-booking confirmation
  const [doubleBookWarning, setDoubleBookWarning] = useState<{
    message: string;
    pendingPeriods: number[];
    processedSlots: TimetableSlot[];
    currentPeriodIndex: number;
  } | null>(null);

  async function createSlotForPeriod(
    periodNum: number,
    forceDoubleBook = false
  ): Promise<{ slot?: TimetableSlot; warning?: string; error?: string }> {
    const period = periods.find((p) => p.periodNum === periodNum);
    if (!period) return { error: "Period not found" };

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
        forceDoubleBook,
      }),
    });

    const data = await res.json();
    if (res.ok) return { slot: data };
    if (data.warning) return { warning: data.error };
    return { error: data.error };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.assignmentId || form.selectedPeriods.length === 0) return;

    setSaving(true);
    setError("");
    setDoubleBookWarning(null);

    try {
      const newSlots: TimetableSlot[] = [];
      for (let i = 0; i < form.selectedPeriods.length; i++) {
        const periodNum = form.selectedPeriods[i];
        const result = await createSlotForPeriod(periodNum);

        if (result.slot) {
          newSlots.push(result.slot);
        } else if (result.warning) {
          // Pause and ask for confirmation
          setDoubleBookWarning({
            message: result.warning,
            pendingPeriods: form.selectedPeriods.slice(i),
            processedSlots: newSlots,
            currentPeriodIndex: i,
          });
          setSaving(false);
          return;
        } else {
          setError(result.error || "Failed to add slot");
          break;
        }
      }

      if (newSlots.length > 0) {
        setSlots((prev) => [...prev, ...newSlots]);
        setForm({ assignmentId: "", dayOfWeek: form.dayOfWeek, selectedPeriods: [] });
        setShowForm(false);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDoubleBookConfirm() {
    if (!doubleBookWarning) return;
    setSaving(true);
    setError("");

    try {
      const allNewSlots = [...doubleBookWarning.processedSlots];
      const remaining = doubleBookWarning.pendingPeriods;

      for (let i = 0; i < remaining.length; i++) {
        const isFirst = i === 0; // first one needs force
        const result = await createSlotForPeriod(remaining[i], isFirst);

        if (result.slot) {
          allNewSlots.push(result.slot);
        } else if (result.warning && !isFirst) {
          setDoubleBookWarning({
            message: result.warning,
            pendingPeriods: remaining.slice(i),
            processedSlots: allNewSlots,
            currentPeriodIndex: i,
          });
          setSaving(false);
          return;
        } else if (result.error) {
          setError(result.error);
          break;
        }
      }

      if (allNewSlots.length > 0) {
        setSlots((prev) => [...prev, ...allNewSlots]);
        setForm({ assignmentId: "", dayOfWeek: form.dayOfWeek, selectedPeriods: [] });
        setShowForm(false);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDoubleBookWarning(null);
      setSaving(false);
    }
  }

  function handleDoubleBookCancel() {
    // Keep any already-created slots
    if (doubleBookWarning && doubleBookWarning.processedSlots.length > 0) {
      setSlots((prev) => [...prev, ...doubleBookWarning.processedSlots]);
    }
    setDoubleBookWarning(null);
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
      <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">Manage Timetable</h1>
            <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
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
                  <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : classesWithCounts.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
              <p className="text-[var(--text-tertiary)]">No classes set up yet</p>
              <Link
                href="/admin/classes"
                className="text-sm text-[var(--accent-text)] font-medium mt-2 inline-block"
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
                  className="card p-4 w-full text-left flex items-center justify-between hover:bg-[hsl(var(--surface-tertiary))] transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                      {cls.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
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
                  <ChevronRight className="w-5 h-5 text-[var(--text-quaternary)]" />
                </button>
              ))}
            </div>
          )}

          {!loading && classes.length > 0 && (
            <p className="text-center text-xs text-[var(--text-tertiary)]">
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
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
              <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
                {classSlots.length} slot{classSlots.length !== 1 ? "s" : ""}{" "}
                scheduled
              </p>
            </div>
            {classAssignments.length > 0 && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 bg-[hsl(var(--surface-elevated))]/10 hover:bg-[hsl(var(--surface-elevated))]/20 text-white text-sm rounded-lg px-3 py-1.5"
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
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <X className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">Scheduling Conflict</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600 flex-shrink-0 mt-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Double-booking confirmation dialog */}
        {doubleBookWarning && (
          <div className="bg-[hsl(var(--accent-soft))] border-2 border-[hsl(var(--accent)/0.3)] rounded-xl px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--accent-soft))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-[hsl(var(--accent-strong))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[hsl(var(--accent-text))]">Joint Class Detected</p>
                <p className="text-sm text-[hsl(var(--accent-text))] mt-1">{doubleBookWarning.message}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDoubleBookCancel}
                className="btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDoubleBookConfirm}
                disabled={saving}
                className="flex-1 bg-[hsl(var(--accent-strong))] hover:bg-[hsl(var(--accent-strong))] text-white font-semibold text-sm rounded-xl py-2.5 px-4 transition-colors"
              >
                {saving ? "Adding..." : "Yes, Allow Double-Book"}
              </button>
            </div>
          </div>
        )}

        {/* No assignments warning */}
        {classAssignments.length === 0 && (
          <div className="card p-4 border-l-4 border-[hsl(var(--accent-glow))]">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No teachers assigned to this class
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              You need to assign teachers to this class before adding timetable
              slots.
            </p>
            <Link
              href="/admin/assignments"
              className="text-sm text-[var(--accent-text)] font-medium mt-2 inline-block"
            >
              Assign teachers
            </Link>
          </div>
        )}

        {/* Add Slot Form */}
        {showForm && classAssignments.length > 0 && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
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
                  <span className="text-[var(--text-tertiary)] font-normal">(select up to 2)</span>
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
                            ? "border-[var(--accent)] text-[var(--text-primary)]"
                            : disabled
                            ? "border-[var(--border-secondary)] bg-[hsl(var(--surface-tertiary))] text-[var(--text-quaternary)] cursor-not-allowed"
                            : "border-[var(--border-primary)] bg-[hsl(var(--surface-elevated))] text-[var(--text-secondary)] hover:border-[var(--border-primary)]"
                        }`}
                        style={selected ? { background: "var(--accent-soft)" } : undefined}
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
                  <tr className="bg-[hsl(var(--surface-tertiary))] border-b border-[var(--border-secondary)]">
                    <th className="px-2 py-2.5 text-left text-[var(--text-tertiary)] font-medium w-16">
                      Period
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day.value}
                        className="px-1.5 py-2.5 text-center text-[var(--text-tertiary)] font-medium"
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
                      className="border-b border-[var(--border-secondary)] last:border-0"
                    >
                      <td className="px-2 py-2 align-top">
                        <div className="font-medium text-[var(--text-secondary)]">
                          P{period.periodNum}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
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
                              <div className={`${slot.jointWith && slot.jointWith.length > 0 ? "bg-[hsl(var(--accent-soft))] border-[hsl(var(--accent)/0.2)]" : "border-[var(--accent-muted)]"} border rounded-lg p-1.5 relative group`} style={!(slot.jointWith && slot.jointWith.length > 0) ? { background: "var(--accent-soft)" } : undefined}>
                                <p className={`font-medium text-[10px] leading-tight truncate ${slot.jointWith && slot.jointWith.length > 0 ? "text-[hsl(var(--accent-text))]" : "text-[var(--text-primary)]"}`}>
                                  {slot.subject}
                                </p>
                                <p className={`text-[9px] truncate mt-0.5 ${slot.jointWith && slot.jointWith.length > 0 ? "text-[hsl(var(--accent))]" : "text-[var(--accent-text)]"}`}>
                                  {slot.teacher.split(" ")[0]}
                                </p>
                                {slot.jointWith && slot.jointWith.length > 0 && (
                                  <p className="text-[8px] text-[hsl(var(--accent-strong))] font-semibold truncate mt-0.5">
                                    + {slot.jointWith.join(", ")}
                                  </p>
                                )}
                                <button
                                  onClick={() => handleDelete(slot.id)}
                                  disabled={deleting === slot.id}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-8 rounded-lg border border-dashed border-[var(--border-primary)]" />
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
            <Calendar className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)]">No timetable slots yet</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Tap &quot;Add Slot&quot; to fill in the timetable
            </p>
          </div>
        ) : null}

        {/* Slot list (detailed view) */}
        {classSlots.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
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
                          <span className="text-xs font-medium text-[var(--accent-text)] px-2 py-0.5 rounded-full" style={{ background: "var(--accent-soft)" }}>
                            {slot.periodLabel}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {
                              DAYS.find((d) => d.value === slot.dayOfWeek)
                                ?.label
                            }
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                          {slot.subject}
                        </h4>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {slot.teacher}
                        </p>
                        {slot.jointWith && slot.jointWith.length > 0 && (
                          <p className="text-xs text-[hsl(var(--accent-text))] bg-[hsl(var(--accent-soft))] border border-[hsl(var(--accent)/0.2)] rounded-lg px-2 py-1 mt-1.5 font-medium">
                            Joint class with {slot.jointWith.join(" & ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={deleting === slot.id}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
