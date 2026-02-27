"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";
import Link from "next/link";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
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
  subject: string;
}

interface AssignmentOption {
  id: string;
  teacher: string;
  className: string;
  subject: string;
}

interface PeriodSchedule {
  id: string;
  periodNum: number;
  label: string;
  startTime: string;
  endTime: string;
}

export default function TimetableManagementPage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [periods, setPeriods] = useState<PeriodSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const [form, setForm] = useState({
    assignmentId: "",
    dayOfWeek: "1",
    periodNum: "",
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  async function fetchTimetable() {
    try {
      const res = await fetch("/api/admin/timetable");
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
        setAssignments(data.assignments);
        setPeriods(data.periods);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.assignmentId || !form.periodNum) return;

    const period = periods.find((p) => p.periodNum === parseInt(form.periodNum));
    if (!period) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: form.assignmentId,
          dayOfWeek: form.dayOfWeek,
          periodNum: parseInt(form.periodNum),
          startTime: period.startTime,
          endTime: period.endTime,
          periodLabel: period.label,
        }),
      });

      if (res.ok) {
        const newSlot = await res.json();
        setSlots((prev) => [...prev, newSlot]);
        setForm({ assignmentId: "", dayOfWeek: form.dayOfWeek, periodNum: "" });
        setShowForm(false);
      }
    } catch {
      // silently fail
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
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  }

  const filteredSlots = slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Timetable</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Day Selector */}
        <div className="flex gap-1 overflow-x-auto">
          {DAYS.map((day) => (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`flex-1 min-w-0 rounded-xl px-2 py-2.5 text-center text-xs font-medium transition-colors ${
                selectedDay === day.value
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {day.label.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Add Slot Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Timetable Slot
            </h3>

            {assignments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No teacher assignments found. Assign teachers to classes and subjects first.
              </p>
            ) : (
              <>
                <div>
                  <label className="label-field">Teacher / Class / Subject</label>
                  <select
                    value={form.assignmentId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, assignmentId: e.target.value }))
                    }
                    className="input-field"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.teacher} — {a.className} — {a.subject}
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
                        setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
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
                    <label className="label-field">Period</label>
                    <select
                      value={form.periodNum}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, periodNum: e.target.value }))
                      }
                      className="input-field"
                    >
                      <option value="">Select period</option>
                      {periods.map((p) => (
                        <option key={p.periodNum} value={p.periodNum}>
                          {p.label} ({p.startTime} - {p.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !form.assignmentId || !form.periodNum}
                  className="btn-primary text-sm"
                >
                  {saving ? "Adding..." : "Add Slot"}
                </button>
              </>
            )}
          </form>
        )}

        {/* Timetable Slots */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">
              No slots for {DAYS.find((d) => d.value === selectedDay)?.label}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Tap &quot;Add Slot&quot; to create one
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                        {slot.periodLabel}
                      </span>
                      <span className="text-xs text-slate-400">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {slot.subject}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {slot.className} &middot; {slot.teacher}
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
        )}

        {/* Total count */}
        <p className="text-center text-xs text-slate-400">
          {slots.length} total slot{slots.length !== 1 ? "s" : ""} across all days
        </p>
      </div>
    </div>
  );
}
