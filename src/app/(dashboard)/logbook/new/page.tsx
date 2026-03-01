"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  BookOpen,
  FileText,
  GraduationCap,
  Calendar,
  PenTool,
  Layers,
  Check,
} from "lucide-react";
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

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

  // Multi-period selection: up to 2 slots
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  // Form state
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [topicText, setTopicText] = useState("");
  const [period, setPeriod] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [objectives, setObjectives] = useState("");
  const [studentAttendance, setStudentAttendance] = useState("");
  const [engagementLevel, setEngagementLevel] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [timetableSlotId, setTimetableSlotId] = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [submittedEntries, setSubmittedEntries] = useState<{
    subject: string;
    module: string;
    topic: string;
    className: string;
    date: string;
    periods: { period: string; time: string; duration: string }[];
    notes: string;
    objectives: string;
    attendance: string;
    engagement: string;
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
    // Reset slot selection when date changes
    setSelectedSlotIds([]);
    setTimetableSlotId(null);
    setPeriod("");
    setDuration("60");
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

  // Timetable slots filtered by selected class + date's day of week
  const slotsForClassAndDay = useMemo(() => {
    if (!classId || !date) return [];
    const dayOfWeek = getDayOfWeek(date);
    return timetableSlots.filter(
      (slot) => slot.assignment.classId === classId && slot.dayOfWeek === dayOfWeek
    );
  }, [timetableSlots, classId, date]);

  // Auto-select subject if only one for the class
  useEffect(() => {
    if (subjectsForClass.length === 1) {
      setSubjectId(subjectsForClass[0].id);
      setAssignmentId(subjectsForClass[0].assignmentId);
    }
  }, [subjectsForClass]);

  // Auto-select slot if there's only one for the class+day
  useEffect(() => {
    if (slotsForClassAndDay.length === 1 && selectedSlotIds.length === 0) {
      handleSlotToggle(slotsForClassAndDay[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsForClassAndDay]);

  // Get the class level for the selected class
  const selectedClassLevel = useMemo(() => {
    return assignedClasses.find((c) => c.id === classId)?.level || "";
  }, [assignedClasses, classId]);

  // Get unique modules for the selected subject and class level
  const modules = useMemo(() => {
    if (!subjectId || !selectedClassLevel) return [];
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    const topicsToUse = filtered.length > 0 ? filtered : subject.topics;
    const moduleMap = new Map<string, string>();
    for (const t of topicsToUse) {
      if (t.moduleName && !moduleMap.has(t.moduleName)) {
        moduleMap.set(t.moduleName, t.moduleName);
      }
    }
    return Array.from(moduleMap.values());
  }, [subjects, subjectId, selectedClassLevel]);

  // Get selected slots data
  const selectedSlotsData = useMemo(() => {
    return selectedSlotIds
      .map((id) => timetableSlots.find((s) => s.id === id))
      .filter(Boolean) as TimetableSlot[];
  }, [selectedSlotIds, timetableSlots]);

  // Handle timetable slot toggle (multi-select up to 2)
  function handleSlotToggle(slot: TimetableSlot) {
    setSelectedSlotIds((prev) => {
      const already = prev.includes(slot.id);
      if (already) {
        const next = prev.filter((id) => id !== slot.id);
        if (next.length === 0) {
          setTimetableSlotId(null);
          setPeriod("");
          setDuration("60");
        } else {
          const remaining = timetableSlots.find((s) => s.id === next[0]);
          if (remaining) {
            setTimetableSlotId(remaining.id);
            const periodMatch = remaining.periodLabel.match(/\d+/);
            if (periodMatch) setPeriod(periodMatch[0]);
          }
        }
        return next;
      }

      if (prev.length >= 2) return prev;

      // If we have existing selections, new slot must be same class+subject
      if (prev.length > 0) {
        const existingSlot = timetableSlots.find((s) => s.id === prev[0]);
        if (existingSlot) {
          if (
            slot.assignment.classId !== existingSlot.assignment.classId ||
            slot.assignment.subjectId !== existingSlot.assignment.subjectId
          ) {
            // Different class or subject — replace selection
            setClassId(slot.assignment.classId);
            setSubjectId(slot.assignment.subjectId);
            setAssignmentId(slot.assignment.id);
            setTimetableSlotId(slot.id);
            setModuleName("");
            setTopicText("");
            const periodMatch = slot.periodLabel.match(/\d+/);
            if (periodMatch) setPeriod(periodMatch[0]);
            const [sh, sm] = slot.startTime.split(":").map(Number);
            const [eh, em] = slot.endTime.split(":").map(Number);
            const mins = (eh * 60 + em) - (sh * 60 + sm);
            if (mins > 0) setDuration(String(mins));
            return [slot.id];
          }
        }
      }

      // First selection or adding second
      if (prev.length === 0) {
        setClassId(slot.assignment.classId);
        setSubjectId(slot.assignment.subjectId);
        setAssignmentId(slot.assignment.id);
        setModuleName("");
        setTopicText("");
      }
      setTimetableSlotId(slot.id);
      const periodMatch = slot.periodLabel.match(/\d+/);
      if (periodMatch) setPeriod(periodMatch[0]);
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) setDuration(String(mins));

      return [...prev, slot.id];
    });
  }

  // Handle class change
  const handleClassChange = useCallback((newClassId: string) => {
    setClassId(newClassId);
    setSubjectId("");
    setModuleName("");
    setTopicText("");
    setAssignmentId(null);
    setSelectedSlotIds([]);
    setTimetableSlotId(null);
    setPeriod("");
    setDuration("60");
  }, []);

  // Handle subject change
  const handleSubjectChange = useCallback((newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setModuleName("");
    setTopicText("");
    const match = assignments.find(
      (a) => a.class.id === classId && a.subject.id === newSubjectId
    );
    if (match) setAssignmentId(match.id);
    if (selectedSlotIds.length > 0) {
      setSelectedSlotIds([]);
      setTimetableSlotId(null);
    }
  }, [assignments, classId, selectedSlotIds]);

  const selectedDayName = date ? DAY_NAMES[getDayOfWeek(date)] || "" : "";
  const isWeekend = date ? getDayOfWeek(date) > 5 : false;
  const hasTeachingOnDay = loadingSlots || timetableSlots.length > 0 || isWeekend;
  const isFormValid = date && classId && subjectId && topicText.trim().length > 0 && hasTeachingOnDay;
  const hasMultiSlots = selectedSlotIds.length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      // Build the slots to submit for (could be 1 or 2)
      const slotsToSubmit = selectedSlotsData.length > 0
        ? selectedSlotsData
        : [null]; // null means manual entry (no timetable slot)

      const createdEntries = [];

      for (const slot of slotsToSubmit) {
        let entryPeriod = period ? parseInt(period) : null;
        let entryDuration = parseInt(duration);
        let entrySlotId = timetableSlotId;
        let entryAssignmentId = assignmentId;

        if (slot) {
          entrySlotId = slot.id;
          entryAssignmentId = slot.assignment.id;
          const periodMatch = slot.periodLabel.match(/\d+/);
          if (periodMatch) entryPeriod = parseInt(periodMatch[0]);
          const [sh, sm] = slot.startTime.split(":").map(Number);
          const [eh, em] = slot.endTime.split(":").map(Number);
          const mins = (eh * 60 + em) - (sh * 60 + sm);
          if (mins > 0) entryDuration = mins;
        }

        const body: Record<string, unknown> = {
          date,
          classId,
          assignmentId: entryAssignmentId || null,
          timetableSlotId: entrySlotId || null,
          period: entryPeriod,
          duration: entryDuration,
          moduleName: moduleName || null,
          topicText: topicText.trim() || null,
          notes: notes || null,
          objectives: objectives || null,
          studentAttendance: studentAttendance ? parseInt(studentAttendance) : null,
          engagementLevel: engagementLevel || null,
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

        createdEntries.push(await res.json());
      }

      setCompletionTime(seconds);

      const firstEntry = createdEntries[0];
      const subjectName = firstEntry.assignment?.subject?.name ?? firstEntry.topics?.[0]?.subject?.name ?? "—";
      const entryDate = new Date(firstEntry.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const periodsList = createdEntries.map((entry) => ({
        period: entry.timetableSlot?.periodLabel || (entry.period ? `Period ${entry.period}` : "—"),
        time: entry.timetableSlot
          ? `${entry.timetableSlot.startTime} - ${entry.timetableSlot.endTime}`
          : "—",
        duration: `${entry.duration} min`,
      }));

      setSubmittedEntries({
        subject: subjectName,
        module: firstEntry.moduleName || "—",
        topic: firstEntry.topicText || firstEntry.topics?.[0]?.name || "—",
        className: firstEntry.class.name,
        date: entryDate,
        periods: periodsList,
        notes: firstEntry.notes || "",
        objectives: firstEntry.objectives || "",
        attendance: firstEntry.studentAttendance ? `${firstEntry.studentAttendance} students` : "",
        engagement: firstEntry.engagementLevel || "",
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
    setModuleName("");
    setTopicText("");
    setPeriod("");
    setDuration("60");
    setNotes("");
    setObjectives("");
    setStudentAttendance("");
    setEngagementLevel("");
    setSignatureData(null);
    setAssignmentId(null);
    setTimetableSlotId(null);
    setSelectedSlotIds([]);
    setSuccess(false);
    setSeconds(0);
    setError("");
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }

  // ───── Beautiful Success Screen ─────
  if (success && submittedEntries) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 px-5 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {submittedEntries.periods.length > 1
                ? `${submittedEntries.periods.length} Entries Submitted!`
                : "Entry Submitted!"}
            </h1>
            <p className="text-emerald-100 mt-1">
              Completed in{" "}
              <span className="font-bold text-white">
                {completionTime} seconds
              </span>
            </p>
          </div>
        </div>

        <div className="px-5 -mt-4 max-w-lg mx-auto w-full flex-1">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3">
              <p className="text-white font-bold text-base">{submittedEntries.subject}</p>
              <p className="text-white/70 text-xs">{submittedEntries.className} &middot; {submittedEntries.date}</p>
            </div>

            <div className="p-5 space-y-0 divide-y divide-slate-100">
              <div className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Module</p>
                    <p className="text-sm font-medium text-slate-800">{submittedEntries.module}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-2.5">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Topic Covered</p>
                    <p className="text-sm font-medium text-slate-800">{submittedEntries.topic}</p>
                  </div>
                </div>
              </div>

              <div className="py-3">
                {submittedEntries.periods.length > 1 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {submittedEntries.periods.length} periods filled at once
                  </p>
                )}
                <div className="space-y-2">
                  {submittedEntries.periods.map((p, i) => (
                    <div key={i} className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                        <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">Period</p>
                        <p className="text-xs font-bold text-slate-800">{p.period}</p>
                      </div>
                      <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                        <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">Time</p>
                        <p className="text-xs font-bold text-slate-800">{p.time}</p>
                      </div>
                      <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                        <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                        <p className="text-xs font-bold text-slate-800">{p.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(submittedEntries.attendance || submittedEntries.engagement) && (
                <div className="py-3">
                  <div className="grid grid-cols-2 gap-3">
                    {submittedEntries.attendance && (
                      <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                        <p className="text-[10px] text-slate-400 font-medium">Attendance</p>
                        <p className="text-xs font-bold text-slate-800">{submittedEntries.attendance}</p>
                      </div>
                    )}
                    {submittedEntries.engagement && (
                      <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                        <p className="text-[10px] text-slate-400 font-medium">Engagement</p>
                        <p className="text-xs font-bold text-slate-800">
                          {submittedEntries.engagement.charAt(0) + submittedEntries.engagement.slice(1).toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(submittedEntries.notes || submittedEntries.objectives) && (
                <div className="pt-3 space-y-3">
                  {submittedEntries.objectives && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Objectives</p>
                        <p className="text-sm text-slate-600 mt-0.5">{submittedEntries.objectives}</p>
                      </div>
                    </div>
                  )}
                  {submittedEntries.notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Notes</p>
                        <p className="text-sm text-slate-600 mt-0.5">{submittedEntries.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3 pb-8">
            <button onClick={resetForm} className="btn-primary text-center">
              New Entry
            </button>
            <Link href="/history" className="btn-secondary block text-center">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ───── Entry Form ─────
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.back()} className="text-white/80 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-mono font-medium text-white">{seconds}s</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">New Logbook Entry</h1>
          <p className="text-brand-400 text-sm mt-0.5">Fill in under 60 seconds</p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-semibold underline">Dismiss</button>
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
              Your school administrator needs to assign you to classes and subjects before you can create logbook entries.
            </p>
            <Link href="/timetable" className="text-sm text-brand-600 font-medium mt-3 inline-block">View My Timetable</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault(); }} className="space-y-4">
            {/* Date */}
            <div>
              <label className="label-field">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="input-field" required />
              {date && !isWeekend && <p className="text-xs text-brand-600 mt-1 font-medium">{selectedDayName}</p>}
              {isWeekend && <p className="text-xs text-amber-600 mt-1">Weekend — no timetable slots available</p>}
            </div>

            {/* Timetable Slot Picker — always visible, multi-select up to 2 */}
            {!loadingSlots && timetableSlots.length > 0 && (
              <div>
                <label className="label-field flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" />
                  Your {selectedDayName} Schedule — Tap to Fill
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Select up to 2 periods of the same subject to fill at once</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {timetableSlots.map((slot) => {
                    const isSelected = selectedSlotIds.includes(slot.id);
                    const canAdd = selectedSlotIds.length < 2 || isSelected;
                    const isCompatible = selectedSlotIds.length === 0 || isSelected ||
                      (selectedSlotsData.length > 0 &&
                        slot.assignment.classId === selectedSlotsData[0].assignment.classId &&
                        slot.assignment.subjectId === selectedSlotsData[0].assignment.subjectId);
                    return (
                      <button key={slot.id} type="button" onClick={() => handleSlotToggle(slot)}
                        className={`flex-shrink-0 rounded-xl border-2 px-3 py-2.5 text-left transition-all relative ${
                          isSelected ? "border-brand-500 bg-brand-50 shadow-sm"
                            : !canAdd || !isCompatible ? "border-slate-100 bg-slate-50 opacity-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <p className="text-xs font-bold text-slate-900">{slot.periodLabel}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-[11px] font-semibold text-brand-700 mt-1.5">{slot.assignment.subjectName}</p>
                        <p className="text-[10px] text-slate-400">{slot.assignment.className}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {loadingSlots && (
              <div className="flex gap-2">
                {[1, 2].map((i) => (<div key={i} className="flex-shrink-0 w-28 h-20 rounded-xl bg-slate-100 animate-pulse" />))}
              </div>
            )}

            {/* Class Selection — only show when no slot selected */}
            {selectedSlotIds.length === 0 && (
              <div>
                <label className="label-field">Class</label>
                <select value={classId} onChange={(e) => handleClassChange(e.target.value)} className="input-field" required>
                  <option value="">Select your class</option>
                  {assignedClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
            )}

            {/* No timetable slots warning for selected day */}
            {!loadingSlots && timetableSlots.length === 0 && !isWeekend && date && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">You do not teach on {selectedDayName}</p>
                  <p className="mt-0.5 text-red-600">No timetable slots found for this day. Please select a day you have classes.</p>
                </div>
              </div>
            )}

            {/* Auto-filled display when slot(s) selected */}
            {selectedSlotIds.length > 0 && (
              <>
                <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 text-sm text-brand-800">
                    <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <div>
                      {hasMultiSlots ? (
                        <span className="font-semibold">
                          {selectedSlotsData.map((s) => { const m = s.periodLabel.match(/\d+/); return m ? `P${m[0]}` : s.periodLabel; }).join(" & ")}
                          <span className="text-brand-500 mx-1.5">&middot;</span>
                          <span className="text-brand-600">2 periods at once</span>
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold">Period {period}</span>
                          <span className="text-brand-500 mx-1.5">&middot;</span>
                          <span>{duration} min</span>
                        </>
                      )}
                      <span className="text-brand-500 mx-1.5">&middot;</span>
                      <span className="text-brand-600">Auto-filled from timetable</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setSelectedSlotIds([]); setTimetableSlotId(null); setClassId(""); setSubjectId(""); setAssignmentId(null); setPeriod(""); setDuration("60"); }}
                    className="text-xs text-brand-600 font-medium mt-1 underline">Change selection</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Class</label>
                    <div className="input-field bg-slate-50 text-slate-700 flex items-center text-sm">{assignedClasses.find((c) => c.id === classId)?.name || "—"}</div>
                  </div>
                  <div>
                    <label className="label-field">Subject</label>
                    <div className="input-field bg-slate-50 text-slate-700 flex items-center text-sm">{subjectsForClass.find((s) => s.id === subjectId)?.name || "—"}</div>
                  </div>
                </div>
              </>
            )}

            {/* Subject — manual selection */}
            {classId && selectedSlotIds.length === 0 && (
              <div>
                <label className="label-field">Subject</label>
                {subjectsForClass.length === 1 ? (
                  <div className="input-field bg-slate-50 text-slate-700 flex items-center">{subjectsForClass[0].name}</div>
                ) : (
                  <select value={subjectId} onChange={(e) => handleSubjectChange(e.target.value)} className="input-field" required>
                    <option value="">Select subject</option>
                    {subjectsForClass.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                )}
              </div>
            )}

            {/* Module Picker */}
            {subjectId && (
              <div>
                <label className="label-field flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-500" />Module</label>
                {modules.length > 0 ? (
                  <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="input-field">
                    <option value="">Select module (optional)</option>
                    {modules.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500">No modules defined for this subject yet. You can still type your topic below.</div>
                )}
              </div>
            )}

            {/* Topic */}
            {subjectId && (
              <div>
                <label className="label-field flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-emerald-500" />Topic Covered</label>
                <input type="text" value={topicText} onChange={(e) => setTopicText(e.target.value.slice(0, 300))} className="input-field" placeholder="Type the topic you taught..." required maxLength={300} />
                <p className="text-xs text-slate-400 mt-1 text-right">{topicText.length}/300</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="label-field">Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} className="input-field resize-none" rows={3} placeholder="Brief notes about the lesson..." maxLength={500} />
              <p className="text-xs text-slate-400 mt-1 text-right">{notes.length}/500</p>
            </div>

            {/* Objectives */}
            <div>
              <label className="label-field">Objectives (Optional)</label>
              <textarea value={objectives} onChange={(e) => setObjectives(e.target.value.slice(0, 500))} className="input-field resize-none" rows={2} placeholder="Learning objectives covered..." maxLength={500} />
              <p className="text-xs text-slate-400 mt-1 text-right">{objectives.length}/500</p>
            </div>

            {/* Student Attendance & Engagement */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field flex items-center gap-1.5">Student Population</label>
                <input type="number" value={studentAttendance} onChange={(e) => setStudentAttendance(e.target.value)} className="input-field" placeholder="# present" min="0" max="999" />
              </div>
              <div>
                <label className="label-field flex items-center gap-1.5">Student Engagement</label>
                <select value={engagementLevel} onChange={(e) => setEngagementLevel(e.target.value)} className="input-field">
                  <option value="">Select level</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="label-field">Digital Signature (Optional)</label>
              <SignaturePad onSign={(data: string) => setSignatureData(data)} onClear={() => setSignatureData(null)} />
            </div>

            {/* Submit */}
            <button type="submit" disabled={!isFormValid || submitting} className="btn-primary flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting{hasMultiSlots ? ` ${selectedSlotIds.length} entries` : ""}...
                </>
              ) : (
                hasMultiSlots ? `Submit ${selectedSlotIds.length} Entries` : "Submit Entry"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
