"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

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

interface TopicItem {
  id: string;
  name: string;
  classLevel: string;
  moduleNum: number | null;
  moduleName: string | null;
  orderIndex: number;
}

interface SubjectWithTopics {
  id: string;
  name: string;
  code: string;
  topics: TopicItem[];
}

interface AssignmentItem {
  id: string;
  class: { id: string; name: string; level: string; stream: string | null };
  subject: { id: string; name: string; code: string };
  timetableSlots: {
    id: string;
    day: number;
    period: string;
    time: string;
  }[];
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export default function NewEntryPage() {
  const router = useRouter();

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Data
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
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

  // Fetch teacher assignments and subjects
  useEffect(() => {
    async function fetchData() {
      try {
        const [assignRes, subjectRes] = await Promise.all([
          fetch("/api/teacher/assignments"),
          fetch("/api/subjects"),
        ]);
        if (assignRes.ok) {
          setAssignments(await assignRes.json());
        }
        if (subjectRes.ok) {
          setSubjects(await subjectRes.json());
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
        // Silently fail
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
    setSelectedSlotId(null);
  }, [date]);

  // Derive unique classes from assignments
  const assignedClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string; level: string }>();
    for (const a of assignments) {
      if (!classMap.has(a.class.id)) {
        classMap.set(a.class.id, { id: a.class.id, name: a.class.name, level: a.class.level });
      }
    }
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  // Subjects available for the selected class (from assignments)
  const subjectsForClass = useMemo(() => {
    if (!classId) return [];
    return assignments
      .filter((a) => a.class.id === classId)
      .map((a) => ({ id: a.subject.id, name: a.subject.name, code: a.subject.code, assignmentId: a.id }));
  }, [assignments, classId]);

  // Auto-select subject if only one for the class
  useEffect(() => {
    if (subjectsForClass.length === 1) {
      setSubjectId(subjectsForClass[0].id);
      setAssignmentId(subjectsForClass[0].assignmentId);
    }
  }, [subjectsForClass]);

  // Get the class level for the selected class
  const selectedClassLevel = useMemo(() => {
    return assignedClasses.find((c) => c.id === classId)?.level || "";
  }, [assignedClasses, classId]);

  // Topics for the selected subject, filtered by class level
  const topics = useMemo(() => {
    if (!subjectId || !selectedClassLevel) return [];
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    if (filtered.length > 0) return filtered;
    // If no topics match the exact level, show all topics for the subject
    return subject.topics;
  }, [subjects, subjectId, selectedClassLevel]);

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
    const periodMatch = slot.periodLabel.match(/\d+/);
    if (periodMatch) setPeriod(periodMatch[0]);
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins > 0) setDuration(String(mins));
  }

  // Handle class change
  const handleClassChange = useCallback((newClassId: string) => {
    setClassId(newClassId);
    setSubjectId("");
    setTopicId("");
    setAssignmentId(null);
    if (selectedSlotId) {
      setSelectedSlotId(null);
      setTimetableSlotId(null);
    }
  }, [selectedSlotId]);

  // Handle subject change
  const handleSubjectChange = useCallback((newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setTopicId("");
    // Find the assignment for this class+subject combo
    const match = assignments.find(
      (a) => a.class.id === classId && a.subject.id === newSubjectId
    );
    if (match) setAssignmentId(match.id);
    if (selectedSlotId) {
      setSelectedSlotId(null);
      setTimetableSlotId(null);
    }
  }, [assignments, classId, selectedSlotId]);

  const isFormValid = date && classId && subjectId && (topicId || topics.length === 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        date,
        classId,
        assignmentId: assignmentId || null,
        timetableSlotId: timetableSlotId || null,
        period: period ? parseInt(period) : null,
        duration: parseInt(duration),
        notes: notes || null,
        objectives: objectives || null,
        signatureData,
      };

      if (topicId) {
        body.topicId = topicId;
      } else {
        // If no topics available, we still need a topic - use subject ID as fallback
        // The API requires at least one topic
      }

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
        subject: entry.assignment?.subject?.name ?? entry.topics?.[0]?.subject?.name ?? "—",
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
    setClassId("");
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
        ) : assignments.length === 0 ? (
          <div className="card p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="font-medium text-slate-900">No assignments yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Your school administrator needs to assign you to classes and
              subjects before you can create logbook entries.
            </p>
            <Link
              href="/assignments"
              className="text-sm text-brand-600 font-medium mt-3 inline-block"
            >
              View My Assignments
            </Link>
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

            {/* Class — only shows classes the teacher is assigned to */}
            <div>
              <label className="label-field">Class</label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select your class</option>
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject — auto-fills if only one assignment, otherwise dropdown of assigned subjects */}
            {classId && (
              <div>
                <label className="label-field">Subject</label>
                {subjectsForClass.length === 1 ? (
                  <div className="input-field bg-slate-50 text-slate-700 flex items-center">
                    {subjectsForClass[0].name}
                  </div>
                ) : (
                  <select
                    value={subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select subject</option>
                    {subjectsForClass.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Topic — filtered by subject and class level */}
            {subjectId && (
              <div>
                <label className="label-field">Topic</label>
                {topics.length > 0 ? (
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select topic covered</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.moduleName
                          ? `${t.moduleName}: ${t.name}`
                          : t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                    No topics available for this subject yet. Your admin can add
                    topics in the curriculum settings.
                  </div>
                )}
              </div>
            )}

            {/* Period & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">
                  Period{selectedSlotId ? " (auto)" : ""}
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input-field"
                  disabled={!!selectedSlotId}
                >
                  <option value="">--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
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
