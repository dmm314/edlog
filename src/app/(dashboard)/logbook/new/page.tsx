"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  Check,
  Save,
  XCircle,
  Copy,
  Zap,
  ChevronRight,
  ChevronDown,
  Info,
  Pencil,
  Globe,
  Monitor,
  Smartphone,
  Plus,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getFamilyOfSituation } from "@/lib/family-of-situation";

const SignaturePad = dynamic(
  () => import("@/components/SignaturePad").then((mod) => mod.SignaturePad),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-sm" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>
        Loading signature pad...
      </div>
    ),
  }
);

function shortClassName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.startsWith("form ")) {
    return name.replace(/^Form\s+/i, "").replace(/\s+/g, "");
  }
  if (lower.includes("lower sixth")) {
    const section = name.replace(/lower\s+sixth\s*/i, "").trim();
    return `L6${section}`;
  }
  if (lower.includes("upper sixth")) {
    const section = name.replace(/upper\s+sixth\s*/i, "").trim();
    return `U6${section}`;
  }
  return name.length > 4 ? name.slice(-3).trim() : name;
}

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
    classLevel: string;
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
  division: { id: string; name: string } | null;
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
const STEP_LABELS = ["Module", "Topic", "Details"];

export default function NewEntryPage() {
  const router = useRouter();

  // ─── Step state ───
  const [step, setStep] = useState(0);

  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [filledPeriods, setFilledPeriods] = useState<Set<number>>(new Set());
  const [filledSlotIds, setFilledSlotIds] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [additionalClassIds, setAdditionalClassIds] = useState<string[]>([]);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [topicText, setTopicText] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [objectives, setObjectives] = useState("");
  const [studentAttendance, setStudentAttendance] = useState("");
  const [engagementLevel, setEngagementLevel] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [timetableSlotId, setTimetableSlotId] = useState<string | null>(null);
  const [classDidNotHold, setClassDidNotHold] = useState(false);

  // CBA fields
  const [familyOfSituation, setFamilyOfSituation] = useState("");
  const [familyOfSitEditing, setFamilyOfSitEditing] = useState(false);
  const [bilingualActivity, setBilingualActivity] = useState(false);
  const [bilingualType, setBilingualType] = useState("");
  const [bilingualNote, setBilingualNote] = useState("");
  const [integrationActivity, setIntegrationActivity] = useState("");
  const [integrationLevel, setIntegrationLevel] = useState("");
  const [integrationStatus, setIntegrationStatus] = useState("");

  // Structured objectives from curriculum metadata
  const [metadataObjectives, setMetadataObjectives] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<Record<string, string>>({}); // text → proportion
  const [customObjective, setCustomObjective] = useState("");
  const [showCustomObjectiveInput, setShowCustomObjectiveInput] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [familyOfSitCustom, setFamilyOfSitCustom] = useState(false);
  const [lessonMode, setLessonMode] = useState("physical");
  const [digitalTools, setDigitalTools] = useState<string[]>([]);

  // Assignment tracking
  const [assignmentGiven, setAssignmentGiven] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState("");
  const [assignmentReviewed, setAssignmentReviewed] = useState<boolean | null>(null);
  const [pendingAssignmentInfo, setPendingAssignmentInfo] = useState<string | null>(null);

  // Collapsible optional details
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [submittedEntries, setSubmittedEntries] = useState<{
    subject: string;
    module: string;
    topic: string;
    topics: string[];
    className: string;
    classNames: string[];
    date: string;
    periods: { period: string; time: string; duration: string }[];
    notes: string;
    objectives: string;
    attendance: string;
    engagement: string;
    isDraft: boolean;
    classDidNotHold: boolean;
    // CBA
    familyOfSituation: string;
    bilingualActivity: boolean;
    bilingualType: string;
    lessonMode: string;
    integrationActivity: string;
    assignmentGiven: boolean;
    assignmentDetails: string;
    assignmentReviewed: boolean | null;
  } | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignRes, subjectRes] = await Promise.all([
          fetch("/api/teacher/assignments"),
          fetch("/api/subjects"),
        ]);
        if (assignRes.ok) setAssignments(await assignRes.json());
        if (subjectRes.ok) setSubjects(await subjectRes.json());
      } catch {
        setError("Failed to load form data. Please refresh.");
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!date) return;
      const dayOfWeek = getDayOfWeek(date);
      if (dayOfWeek > 5) {
        setTimetableSlots([]);
        setFilledPeriods(new Set());
        setFilledSlotIds(new Set());
        return;
      }
      setLoadingSlots(true);
      try {
        const [slotsRes, entriesRes] = await Promise.all([
          fetch(`/api/timetable/slots?dayOfWeek=${dayOfWeek}`),
          fetch(`/api/entries?from=${date}&to=${date}&limit=20`),
        ]);
        if (slotsRes.ok) setTimetableSlots(await slotsRes.json());
        if (entriesRes.ok) {
          const data = await entriesRes.json();
          const periods = new Set<number>();
          const slotIds = new Set<string>();
          for (const entry of data.entries || []) {
            if (entry.period && entry.status !== "DRAFT") periods.add(entry.period);
            if (entry.timetableSlotId && entry.status !== "DRAFT") slotIds.add(entry.timetableSlotId);
          }
          setFilledPeriods(periods);
          setFilledSlotIds(slotIds);
        }
      } catch {
        /* silently fail */
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
    setSelectedSlotIds([]);
    setTimetableSlotId(null);
    setPeriod("");
    setDuration("60");
  }, [date]);

  const assignedClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string; level: string }>();
    for (const a of assignments) {
      if (!classMap.has(a.class.id)) {
        classMap.set(a.class.id, { id: a.class.id, name: a.class.name, level: a.class.level });
      }
    }
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  const subjectsForClass = useMemo(() => {
    if (!classId) return [];
    return assignments
      .filter((a) => a.class.id === classId)
      .map((a) => ({
        id: a.subject.id,
        name: a.division ? `${a.subject.name} (${a.division.name})` : a.subject.name,
        code: a.subject.code,
        assignmentId: a.id,
      }));
  }, [assignments, classId]);

  const otherClassesForSubject = useMemo(() => {
    if (!subjectId || !classId) return [];
    return assignments
      .filter((a) => a.subject.id === subjectId && a.class.id !== classId)
      .map((a) => ({
        classId: a.class.id,
        className: a.class.name,
        assignmentId: a.id,
      }));
  }, [assignments, subjectId, classId]);

  useEffect(() => {
    if (subjectsForClass.length === 1) {
      setSubjectId(subjectsForClass[0].id);
      setAssignmentId(subjectsForClass[0].assignmentId);
    }
  }, [subjectsForClass]);

  const selectedClassLevel = useMemo(() => {
    return assignedClasses.find((c) => c.id === classId)?.level || "";
  }, [assignedClasses, classId]);

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

  const topicsForModule = useMemo(() => {
    if (!subjectId) return [];
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    const topicsToUse = filtered.length > 0 ? filtered : subject.topics;
    if (moduleName) return topicsToUse.filter((t) => t.moduleName === moduleName);
    return topicsToUse;
  }, [subjects, subjectId, selectedClassLevel, moduleName]);

  const topicsForModuleCount = useCallback((mod: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return 0;
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    const topicsToUse = filtered.length > 0 ? filtered : subject.topics;
    return topicsToUse.filter((t) => t.moduleName === mod).length;
  }, [subjects, subjectId, selectedClassLevel]);

  const selectedSlotsData = useMemo(() => {
    return selectedSlotIds
      .map((id) => timetableSlots.find((s) => s.id === id))
      .filter(Boolean) as TimetableSlot[];
  }, [selectedSlotIds, timetableSlots]);

  function handleSlotToggle(slot: TimetableSlot) {
    const pm = slot.periodLabel.match(/\d+/);
    const pNum = pm ? parseInt(pm[0]) : null;
    if (filledSlotIds.has(slot.id) || (pNum !== null && filledPeriods.has(pNum))) return;

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

      if (prev.length >= 4) return prev;

      if (prev.length > 0) {
        const existingSlot = timetableSlots.find((s) => s.id === prev[0]);
        if (existingSlot) {
          if (
            slot.assignment.classId !== existingSlot.assignment.classId ||
            slot.assignment.subjectId !== existingSlot.assignment.subjectId
          ) {
            setClassId(slot.assignment.classId);
            setSubjectId(slot.assignment.subjectId);
            setAssignmentId(slot.assignment.id);
            setTimetableSlotId(slot.id);
            setModuleName("");
            setTopicText("");
            setSelectedTopicIds([]);
            setAdditionalClassIds([]);
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

      if (prev.length === 0) {
        setClassId(slot.assignment.classId);
        setSubjectId(slot.assignment.subjectId);
        setAssignmentId(slot.assignment.id);
        setModuleName("");
        setTopicText("");
        setSelectedTopicIds([]);
        setAdditionalClassIds([]);
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

  const handleClassChange = useCallback((newClassId: string) => {
    setClassId(newClassId);
    setSubjectId("");
    setModuleName("");
    setTopicText("");
    setSelectedTopicIds([]);
    setAssignmentId(null);
    setSelectedSlotIds([]);
    setTimetableSlotId(null);
    setPeriod("");
    setDuration("60");
    setAdditionalClassIds([]);
  }, []);

  const handleSubjectChange = useCallback((value: string) => {
    setModuleName("");
    setTopicText("");
    setSelectedTopicIds([]);
    setAdditionalClassIds([]);
    const matchByAssignment = assignments.find((a) => a.id === value);
    if (matchByAssignment) {
      setSubjectId(matchByAssignment.subject.id);
      setAssignmentId(matchByAssignment.id);
    } else {
      setSubjectId(value);
      const match = assignments.find(
        (a) => a.class.id === classId && a.subject.id === value
      );
      if (match) setAssignmentId(match.id);
    }
    if (selectedSlotIds.length > 0) {
      setSelectedSlotIds([]);
      setTimetableSlotId(null);
    }
  }, [assignments, classId, selectedSlotIds]);

  const toggleAdditionalClass = useCallback((cId: string) => {
    setAdditionalClassIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  }, []);

  // Auto-populate Family of Situation from curriculum data
  const subjectCode = useMemo(() => {
    if (!subjectId) return "";
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.code || "";
  }, [subjects, subjectId]);

  const moduleNum = useMemo(() => {
    if (!moduleName) return 0;
    const match = moduleName.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }, [moduleName]);

  const autoFamilyOfSit = useMemo(() => {
    if (!subjectCode || !selectedClassLevel || !moduleNum) return null;
    return getFamilyOfSituation(subjectCode, selectedClassLevel, moduleNum);
  }, [subjectCode, selectedClassLevel, moduleNum]);

  // Update familyOfSituation when auto data changes (only if not manually edited)
  useEffect(() => {
    if (autoFamilyOfSit && !familyOfSitEditing) {
      setFamilyOfSituation(autoFamilyOfSit);
    }
  }, [autoFamilyOfSit, familyOfSitEditing]);

  // Fetch curriculum metadata (objectives) when module selection changes
  useEffect(() => {
    if (!subjectCode || !selectedClassLevel || !moduleNum) {
      setMetadataObjectives([]);
      return;
    }
    let cancelled = false;
    setLoadingMetadata(true);
    fetch(`/api/curriculum/metadata?subjectCode=${encodeURIComponent(subjectCode)}&classLevel=${encodeURIComponent(selectedClassLevel)}&moduleNum=${moduleNum}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setMetadataObjectives(data.objectives || []);
        // Auto-select all objectives and reset proportions
        if (data.objectives?.length > 0) {
          const defaultSelected: Record<string, string> = {};
          for (const obj of data.objectives) {
            defaultSelected[obj] = "all";
          }
          setSelectedObjectives(defaultSelected);
        } else {
          setSelectedObjectives({});
        }
      })
      .catch(() => {
        if (!cancelled) setMetadataObjectives([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMetadata(false);
      });
    return () => { cancelled = true; };
  }, [subjectCode, selectedClassLevel, moduleNum]);

  // Check for pending assignments when class is selected
  useEffect(() => {
    if (!classId || !subjectId) {
      setPendingAssignmentInfo(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/entries?classId=${classId}&limit=5&from=${new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]}&to=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const entries = data.entries || [];
        const recent = entries.find((e: { assignmentGiven?: boolean; assignmentDetails?: string; assignment?: { subjectId: string } }) =>
          e.assignmentGiven && e.assignment?.subjectId === subjectId
        );
        if (recent) {
          setPendingAssignmentInfo(recent.assignmentDetails || "Assignment was given");
        } else {
          setPendingAssignmentInfo(null);
        }
      })
      .catch(() => { if (!cancelled) setPendingAssignmentInfo(null); });
    return () => { cancelled = true; };
  }, [classId, subjectId, date]);

  const selectedDayName = date ? DAY_NAMES[getDayOfWeek(date)] || "" : "";
  const isWeekend = date ? getDayOfWeek(date) > 5 : false;
  const hasPeriodSelected = selectedSlotIds.length > 0 || period !== "";
  const isFormValid = date && classId && subjectId &&
    (classDidNotHold || selectedTopicIds.length > 0 || topicText.trim().length > 0) &&
    !isWeekend && hasPeriodSelected;
  const isDraftValid = date && classId && subjectId;
  const hasMultiSlots = selectedSlotIds.length > 1;
  const hasMultiClass = additionalClassIds.length > 0;

  const selectedPeriodNotEnded = useMemo(() => {
    const isToday = date === new Date().toISOString().split("T")[0];
    if (!isToday || selectedSlotsData.length === 0) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return selectedSlotsData.some((s) => {
      const [eh, em] = s.endTime.split(":").map(Number);
      return currentMins < eh * 60 + em;
    });
  }, [date, selectedSlotsData]);

  const contextClassName = assignedClasses.find((c) => c.id === classId)?.name || "";
  const contextSubjectName = subjectsForClass.find((s) => s.assignmentId === assignmentId || s.id === subjectId)?.name || "";
  const contextSlot = selectedSlotsData[0];
  const hasContext = classId && subjectId && hasPeriodSelected;

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault();
    if (asDraft ? !isDraftValid : !isFormValid) return;
    if (submitting || savingDraft) return;
    setError("");
    if (asDraft) setSavingDraft(true);
    else setSubmitting(true);

    try {
      const slotsToSubmit = selectedSlotsData.length > 0
        ? selectedSlotsData
        : [null];

      const createdEntries = [];
      const allClassIds = [classId, ...additionalClassIds];
      const allAssignmentIds = allClassIds.map((cId) => {
        const match = assignments.find((a) => a.class.id === cId && a.subject.id === subjectId);
        return match?.id || null;
      });

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

        const resolvedTopicText = topicText.trim()
          || selectedTopicIds.map((id) => topicsForModule.find((t) => t.id === id)?.name).filter(Boolean).join("; ")
          || null;

        const body: Record<string, unknown> = {
          date,
          classId: allClassIds[0],
          classIds: allClassIds.length > 1 ? allClassIds : undefined,
          assignmentId: entryAssignmentId || allAssignmentIds[0] || null,
          assignmentIds: allClassIds.length > 1 ? allAssignmentIds : undefined,
          timetableSlotId: entrySlotId || null,
          period: entryPeriod,
          duration: entryDuration,
          moduleName: moduleName || null,
          topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
          topicText: resolvedTopicText,
          notes: notes || null,
          objectives: Object.keys(selectedObjectives).length > 0
            ? Object.entries(selectedObjectives).map(([text, proportion]) => ({ text, proportion }))
            : (integrationActivity ? [{ text: integrationActivity, proportion: "all" as const }] : null),
          studentAttendance: studentAttendance ? parseInt(studentAttendance) : null,
          engagementLevel: engagementLevel || null,
          signatureData,
          // CBA fields
          familyOfSituation: familyOfSituation || null,
          bilingualActivity: bilingualActivity || false,
          bilingualType: bilingualActivity ? (bilingualType || null) : null,
          bilingualNote: bilingualActivity ? (bilingualNote || null) : null,
          integrationActivity: Object.keys(selectedObjectives).length > 0
            ? Object.keys(selectedObjectives).join("; ")
            : (integrationActivity || null),
          integrationLevel: integrationLevel || null,
          integrationStatus: integrationStatus || null,
          lessonMode: lessonMode || "physical",
          digitalTools: (lessonMode === "digital" || lessonMode === "hybrid") ? digitalTools : [],
          // Assignment tracking
          assignmentGiven: assignmentGiven || false,
          assignmentDetails: assignmentGiven ? (assignmentDetails || null) : null,
          assignmentReviewed: assignmentReviewed,
          status: asDraft ? "DRAFT" : "SUBMITTED",
          classDidNotHold: classDidNotHold || undefined,
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

        const result = await res.json();
        if (Array.isArray(result)) createdEntries.push(...result);
        else createdEntries.push(result);
      }

      setCompletionTime(seconds);
      const firstEntry = createdEntries[0];
      const baseSubjectName = firstEntry.assignment?.subject?.name ?? firstEntry.topics?.[0]?.subject?.name ?? "—";
      const divisionName = firstEntry.assignment?.division?.name;
      const subjectDisplayName = divisionName ? `${baseSubjectName} (${divisionName})` : baseSubjectName;
      const entryDate = new Date(firstEntry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

      const periodsList = createdEntries
        .filter((entry, idx, arr) => arr.findIndex((e) => e.period === entry.period && e.timetableSlotId === entry.timetableSlotId) === idx)
        .map((entry) => ({
          period: entry.timetableSlot?.periodLabel || (entry.period ? `Period ${entry.period}` : "—"),
          time: entry.timetableSlot ? `${entry.timetableSlot.startTime} - ${entry.timetableSlot.endTime}` : "—",
          duration: `${entry.duration} min`,
        }));

      const topicNames = selectedTopicIds
        .map((id) => topicsForModule.find((t) => t.id === id)?.name)
        .filter(Boolean) as string[];

      const classNames = Array.from(new Set(createdEntries.map((e) => e.class.name)));

      setSubmittedEntries({
        subject: subjectDisplayName,
        module: firstEntry.moduleName || "—",
        topic: firstEntry.topicText || firstEntry.topics?.[0]?.name || "—",
        topics: topicNames.length > 0 ? topicNames : (firstEntry.topics || []).map((t: { name: string }) => t.name),
        className: classNames.join(", "),
        classNames,
        date: entryDate,
        periods: periodsList,
        notes: firstEntry.notes || "",
        objectives: firstEntry.objectives || "",
        attendance: firstEntry.studentAttendance ? `${firstEntry.studentAttendance} students` : "",
        engagement: firstEntry.engagementLevel || "",
        isDraft: asDraft,
        classDidNotHold,
        // CBA
        familyOfSituation: familyOfSituation || "",
        bilingualActivity,
        bilingualType: bilingualType || "",
        lessonMode: lessonMode || "physical",
        integrationActivity: Object.keys(selectedObjectives).length > 0
          ? Object.keys(selectedObjectives).join("; ")
          : (integrationActivity || ""),
        assignmentGiven,
        assignmentDetails: assignmentDetails || "",
        assignmentReviewed,
      });

      if (asDraft) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      } else {
        setSuccess(true);
        clearInterval(timerRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  }

  function resetForm() {
    setStep(0);
    setDate(new Date().toISOString().split("T")[0]);
    setClassId("");
    setSubjectId("");
    setModuleName("");
    setTopicText("");
    setSelectedTopicIds([]);
    setPeriod("");
    setDuration("60");
    setNotes("");
    setObjectives("");
    setMetadataObjectives([]);
    setSelectedObjectives({});
    setCustomObjective("");
    setShowCustomObjectiveInput(false);
    setFamilyOfSitCustom(false);
    setStudentAttendance("");
    setEngagementLevel("");
    setSignatureData(null);
    setAssignmentId(null);
    setTimetableSlotId(null);
    setSelectedSlotIds([]);
    setAdditionalClassIds([]);
    setClassDidNotHold(false);
    // Reset CBA fields
    setFamilyOfSituation("");
    setFamilyOfSitEditing(false);
    setBilingualActivity(false);
    setBilingualType("");
    setBilingualNote("");
    setIntegrationActivity("");
    setIntegrationLevel("");
    setIntegrationStatus("");
    setLessonMode("physical");
    setDigitalTools([]);
    setAssignmentGiven(false);
    setAssignmentDetails("");
    setAssignmentReviewed(null);
    setPendingAssignmentInfo(null);
    setShowOptionalDetails(false);
    setSuccess(false);
    setSeconds(0);
    setError("");
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  // ─── Success Screen ─────────────────────────────────────────────
  if (success && submittedEntries) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className={`px-5 pt-12 pb-8 rounded-b-3xl ${
          submittedEntries.isDraft ? "bg-gradient-to-br from-amber-600 to-amber-500"
            : submittedEntries.classDidNotHold ? "bg-gradient-to-br from-slate-600 to-slate-500"
            : "bg-gradient-to-br from-emerald-600 to-emerald-500"
        }`}>
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-spring-bounce">
              {submittedEntries.isDraft ? <Save className="w-12 h-12 text-white" />
                : submittedEntries.classDidNotHold ? <XCircle className="w-12 h-12 text-white" />
                : <CheckCircle className="w-12 h-12 text-white" />}
            </div>
            <h1 className="text-2xl font-bold font-display text-white">
              {submittedEntries.isDraft ? "Draft Saved!"
                : submittedEntries.classDidNotHold ? "Period Marked"
                : submittedEntries.periods.length > 1 ? `${submittedEntries.periods.length} Entries Logged!`
                : "Entry Logged!"}
            </h1>
            {submittedEntries.classNames.length > 1 && (
              <p className="text-white/80 text-sm mt-1">Submitted for {submittedEntries.classNames.length} classes</p>
            )}
            <p className="text-white/70 mt-1 text-sm">
              Completed in <span className="font-bold text-white font-mono">{completionTime}s</span>
            </p>
          </div>
        </div>

        <div className="px-5 -mt-4 max-w-lg mx-auto w-full flex-1">
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
              <p className="text-white font-bold text-base">{submittedEntries.subject}</p>
              <p className="text-white/70 text-xs">{submittedEntries.className} &middot; {submittedEntries.date}</p>
            </div>
            <div className="p-5 space-y-0 divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              {submittedEntries.isDraft && (
                <div className="pb-3">
                  <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                    <Save className="w-4 h-4" />
                    Saved as draft — complete this entry later
                  </div>
                </div>
              )}
              {submittedEntries.classDidNotHold && (
                <div className="pb-3">
                  <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                    <XCircle className="w-4 h-4" />
                    Marked as &ldquo;Class Did Not Hold&rdquo;
                  </div>
                </div>
              )}
              {!submittedEntries.classDidNotHold && (
                <div className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--accent-light)" }}>
                      <Layers className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Module</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{submittedEntries.module}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--success-light)" }}>
                      <BookOpen className="w-4 h-4" style={{ color: "var(--success)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                        {submittedEntries.topics.length > 1 ? `Topics (${submittedEntries.topics.length})` : "Topic"}
                      </p>
                      {submittedEntries.topics.length > 0 ? (
                        <ul className="mt-1 space-y-1">
                          {submittedEntries.topics.map((t, i) => (
                            <li key={i} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm font-medium text-[var(--text-primary)]">{submittedEntries.topic}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="py-3">
                {submittedEntries.periods.length > 1 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                    <Check className="w-3 h-3" />
                    {submittedEntries.periods.length} periods filled at once
                  </p>
                )}
                <div className="space-y-2">
                  {submittedEntries.periods.map((p, i) => (
                    <div key={i} className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Calendar, label: "Period", value: p.period },
                        { icon: Clock, label: "Time", value: p.time },
                        { icon: Clock, label: "Duration", value: p.duration },
                      ].map((cell) => (
                        <div key={cell.label} className="text-center rounded-xl py-2.5 px-2" style={{ background: "var(--bg-tertiary)" }}>
                          <cell.icon className="w-4 h-4 mx-auto mb-1 text-[var(--text-tertiary)]" />
                          <p className="text-[10px] text-[var(--text-tertiary)] font-medium">{cell.label}</p>
                          <p className="text-xs font-bold text-[var(--text-primary)]">{cell.value}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {submittedEntries.classNames.length > 1 && (
                <div className="py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Classes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {submittedEntries.classNames.map((cn, i) => (
                      <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg border" style={{ background: "var(--accent-light)", color: "var(--accent-text)", borderColor: "var(--accent)" }}>{cn}</span>
                    ))}
                  </div>
                </div>
              )}
              {(submittedEntries.attendance || submittedEntries.engagement) && (
                <div className="py-3">
                  <div className="grid grid-cols-2 gap-3">
                    {submittedEntries.attendance && (
                      <div className="text-center rounded-xl py-2.5 px-2" style={{ background: "var(--bg-tertiary)" }}>
                        <p className="text-[10px] text-[var(--text-tertiary)] font-medium">Attendance</p>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{submittedEntries.attendance}</p>
                      </div>
                    )}
                    {submittedEntries.engagement && (
                      <div className="text-center rounded-xl py-2.5 px-2" style={{ background: "var(--bg-tertiary)" }}>
                        <p className="text-[10px] text-[var(--text-tertiary)] font-medium">Engagement</p>
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          {submittedEntries.engagement.charAt(0) + submittedEntries.engagement.slice(1).toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* CBA fields summary */}
              {(submittedEntries.familyOfSituation || submittedEntries.bilingualActivity || submittedEntries.integrationActivity || submittedEntries.lessonMode !== "physical") && (
                <div className="py-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">CBA Details</p>
                  <div className="flex flex-wrap gap-2">
                    {submittedEntries.familyOfSituation && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "var(--bg-tertiary)" }}>
                        <p className="text-[10px] text-[var(--text-tertiary)]">Family of Situation</p>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{submittedEntries.familyOfSituation}</p>
                      </div>
                    )}
                    {submittedEntries.lessonMode !== "physical" && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "var(--bg-tertiary)" }}>
                        <p className="text-[10px] text-[var(--text-tertiary)]">Lesson Mode</p>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{submittedEntries.lessonMode.charAt(0).toUpperCase() + submittedEntries.lessonMode.slice(1)}</p>
                      </div>
                    )}
                    {submittedEntries.bilingualActivity && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "#FFFBEB" }}>
                        <p className="text-[10px] text-amber-600">Bilingual Activity</p>
                        <p className="text-xs font-semibold text-amber-700">
                          {submittedEntries.bilingualType ? submittedEntries.bilingualType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Yes"}
                        </p>
                      </div>
                    )}
                    {submittedEntries.integrationActivity && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "var(--bg-tertiary)" }}>
                        <p className="text-[10px] text-[var(--text-tertiary)]">Integration</p>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">Learners are able to {submittedEntries.integrationActivity}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Assignment tracking summary */}
              {(submittedEntries.assignmentGiven || submittedEntries.assignmentReviewed !== null) && (
                <div className="py-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Assignment</p>
                  <div className="flex flex-wrap gap-2">
                    {submittedEntries.assignmentGiven && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "var(--accent-light)" }}>
                        <p className="text-[10px]" style={{ color: "var(--accent-text)" }}>Given</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
                          {submittedEntries.assignmentDetails || "Yes"}
                        </p>
                      </div>
                    )}
                    {submittedEntries.assignmentReviewed === true && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "#DCFCE7" }}>
                        <p className="text-[10px] text-emerald-600">Previous Assignment</p>
                        <p className="text-xs font-semibold text-emerald-700">Reviewed</p>
                      </div>
                    )}
                    {submittedEntries.assignmentReviewed === false && (
                      <div className="rounded-xl py-2 px-3" style={{ background: "#FEE2E2" }}>
                        <p className="text-[10px] text-red-600">Previous Assignment</p>
                        <p className="text-xs font-semibold text-red-700">Not reviewed</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3 pb-8">
            <button onClick={resetForm} className="btn-primary text-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
              New Entry
            </button>
            <Link href="/logbook" className="btn-secondary block text-center">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3-Step Entry Form ──────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── Persistent Header ─── */}
      <div className="bg-[var(--bg-elevated)] border-b" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-lg mx-auto px-5 pt-12 pb-5 desktop-content-form">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : router.back()}
              className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-colors"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1">
              New Entry
            </h1>
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-mono font-bold tabular-nums ${
                seconds > 60 ? "border-amber-300 text-amber-700" : ""
              }`}
              style={{
                ...(seconds <= 60 ? { borderColor: "var(--border-primary)", color: "var(--text-tertiary)" } : {}),
                ...(seconds > 60 ? { background: "var(--accent-light)" } : {}),
              }}
            >
              <Clock className="w-3 h-3" />
              {seconds}s
            </div>
          </div>

          {hasContext && (
            <div
              className="flex items-center gap-3 mb-4 animate-slide-up"
              style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", borderRadius: "14px", padding: "14px 16px" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase" style={{ color: "#92400E", letterSpacing: "0.06em" }}>
                  Auto-filled from timetable
                </p>
                <p className="text-[15px] font-bold text-[var(--text-primary)] mt-1 truncate">
                  {contextSubjectName} — {contextClassName}
                </p>
                <p className="text-xs font-mono mt-0.5 text-[var(--text-secondary)]">
                  {selectedDayName}
                  {contextSlot && ` \u00B7 ${contextSlot.periodLabel} \u00B7 ${contextSlot.startTime}\u2013${contextSlot.endTime}`}
                  {hasMultiSlots && ` (+${selectedSlotIds.length - 1} more)`}
                </p>
              </div>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.5)", color: "#D97706" }}
              >
                <Zap className="w-5 h-5" />
              </div>
            </div>
          )}

          {(() => {
            const isToday = date === new Date().toISOString().split("T")[0];
            if (isToday && selectedSlotsData.length > 0) {
              const now = new Date();
              const currentMins = now.getHours() * 60 + now.getMinutes();
              const unendedSlot = selectedSlotsData.find((s) => {
                const [eh, em] = s.endTime.split(":").map(Number);
                return currentMins < eh * 60 + em;
              });
              if (unendedSlot) {
                return (
                  <div className="flex items-center gap-2 mb-3 animate-slide-up" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", padding: "12px" }}>
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#B45309" }} />
                    <p className="text-xs font-medium" style={{ color: "#B45309" }}>
                      This period hasn&apos;t ended yet. You can save as draft now and submit after {unendedSlot.endTime}.
                    </p>
                  </div>
                );
              }
            }
            return null;
          })()}

          <div className="flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="h-1 w-full rounded-full transition-all duration-300"
                  style={{
                    background: i <= step
                      ? "linear-gradient(90deg, var(--accent), var(--accent-warm))"
                      : "var(--bg-tertiary)",
                  }}
                />
                <span
                  className={`text-[11px] ${
                    i === step ? "font-bold text-[var(--text-primary)]" : "font-medium text-[var(--text-tertiary)]"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─── */}
      <div className="px-5 mt-4 max-w-lg mx-auto desktop-content-form">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto font-semibold underline text-xs">Dismiss</button>
          </div>
        )}

        {draftSaved && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
            <Save className="w-4 h-4" />
            Draft saved! You can complete this entry later.
          </div>
        )}

        {loadingData ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton h-3 w-20 mb-2" />
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="card p-6 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--accent)" }} />
            <p className="font-medium text-[var(--text-primary)]">No assignments yet</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Your school administrator needs to assign you to classes and subjects before you can create logbook entries.
            </p>
            <Link href="/timetable" className="text-sm font-medium mt-3 inline-block" style={{ color: "var(--accent-text)" }}>View My Timetable</Link>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} onKeyDown={(e) => { if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault(); }}>

            {/* ══ STEP 0 — Module ══ */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label-field">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="input-field" required />
                  {date && !isWeekend && <p className="text-xs mt-1 font-medium" style={{ color: "var(--accent-text)" }}>{selectedDayName}</p>}
                  {isWeekend && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>Weekend — select a weekday</p>}
                </div>

                {!loadingSlots && timetableSlots.length > 0 && (
                  <div>
                    <label className="label-field flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} />
                      {selectedDayName} Schedule — Tap to Fill
                    </label>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-2">Select up to 4 periods (same subject and level)</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {timetableSlots.map((slot) => {
                        const periodMatch = slot.periodLabel.match(/\d+/);
                        const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
                        const isAlreadyFilled = filledSlotIds.has(slot.id) || (periodNum !== null && filledPeriods.has(periodNum));
                        const isToday = date === new Date().toISOString().split("T")[0];
                        const now = new Date();
                        const [slotEndH, slotEndM] = slot.endTime.split(":").map(Number);
                        const periodNotEnded = isToday && (now.getHours() * 60 + now.getMinutes()) < (slotEndH * 60 + slotEndM);
                        const isSelected = selectedSlotIds.includes(slot.id);
                        const canAdd = (selectedSlotIds.length < 4 || isSelected) && !isAlreadyFilled && !periodNotEnded;
                        const isCompatible = selectedSlotIds.length === 0 || isSelected ||
                          (selectedSlotsData.length > 0 &&
                            slot.assignment.subjectId === selectedSlotsData[0].assignment.subjectId &&
                            slot.assignment.classLevel === selectedSlotsData[0].assignment.classLevel);
                        const incompatibleReason = !isCompatible && selectedSlotsData.length > 0
                          ? (slot.assignment.subjectId !== selectedSlotsData[0].assignment.subjectId ? "Different subject" : "Different level")
                          : null;
                        return (
                          <button key={slot.id} type="button" onClick={() => !isAlreadyFilled && !periodNotEnded && handleSlotToggle(slot)} disabled={isAlreadyFilled || periodNotEnded}
                            className={`flex-shrink-0 rounded-2xl border-2 px-3 py-2.5 text-left transition-all relative ${
                              isAlreadyFilled || periodNotEnded ? "opacity-60 cursor-not-allowed" : isSelected ? "shadow-sm" : !canAdd || !isCompatible ? "opacity-40" : "hover:border-[var(--text-quaternary)]"
                            }`}
                            style={{
                              borderColor: isAlreadyFilled ? "var(--success)" : isSelected ? "var(--accent)" : "var(--border-primary)",
                              background: isAlreadyFilled ? "var(--success-light)" : isSelected ? "var(--accent-light)" : "var(--bg-elevated)",
                            }}>
                            {isAlreadyFilled && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ background: "var(--success)" }}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {isSelected && !isAlreadyFilled && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ background: "var(--accent)" }}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <p className="text-xs font-bold text-[var(--text-primary)]">{slot.periodLabel}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 font-mono">{slot.startTime} - {slot.endTime}</p>
                            <p className="text-[11px] font-semibold mt-1.5" style={{ color: "var(--accent-text)" }}>{slot.assignment.subjectName}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{shortClassName(slot.assignment.className)}</p>
                            {isAlreadyFilled && <p className="text-[9px] font-bold mt-1" style={{ color: "var(--success)" }}>Already filled</p>}
                            {periodNotEnded && !isAlreadyFilled && (
                              <p className="text-[9px] font-bold mt-1 flex items-center gap-0.5" style={{ color: "#92400E" }}>
                                <Clock className="w-2.5 h-2.5" />
                                Available at {slot.endTime}
                              </p>
                            )}
                            {incompatibleReason && !isAlreadyFilled && !periodNotEnded && (
                              <p className="text-[9px] font-medium mt-1" style={{ color: "var(--text-quaternary)" }}>{incompatibleReason}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {loadingSlots && (
                  <div className="flex gap-2">
                    {[1, 2].map((i) => (<div key={i} className="flex-shrink-0 w-28 h-20 rounded-xl skeleton" />))}
                  </div>
                )}

                {selectedSlotIds.length === 0 && !loadingSlots && (
                  <div>
                    <label className="label-field">Period <span style={{ color: "var(--warning)" }}>*</span></label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field" required>
                      <option value="">Select period</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                        <option key={p} value={p} disabled={filledPeriods.has(p)}>Period {p}{filledPeriods.has(p) ? " (filled)" : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedSlotIds.length === 0 && (
                  <div>
                    <label className="label-field">Class <span style={{ color: "var(--warning)" }}>*</span></label>
                    <select value={classId} onChange={(e) => handleClassChange(e.target.value)} className="input-field" required>
                      <option value="">Select class</option>
                      {assignedClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                )}

                {!loadingSlots && timetableSlots.length === 0 && !isWeekend && date && (
                  <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">No classes on {selectedDayName}</p>
                      <p className="mt-0.5">Select a day you have classes.</p>
                    </div>
                  </div>
                )}

                {selectedSlotIds.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">Class</label>
                      <div className="input-field flex items-center text-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>{contextClassName || "—"}</div>
                    </div>
                    <div>
                      <label className="label-field">Subject</label>
                      <div className="input-field flex items-center text-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>{contextSubjectName || "—"}</div>
                    </div>
                  </div>
                )}

                {classId && selectedSlotIds.length === 0 && (
                  <div>
                    <label className="label-field">Subject <span style={{ color: "var(--warning)" }}>*</span></label>
                    {subjectsForClass.length === 1 ? (
                      <div className="input-field flex items-center" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>{subjectsForClass[0].name}</div>
                    ) : (
                      <select value={assignmentId || subjectId} onChange={(e) => handleSubjectChange(e.target.value)} className="input-field" required>
                        <option value="">Select subject</option>
                        {subjectsForClass.map((s) => (<option key={s.assignmentId} value={s.assignmentId}>{s.name}</option>))}
                      </select>
                    )}
                  </div>
                )}

                {subjectId && hasPeriodSelected && (
                  <button type="button" onClick={() => setClassDidNotHold(!classDidNotHold)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: classDidNotHold ? "var(--warning)" : "var(--border-primary)",
                      background: classDidNotHold ? "var(--warning-light)" : "var(--bg-elevated)",
                    }}>
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: classDidNotHold ? "var(--warning)" : "var(--border-primary)", background: classDidNotHold ? "var(--warning)" : "var(--bg-elevated)" }}>
                      {classDidNotHold && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${classDidNotHold ? "text-[var(--warning)]" : "text-[var(--text-secondary)]"}`}>Class did not hold</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">Mark if the class was cancelled</p>
                    </div>
                  </button>
                )}

                {subjectId && !classDidNotHold && modules.length > 0 && (
                  <div>
                    <p className="text-[13px] text-[var(--text-tertiary)] mb-3">Select the module you taught:</p>
                    <div className="flex flex-col gap-2">
                      {modules.map((mod, i) => {
                        const topicCount = topicsForModuleCount(mod);
                        return (
                          <button key={mod} type="button"
                            onClick={() => { setModuleName(mod); setSelectedTopicIds([]); setStep(1); }}
                            className="flex items-center gap-3.5 p-4 border text-left transition-all active:scale-[0.98] hover:-translate-y-0.5"
                            style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)", boxShadow: "var(--shadow-card)", borderRadius: "16px" }}>
                            <div className="w-10 h-10 flex items-center justify-center font-display text-base font-bold flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: "#92400E", borderRadius: "12px" }}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{mod}</p>
                              {topicCount > 0 && (
                                <p className="text-xs text-[var(--text-tertiary)]">{topicCount} topics</p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {subjectId && !classDidNotHold && modules.length === 0 && hasPeriodSelected && (
                  <button type="button" onClick={() => setStep(1)}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "var(--shadow-accent)" }}>
                    Continue to Topic
                  </button>
                )}

                {classDidNotHold && hasPeriodSelected && (
                  <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
                    {submitting ? "Submitting..." : "Mark as Class Did Not Hold"}
                  </button>
                )}
              </div>
            )}

            {/* ══ STEP 1 — Topic ══ */}
            {step === 1 && (
              <div className="space-y-4 animate-slide-in-right">
                {moduleName && (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold"
                    style={{ background: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E", borderRadius: "10px", padding: "6px 12px" }}>
                    <Layers className="w-3 h-3" />
                    {moduleName}
                  </div>
                )}

                <p className="text-[13px] text-[var(--text-tertiary)]">
                  {topicsForModule.length > 0 ? "Additional notes on topic (optional)" : "What topic did you cover?"}
                </p>

                <div className="border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)", borderRadius: "16px" }}>
                  <input value={topicText} onChange={(e) => setTopicText(e.target.value.slice(0, 300))}
                    placeholder="e.g. Laws of reflection, image formation..."
                    className="w-full px-4 py-3.5 border-none outline-none text-[15px] bg-transparent"
                    style={{ color: "var(--text-primary)" }} maxLength={300} />
                </div>
                {topicText.length > 0 && <p className="text-xs text-[var(--text-tertiary)] text-right">{topicText.length}/300</p>}

                {topicsForModule.length > 0 && (
                  <>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                      {contextSubjectName} {selectedClassLevel}{moduleName ? ` · ${moduleName}` : ""} · {topicsForModule.length} topics in syllabus
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-[var(--text-tertiary)]" style={{ letterSpacing: "0.06em" }}>Or select from curriculum</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topicsForModule.map((topic) => {
                        const isSel = selectedTopicIds.includes(topic.id);
                        return (
                          <button key={topic.id} type="button"
                            onClick={() => {
                              if (isSel) {
                                setSelectedTopicIds((prev) => prev.filter((id) => id !== topic.id));
                              } else {
                                setSelectedTopicIds((prev) => [...prev, topic.id]);
                                setTopicText(topic.name);
                              }
                            }}
                            className="text-sm transition-all"
                            style={{
                              background: isSel ? "var(--accent-light)" : "var(--bg-elevated)",
                              border: isSel ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                              color: isSel ? "var(--accent-text)" : "var(--text-secondary)",
                              borderRadius: "12px",
                              padding: "8px 16px",
                              fontWeight: isSel ? 600 : 500,
                            }}>
                            {topic.name}
                          </button>
                        );
                      })}
                    </div>
                    {topicText.length > 0 && selectedTopicIds.length === 0 && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "#D97706",
                        background: "#FFFBEB",
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        Tip: Selecting topics from the curriculum above helps your school track syllabus progress.
                      </div>
                    )}
                  </>
                )}

                {/* Multi-class option — power feature below topic selection */}
                {subjectId && otherClassesForSubject.length > 0 && (
                  <div>
                    <label className="label-field flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-violet-500" />
                      Also submit for other classes?
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {otherClassesForSubject.map((oc) => {
                        const isSel = additionalClassIds.includes(oc.classId);
                        return (
                          <button key={oc.classId} type="button" onClick={() => toggleAdditionalClass(oc.classId)}
                            className="text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all"
                            style={{
                              borderColor: isSel ? "var(--accent)" : "var(--border-primary)",
                              background: isSel ? "var(--accent-light)" : "var(--bg-elevated)",
                              color: isSel ? "var(--accent-text)" : "var(--text-secondary)",
                            }}>
                            {isSel && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {oc.className}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="button" onClick={() => setStep(2)}
                  disabled={!topicText.trim() && selectedTopicIds.length === 0}
                  className="w-full font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: (topicText.trim() || selectedTopicIds.length > 0) ? "linear-gradient(135deg, var(--accent), var(--accent-hover))" : "var(--bg-tertiary)",
                    color: (topicText.trim() || selectedTopicIds.length > 0) ? "#FFF" : "var(--text-tertiary)",
                    boxShadow: (topicText.trim() || selectedTopicIds.length > 0) ? "var(--shadow-accent)" : "none",
                    padding: "16px",
                    borderRadius: "16px",
                  }}>
                  Continue
                </button>
              </div>
            )}

            {/* ══ STEP 2 — Details & Submit ══ */}
            {step === 2 && (
              <div className="space-y-4 animate-slide-in-right">
                <div className="border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "16px", padding: "16px" }}>
                  {[
                    ["Subject", contextSubjectName],
                    ["Class", contextClassName + (additionalClassIds.length > 0 ? ` (+${additionalClassIds.length})` : "")],
                    ["Module", moduleName || "—"],
                    ["Topic", topicText || selectedTopicIds.map((id) => topicsForModule.find((t) => t.id === id)?.name).filter(Boolean).join(", ") || "—"],
                  ].map(([label, value], idx) => (
                    <div key={label} className="flex justify-between py-2" style={{ borderBottom: idx < 3 ? "1px solid #F5F5F4" : "none" }}>
                      <span className="text-[13px] text-[var(--text-tertiary)]">{label}</span>
                      <span className="text-[13px] font-semibold text-[var(--text-primary)] text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* ── CBA: Family of Situation ── */}
                {moduleName && (
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Family of Situation</p>
                    {familyOfSitCustom ? (
                      <div className="flex gap-2">
                        <input
                          value={familyOfSituation}
                          onChange={(e) => { setFamilyOfSituation(e.target.value); setFamilyOfSitEditing(true); }}
                          placeholder="Type custom family of situation..."
                          className="input-field text-sm flex-1"
                          maxLength={200}
                        />
                        <button type="button" onClick={() => {
                          setFamilyOfSitCustom(false);
                          if (autoFamilyOfSit) { setFamilyOfSituation(autoFamilyOfSit); setFamilyOfSitEditing(false); }
                        }}
                          className="text-xs font-medium px-3 rounded-xl"
                          style={{ color: "var(--accent-text)", background: "var(--accent-light)" }}>
                          Back
                        </button>
                      </div>
                    ) : (
                      <select
                        value={familyOfSituation}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setFamilyOfSitCustom(true);
                            setFamilyOfSituation("");
                            setFamilyOfSitEditing(true);
                          } else {
                            setFamilyOfSituation(e.target.value);
                            setFamilyOfSitEditing(e.target.value !== autoFamilyOfSit);
                          }
                        }}
                        className="input-field text-sm w-full"
                        style={{ color: familyOfSituation ? "var(--text-primary)" : "var(--text-tertiary)" }}
                      >
                        <option value="">Select family of situation...</option>
                        {autoFamilyOfSit && (
                          <option value={autoFamilyOfSit}>{autoFamilyOfSit} (auto)</option>
                        )}
                        {[
                          "Social and family environment",
                          "Economic activity",
                          "Health and well-being",
                          "Technology in daily life",
                          "Environment and sustainable development",
                          "Industry and technology",
                          "Matter and measurement in daily life",
                          "Energy in the environment",
                          "Matter in daily life",
                          "Social and economic environment",
                          "Health and environment",
                        ].filter((f) => f !== autoFamilyOfSit).map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                        <option value="__custom__">Custom...</option>
                      </select>
                    )}
                  </div>
                )}

                {/* ── CBA: Learning Objectives Achieved ── */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Learning Objectives Achieved</p>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-[var(--text-tertiary)] cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 text-[11px] rounded-lg px-3 py-2 z-10"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", boxShadow: "var(--shadow-card)" }}>
                        What can learners demonstrate after this lesson?
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Select what learners demonstrated in this lesson
                  </p>

                  {metadataObjectives.length > 0 ? (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}>
                      <div className="max-h-[200px] overflow-y-auto">
                        {metadataObjectives.map((obj) => {
                          const isSelected = obj in selectedObjectives;
                          const proportion = selectedObjectives[obj] || "all";
                          return (
                            <div
                              key={obj}
                              className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0"
                              style={{ borderColor: "var(--border-secondary)" }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedObjectives((prev) => {
                                    const next = { ...prev };
                                    if (isSelected) { delete next[obj]; } else { next[obj] = "all"; }
                                    return next;
                                  });
                                }}
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                  borderColor: isSelected ? "var(--accent)" : "var(--border-primary)",
                                  background: isSelected ? "var(--accent)" : "var(--bg-elevated)",
                                }}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>
                              <span className="text-[13px] flex-1 min-w-0" style={{ color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                                {obj}
                              </span>
                              {isSelected && (
                                <select
                                  value={proportion}
                                  onChange={(e) => setSelectedObjectives((prev) => ({ ...prev, [obj]: e.target.value }))}
                                  className="text-[10px] font-semibold border rounded-lg px-1.5 py-1 bg-transparent"
                                  style={{ borderColor: "var(--border-primary)", color: "var(--accent-text)", minWidth: 52 }}
                                >
                                  <option value="all">All</option>
                                  <option value="most">Most</option>
                                  <option value="some">Some</option>
                                  <option value="few">Few</option>
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Add custom objective */}
                      <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                        {showCustomObjectiveInput ? (
                          <div className="flex gap-2">
                            <input
                              value={customObjective}
                              onChange={(e) => setCustomObjective(e.target.value)}
                              placeholder="describe what learners can do..."
                              className="flex-1 text-[13px] bg-transparent outline-none"
                              style={{ color: "var(--text-primary)" }}
                              maxLength={200}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && customObjective.trim()) {
                                  e.preventDefault();
                                  const text = customObjective.trim();
                                  setMetadataObjectives((prev) => [...prev, text]);
                                  setSelectedObjectives((prev) => ({ ...prev, [text]: "all" }));
                                  setCustomObjective("");
                                  setShowCustomObjectiveInput(false);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customObjective.trim()) {
                                  const text = customObjective.trim();
                                  setMetadataObjectives((prev) => [...prev, text]);
                                  setSelectedObjectives((prev) => ({ ...prev, [text]: "all" }));
                                  setCustomObjective("");
                                }
                                setShowCustomObjectiveInput(false);
                              }}
                              className="text-xs font-semibold px-2 py-1 rounded-lg"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {customObjective.trim() ? "Add" : "Cancel"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowCustomObjectiveInput(true)}
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "var(--accent-text)" }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add custom objective
                          </button>
                        )}
                      </div>
                    </div>
                  ) : loadingMetadata ? (
                    <div className="rounded-2xl border px-4 py-3 animate-pulse" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}>
                      <div className="h-3 rounded w-3/4 mb-2" style={{ backgroundColor: "var(--bg-tertiary)" }} />
                      <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--bg-tertiary)" }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}>
                      <span className="text-sm font-medium text-[var(--text-tertiary)] pl-4 flex-shrink-0 whitespace-nowrap">Learners are able to</span>
                      <input
                        value={integrationActivity}
                        onChange={(e) => setIntegrationActivity(e.target.value.slice(0, 500))}
                        placeholder="...identify and name measuring instruments"
                        className="flex-1 px-2 py-3.5 border-none outline-none text-sm bg-transparent"
                        style={{ color: "var(--text-primary)" }}
                        maxLength={500}
                      />
                    </div>
                  )}

                  {/* Integration difficulty & status — shown when objectives are selected or free text entered */}
                  {(Object.keys(selectedObjectives).length > 0 || integrationActivity) && (
                    <div className="flex gap-3 mt-2">
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1.5">Difficulty</p>
                        <div className="flex gap-1">
                          {(["basic", "intermediate", "advanced"] as const).map((lvl) => (
                            <button key={lvl} type="button" onClick={() => setIntegrationLevel(integrationLevel === lvl ? "" : lvl)}
                              className="flex-1 py-2 text-xs font-semibold transition-all"
                              style={{
                                background: integrationLevel === lvl ? "var(--accent-light)" : "var(--bg-tertiary)",
                                color: integrationLevel === lvl ? "var(--accent-text)" : "var(--text-tertiary)",
                                borderRadius: "10px",
                              }}>
                              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1.5">Status</p>
                        <div className="flex gap-1">
                          {([["completed", "Done"], ["partial", "Partial"], ["carried_over", "Carried"]] as const).map(([val, label]) => (
                            <button key={val} type="button" onClick={() => setIntegrationStatus(integrationStatus === val ? "" : val)}
                              className="flex-1 py-2 text-xs font-semibold transition-all"
                              style={{
                                background: integrationStatus === val ? "var(--accent-light)" : "var(--bg-tertiary)",
                                color: integrationStatus === val ? "var(--accent-text)" : "var(--text-tertiary)",
                                borderRadius: "10px",
                              }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── CBA: Bilingual Activity ── */}
                <div>
                  <button type="button" onClick={() => setBilingualActivity(!bilingualActivity)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: bilingualActivity ? "#F59E0B" : "var(--border-primary)",
                      background: bilingualActivity ? "#FFFBEB" : "var(--bg-elevated)",
                    }}>
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: bilingualActivity ? "#F59E0B" : "var(--border-primary)", background: bilingualActivity ? "#F59E0B" : "var(--bg-elevated)" }}>
                      {bilingualActivity && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${bilingualActivity ? "text-amber-700" : "text-[var(--text-secondary)]"}`}>
                        <Globe className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                        Bilingual activity conducted
                      </p>
                    </div>
                  </button>
                  {bilingualActivity && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      <div className="flex flex-wrap gap-1.5">
                        {([["game", "Game"], ["discussion", "Discussion"], ["quiz", "Quiz"], ["role_play", "Role Play"], ["exercise", "Exercise"], ["translation", "Translation"], ["song", "Song/Poem"]] as const).map(([val, label]) => (
                          <button key={val} type="button" onClick={() => setBilingualType(bilingualType === val ? "" : val)}
                            className="text-sm transition-all"
                            style={{
                              background: bilingualType === val ? "var(--accent-light)" : "var(--bg-elevated)",
                              border: bilingualType === val ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                              color: bilingualType === val ? "var(--accent-text)" : "var(--text-secondary)",
                              borderRadius: "12px",
                              padding: "8px 16px",
                              fontWeight: bilingualType === val ? 600 : 500,
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={bilingualNote}
                        onChange={(e) => setBilingualNote(e.target.value.slice(0, 200))}
                        placeholder="Brief description (optional)"
                        className="input-field text-sm"
                        maxLength={200}
                      />
                    </div>
                  )}
                </div>

                {/* ── CBA: Lesson Mode ── */}
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Lesson Mode</p>
                  <div className="flex gap-1">
                    {([["physical", "Physical", null], ["digital", "Digital", Monitor], ["hybrid", "Hybrid", Smartphone]] as const).map(([val, label, Icon]) => (
                      <button key={val} type="button" onClick={() => { setLessonMode(val); if (val === "physical") setDigitalTools([]); }}
                        className="flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                        style={{
                          background: lessonMode === val ? "var(--accent-light)" : "var(--bg-tertiary)",
                          color: lessonMode === val ? "var(--accent-text)" : "var(--text-tertiary)",
                          borderRadius: "12px",
                        }}>
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                  {(lessonMode === "digital" || lessonMode === "hybrid") && (
                    <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
                      {["Projector", "YouTube", "Zoom/Google Meet", "WhatsApp", "PowerPoint", "Phone/Tablet", "Smart Board", "Other"].map((tool) => {
                        const isSelected = digitalTools.includes(tool);
                        return (
                          <button key={tool} type="button"
                            onClick={() => setDigitalTools((prev) => isSelected ? prev.filter((t) => t !== tool) : [...prev, tool])}
                            className="text-sm transition-all"
                            style={{
                              background: isSelected ? "var(--accent-light)" : "var(--bg-elevated)",
                              border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                              color: isSelected ? "var(--accent-text)" : "var(--text-secondary)",
                              borderRadius: "12px",
                              padding: "8px 14px",
                              fontWeight: isSelected ? 600 : 500,
                            }}>
                            {isSelected && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {tool}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Assignment Reminder Banner ── */}
                {pendingAssignmentInfo && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border-2 animate-fade-in"
                    style={{ borderColor: "#F59E0B", background: "#FFFBEB" }}>
                    <ClipboardList className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-700">Previous assignment pending</p>
                      <p className="text-xs text-amber-600 mt-0.5">{pendingAssignmentInfo}</p>
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setAssignmentReviewed(true)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: assignmentReviewed === true ? "#DCFCE7" : "#FEF3C7",
                            color: assignmentReviewed === true ? "#16A34A" : "#92400E",
                            border: assignmentReviewed === true ? "1px solid #86EFAC" : "1px solid #FDE68A",
                          }}>
                          {assignmentReviewed === true && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                          Reviewed
                        </button>
                        <button type="button" onClick={() => setAssignmentReviewed(false)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: assignmentReviewed === false ? "#FEE2E2" : "#FEF3C7",
                            color: assignmentReviewed === false ? "#DC2626" : "#92400E",
                            border: assignmentReviewed === false ? "1px solid #FCA5A5" : "1px solid #FDE68A",
                          }}>
                          {assignmentReviewed === false && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                          Not reviewed
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Assignment Given Toggle ── */}
                <div>
                  <button type="button" onClick={() => setAssignmentGiven(!assignmentGiven)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: assignmentGiven ? "var(--accent)" : "var(--border-primary)",
                      background: assignmentGiven ? "var(--accent-light)" : "var(--bg-elevated)",
                    }}>
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: assignmentGiven ? "var(--accent)" : "var(--border-primary)", background: assignmentGiven ? "var(--accent)" : "var(--bg-elevated)" }}>
                      {assignmentGiven && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${assignmentGiven ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)]"}`}>
                        <ClipboardList className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                        Assignment given
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">Did you give homework or an assignment?</p>
                    </div>
                  </button>
                  {assignmentGiven && (
                    <div className="mt-2 animate-fade-in">
                      <input
                        value={assignmentDetails}
                        onChange={(e) => setAssignmentDetails(e.target.value.slice(0, 300))}
                        placeholder="Brief details (optional) — e.g. Exercise 3, page 45..."
                        className="input-field text-sm"
                        maxLength={300}
                      />
                    </div>
                  )}
                </div>

                <div className="border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)", borderRadius: "16px" }}>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                    placeholder="Optional notes — observations, challenges..." rows={3}
                    className="w-full px-4 py-3.5 border-none outline-none text-sm bg-transparent resize-none"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }} maxLength={500} />
                </div>

                {/* ── Collapsible Optional Details ── */}
                <button type="button" onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${showOptionalDetails ? "rotate-180" : ""}`} />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Optional details
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">
                    attendance, engagement, signature
                  </span>
                </button>

                {showOptionalDetails && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2">
                      <div className="flex-1 card p-3.5">
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#A8A29E" }}>Attendance</p>
                        <input type="number" value={studentAttendance} onChange={(e) => setStudentAttendance(e.target.value)}
                          className="w-full text-center py-2.5 text-lg font-bold font-mono bg-transparent"
                          style={{ background: "#F5F5F4", color: "var(--text-primary)", borderRadius: "10px" }}
                          placeholder="—" min="0" max="999" />
                      </div>
                      <div className="flex-1 card p-3.5">
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#A8A29E" }}>Engagement</p>
                        <div className="flex gap-1">
                          {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => {
                            const isActive = engagementLevel === level;
                            const colors: Record<string, { bg: string; text: string }> = {
                              HIGH: { bg: "#DCFCE7", text: "#16A34A" },
                              MEDIUM: { bg: "#FEF3C7", text: "#D97706" },
                              LOW: { bg: "#FEE2E2", text: "#DC2626" },
                            };
                            const c = colors[level];
                            return (
                              <button key={level} type="button" onClick={() => setEngagementLevel(isActive ? "" : level)}
                                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                                style={{
                                  background: isActive ? c.bg : "#F5F5F4",
                                  color: isActive ? c.text : "#A8A29E",
                                  borderRadius: "10px",
                                }}>
                                {level === "HIGH" ? "High" : level === "MEDIUM" ? "Med" : "Low"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label-field">Digital Signature (Optional)</label>
                      <SignaturePad onSign={(data: string) => setSignatureData(data)} onClear={() => setSignatureData(null)} />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={!isFormValid || submitting || savingDraft || selectedPeriodNotEnded}
                  className="w-full font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 4px 16px -4px rgba(22,163,74,0.4)", padding: "18px", borderRadius: "16px" }}>
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {hasMultiSlots || hasMultiClass
                        ? `Submit ${Math.max(selectedSlotIds.length, 1) * (1 + additionalClassIds.length)} Entries`
                        : "Submit Entry"}
                    </>
                  )}
                </button>

                {isDraftValid && (
                  <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={savingDraft || submitting}
                    className="w-full flex items-center justify-center gap-2 font-bold py-3.5 px-6 active:scale-[0.97] transition-all border-2"
                    style={{ borderColor: "var(--accent)", background: "var(--bg-elevated)", color: "var(--accent-text)", borderRadius: "16px" }}>
                    {savingDraft ? "Saving Draft..." : <><Save className="w-5 h-5" />Save as Draft</>}
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
