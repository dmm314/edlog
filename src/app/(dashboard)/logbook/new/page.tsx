"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { SubjectWithTopics, ClassOption } from "@/types";

const SignaturePad = dynamic(
  () => import("@/components/SignaturePad").then((mod) => mod.SignaturePad),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center text-slate-400 text-sm">
        Loading signature pad...
      </div>
    ),
  }
);

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignment: {
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
  };
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jsDay = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return jsDay === 0 ? 7 : jsDay; // Convert to 1=Mon ... 7=Sun
}

export default function NewEntryPage() {
  const router = useRouter();

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Data
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Timetable slots
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [period, setPeriod] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [objectives, setObjectives] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [timetableSlotId, setTimetableSlotId] = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [submittedEntry, setSubmittedEntry] = useState<{
    subject: string;
    topic: string;
    className: string;
    date: string;
  } | null>(null);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Fetch classes and subjects
  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes, subjectRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/subjects"),
        ]);
        if (classRes.ok) {
          const classData = await classRes.json();
          setClasses(classData);
        }
        if (subjectRes.ok) {
          const subjectData = await subjectRes.json();
          setSubjects(subjectData);
        }
      } catch {
        setError("Failed to load form data. Please refresh.");
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Fetch timetable slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!date) return;
      const dayOfWeek = getDayOfWeek(date);
      if (dayOfWeek > 5) {
        setTimetableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/timetable/slots?dayOfWeek=${dayOfWeek}`);
        if (res.ok) {
          setTimetableSlots(await res.json());
        }
      } catch {
        // Silently fail - timetable is optional
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
    setSelectedSlotId(null);
  }, [date]);

  // Restore last used class from localStorage
  useEffect(() => {
    const lastClass = localStorage.getItem("edlog_lastClass");
    if (lastClass && classes.find((c) => c.id === lastClass)) {
      setClassId(lastClass);
    }
  }, [classes]);

  // Handle timetable slot selection (quick-fill)
  function handleSlotSelect(slot: TimetableSlot) {
    if (selectedSlotId === slot.id) {
      // Deselect
      setSelectedSlotId(null);
      setAssignmentId(null);
      setTimetableSlotId(null);
      setClassId("");
      setSubjectId("");
      setTopicId("");
      setPeriod("");
      return;
    }
    setSelectedSlotId(slot.id);
    setAssignmentId(slot.assignment.id);
    setTimetableSlotId(slot.id);
    setClassId(slot.assignment.classId);
    setSubjectId(slot.assignment.subjectId);
    setTopicId("");
    // Extract period number from periodLabel like "Period 3"
    const periodMatch = slot.periodLabel.match(/\d+/);
    if (periodMatch) setPeriod(periodMatch[0]);
    // Calculate duration from start/end times
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins > 0) setDuration(String(mins));
  }

  // Get filtered topics based on selected subject
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const topics = selectedSubject?.topics || [];

  // Reset topic when subject changes
  const handleSubjectChange = useCallback((newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setTopicId("");
    if (selectedSlotId) {
      setSelectedSlotId(null);
      setAssignmentId(null);
      setTimetableSlotId(null);
    }
  }, [selectedSlotId]);

  const isFormValid = date && classId && subjectId && topicId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting) return;
    setError("");
    setSubmitting(true);

    // Save last used class
    localStorage.setItem("edlog_lastClass", classId);

    try {
      const body = {
        date,
        classId,
        topicId: topicId || undefined,
        assignmentId: assignmentId || null,
        timetableSlotId: timetableSlotId || null,
        period: period ? parseInt(period) : null,
        duration: parseInt(duration),
        notes: notes || null,
        objectives: objectives || null,
        signatureData,
      };

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create entry");
      }

      const entry = await res.json();
      setCompletionTime(seconds);
      setSubmittedEntry({
        subject: entry.topics?.[0]?.subject?.name ?? "—",
        topic: entry.topics?.[0]?.name ?? "—",
        className: entry.class.name,
        date: new Date(entry.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      });
      setSuccess(true);
      clearInterval(timerRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create entry"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().split("T")[0]);
    setSubjectId("");
    setTopicId("");
    setPeriod("");
    setDuration("60");
    setNotes("");
    setObjectives("");
    setSignatureData(null);
    setAssignmentId(null);
    setTimetableSlotId(null);
    setSelectedSlotId(null);
    setSuccess(false);
    setSeconds(0);
    setError("");
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }

  // Success screen
  if (success && submittedEntry) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 px-5 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Entry Submitted!</h1>
            <p className="text-emerald-100 mt-1">
              Completed in{" "}
              <span className="font-bold text-white">
                {completionTime} seconds
              </span>
            </p>
          </div>
        </div>

        <div className="px-5 -mt-4 max-w-lg mx-auto w-full flex-1">
          <div className="card p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subject</span>
              <span className="font-medium text-slate-900">
                {submittedEntry.subject}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Topic</span>
              <span className="font-medium text-slate-900">
                {submittedEntry.topic}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Class</span>
              <span className="font-medium text-slate-900">
                {submittedEntry.className}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">
                {submittedEntry.date}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button onClick={resetForm} className="btn-primary text-center">
              New Entry
            </button>
            <Link
              href="/history"
              className="btn-secondary block text-center"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-mono font-medium text-white">
                {seconds}s
              </span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">
            New Logbook Entry
          </h1>
          <p className="text-brand-400 text-sm mt-0.5">
            Fill in under 60 seconds
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 mt-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadingData ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div>
              <label className="label-field">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="input-field"
                required
              />
            </div>

            {/* Timetable Quick-Fill */}
            {!loadingSlots && timetableSlots.length > 0 && (
              <div>
                <label className="label-field flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Quick Fill from Timetable
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {timetableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`flex-shrink-0 rounded-xl border-2 px-3 py-2 text-left transition-all ${
                        selectedSlotId === slot.id
                          ? "border-brand-500 bg-brand-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900">
                        {slot.periodLabel}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-[11px] font-medium text-brand-700 mt-1">
                        {slot.assignment.subjectName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {slot.assignment.className}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingSlots && (
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-28 h-20 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Class */}
            <div>
              <label className="label-field">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="label-field">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="label-field">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="input-field"
                required
                disabled={!subjectId}
              >
                <option value="">
                  {subjectId ? "Select a topic" : "Select a subject first"}
                </option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.moduleName ? `${t.moduleName}: ${t.name}` : t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Period (Optional)</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input-field"
                >
                  <option value="">--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Duration (min)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field"
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label-field">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                className="input-field resize-none"
                rows={3}
                placeholder="Brief notes about the lesson..."
                maxLength={500}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Objectives */}
            <div>
              <label className="label-field">Objectives (Optional)</label>
              <textarea
                value={objectives}
                onChange={(e) =>
                  setObjectives(e.target.value.slice(0, 500))
                }
                className="input-field resize-none"
                rows={2}
                placeholder="Learning objectives covered..."
                maxLength={500}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {objectives.length}/500
              </p>
            </div>

            {/* Signature */}
            <div>
              <label className="label-field">
                Digital Signature (Optional)
              </label>
              <SignaturePad
                onSign={(data: string) => setSignatureData(data)}
                onClear={() => setSignatureData(null)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Entry"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
