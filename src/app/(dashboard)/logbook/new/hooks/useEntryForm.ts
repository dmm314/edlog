"use client";

import { useReducer, useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getFamilyOfSituation } from "@/lib/family-of-situation";
import {
  getDayOfWeek,
  DAY_NAMES,
  type EntryFormState,
  type EntryFormAction,
  type AssignmentItem,
  type SubjectWithTopics,
  type TimetableSlot,
} from "../types";

const initialState: EntryFormState = {
  step: 0,
  date: new Date().toISOString().split("T")[0],
  selectedSlotIds: [],
  timetableSlotId: null,
  period: "",
  duration: "60",
  classId: "",
  subjectId: "",
  assignmentId: null,
  additionalClassIds: [],
  moduleName: "",
  topicText: "",
  selectedTopicIds: [],
  classDidNotHold: false,
  familyOfSituation: "",
  familyOfSitEditing: false,
  familyOfSitCustom: false,
  availableFamilies: [],
  metadataObjectives: [],
  selectedObjectives: {},
  customObjective: "",
  showCustomObjectiveInput: false,
  loadingMetadata: false,
  integrationActivity: "",
  integrationLevel: "",
  integrationStatus: "",
  bilingualActivity: false,
  bilingualType: "",
  bilingualNote: "",
  lessonMode: "physical",
  digitalTools: [],
  assignmentGiven: false,
  assignmentDetails: "",
  assignmentReviewed: null,
  pendingAssignmentInfo: null,
  notes: "",
  studentAttendance: "",
  engagementLevel: "",
  signatureData: null,
  showOptionalDetails: false,
  submitting: false,
  savingDraft: false,
  error: "",
  success: false,
  draftSaved: false,
  reflectionText: "",
  reflectionSending: false,
  reflectionSent: false,
};

function reducer(state: EntryFormState, action: EntryFormAction): EntryFormState {
  switch (action.type) {
    case "SET_STEP": return { ...state, step: action.step };
    case "SET_DATE": return { ...state, date: action.date };
    case "SET_SELECTED_SLOT_IDS": return { ...state, selectedSlotIds: action.ids };
    case "SET_TIMETABLE_SLOT_ID": return { ...state, timetableSlotId: action.id };
    case "SET_PERIOD": return { ...state, period: action.period };
    case "SET_DURATION": return { ...state, duration: action.duration };
    case "SET_CLASS_ID": return { ...state, classId: action.classId };
    case "SET_SUBJECT_ID": return { ...state, subjectId: action.subjectId };
    case "SET_ASSIGNMENT_ID": return { ...state, assignmentId: action.id };
    case "SET_ADDITIONAL_CLASS_IDS": return { ...state, additionalClassIds: action.ids };
    case "SET_MODULE_NAME": return { ...state, moduleName: action.name };
    case "SET_TOPIC_TEXT": return { ...state, topicText: action.text };
    case "SET_SELECTED_TOPIC_IDS": return { ...state, selectedTopicIds: action.ids };
    case "SET_CLASS_DID_NOT_HOLD": return { ...state, classDidNotHold: action.value };
    case "SET_FAMILY_OF_SITUATION": return { ...state, familyOfSituation: action.value };
    case "SET_FAMILY_OF_SIT_EDITING": return { ...state, familyOfSitEditing: action.value };
    case "SET_FAMILY_OF_SIT_CUSTOM": return { ...state, familyOfSitCustom: action.value };
    case "SET_AVAILABLE_FAMILIES": return { ...state, availableFamilies: action.families };
    case "SET_METADATA_OBJECTIVES": return { ...state, metadataObjectives: action.objectives };
    case "SET_SELECTED_OBJECTIVES": return { ...state, selectedObjectives: action.objectives };
    case "SET_CUSTOM_OBJECTIVE": return { ...state, customObjective: action.value };
    case "SET_SHOW_CUSTOM_OBJECTIVE_INPUT": return { ...state, showCustomObjectiveInput: action.value };
    case "SET_LOADING_METADATA": return { ...state, loadingMetadata: action.value };
    case "SET_INTEGRATION_ACTIVITY": return { ...state, integrationActivity: action.value };
    case "SET_INTEGRATION_LEVEL": return { ...state, integrationLevel: action.value };
    case "SET_INTEGRATION_STATUS": return { ...state, integrationStatus: action.value };
    case "SET_BILINGUAL_ACTIVITY": return { ...state, bilingualActivity: action.value };
    case "SET_BILINGUAL_TYPE": return { ...state, bilingualType: action.value };
    case "SET_BILINGUAL_NOTE": return { ...state, bilingualNote: action.value };
    case "SET_LESSON_MODE": return { ...state, lessonMode: action.value, digitalTools: action.value === "physical" ? [] : state.digitalTools };
    case "SET_DIGITAL_TOOLS": return { ...state, digitalTools: action.tools };
    case "SET_ASSIGNMENT_GIVEN": return { ...state, assignmentGiven: action.value };
    case "SET_ASSIGNMENT_DETAILS": return { ...state, assignmentDetails: action.value };
    case "SET_ASSIGNMENT_REVIEWED": return { ...state, assignmentReviewed: action.value };
    case "SET_PENDING_ASSIGNMENT_INFO": return { ...state, pendingAssignmentInfo: action.value };
    case "SET_NOTES": return { ...state, notes: action.value };
    case "SET_STUDENT_ATTENDANCE": return { ...state, studentAttendance: action.value };
    case "SET_ENGAGEMENT_LEVEL": return { ...state, engagementLevel: action.value };
    case "SET_SIGNATURE_DATA": return { ...state, signatureData: action.value };
    case "SET_SHOW_OPTIONAL_DETAILS": return { ...state, showOptionalDetails: action.value };
    case "SET_SUBMITTING": return { ...state, submitting: action.value };
    case "SET_SAVING_DRAFT": return { ...state, savingDraft: action.value };
    case "SET_ERROR": return { ...state, error: action.value };
    case "SET_SUCCESS": return { ...state, success: action.value };
    case "SET_DRAFT_SAVED": return { ...state, draftSaved: action.value };
    case "SET_REFLECTION_TEXT": return { ...state, reflectionText: action.value };
    case "SET_REFLECTION_SENDING": return { ...state, reflectionSending: action.value };
    case "SET_REFLECTION_SENT": return { ...state, reflectionSent: action.value };
    case "SELECT_SLOT":
      return {
        ...state,
        classId: action.classId,
        subjectId: action.subjectId,
        assignmentId: action.assignmentId,
        timetableSlotId: action.slotId,
        period: action.period,
        duration: action.duration,
        moduleName: "",
        topicText: "",
        selectedTopicIds: [],
        additionalClassIds: [],
      };
    case "CLEAR_SLOT_SELECTION":
      return { ...state, selectedSlotIds: [], timetableSlotId: null, period: "", duration: "60" };
    case "HANDLE_CLASS_CHANGE":
      return {
        ...state,
        classId: action.classId,
        subjectId: "",
        moduleName: "",
        topicText: "",
        selectedTopicIds: [],
        assignmentId: null,
        selectedSlotIds: [],
        timetableSlotId: null,
        period: "",
        duration: "60",
        additionalClassIds: [],
      };
    case "HANDLE_SUBJECT_CHANGE":
      return {
        ...state,
        subjectId: action.subjectId,
        assignmentId: action.assignmentId,
        moduleName: "",
        topicText: "",
        selectedTopicIds: [],
        additionalClassIds: [],
        selectedSlotIds: state.selectedSlotIds.length > 0 ? [] : state.selectedSlotIds,
        timetableSlotId: state.selectedSlotIds.length > 0 ? null : state.timetableSlotId,
      };
    case "RESET_FORM":
      return { ...initialState, date: new Date().toISOString().split("T")[0] };
    case "RESTORE_DRAFT": {
      const d = action.data;
      return {
        ...state,
        date: (d.date as string) || state.date,
        classId: (d.classId as string) || "",
        subjectId: (d.subjectId as string) || "",
        assignmentId: (d.assignmentId as string | null) || null,
        moduleName: (d.moduleName as string) || "",
        topicText: (d.topicText as string) || "",
        selectedTopicIds: (d.selectedTopicIds as string[]) || [],
        additionalClassIds: (d.additionalClassIds as string[]) || [],
        selectedSlotIds: (d.selectedSlotIds as string[]) || [],
        timetableSlotId: (d.timetableSlotId as string | null) || null,
        period: (d.period as string) || "",
        duration: (d.duration as string) || "60",
        classDidNotHold: (d.classDidNotHold as boolean) || false,
        familyOfSituation: (d.familyOfSituation as string) || "",
        selectedObjectives: (d.selectedObjectives as Record<string, string>) || {},
        integrationLevel: (d.integrationLevel as string) || "",
        integrationStatus: (d.integrationStatus as string) || "",
        bilingualActivity: (d.bilingualActivity as boolean) || false,
        bilingualType: (d.bilingualType as string) || "",
        bilingualNote: (d.bilingualNote as string) || "",
        lessonMode: (d.lessonMode as string) || "physical",
        digitalTools: (d.digitalTools as string[]) || [],
        assignmentGiven: (d.assignmentGiven as boolean) || false,
        assignmentDetails: (d.assignmentDetails as string) || "",
        assignmentReviewed: (d.assignmentReviewed as boolean | null) ?? null,
        notes: (d.notes as string) || "",
        studentAttendance: (d.studentAttendance as string) || "",
        engagementLevel: (d.engagementLevel as string) || "",
        step: (d.step as number) || 0,
      };
    }
    default:
      return state;
  }
}

export function useEntryForm() {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...init,
    date: searchParams.get("date") || new Date().toISOString().split("T")[0],
  }));

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [filledPeriods, setFilledPeriods] = useState<Set<number>>(new Set());
  const [filledSlotIds, setFilledSlotIds] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Load assignments and subjects
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
        dispatch({ type: "SET_ERROR", value: "Failed to load form data. Please refresh." });
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();

    fetch("/api/auth/session").then(r => r.ok ? r.json() : null).then(s => {
      if (s?.user?.createdAt) setUserCreatedAt(s.user.createdAt as string);
    }).catch(() => {});
  }, []);

  // Load timetable slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!state.date) return;
      const dayOfWeek = getDayOfWeek(state.date);
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
          fetch(`/api/entries?from=${state.date}&to=${state.date}&limit=20`),
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
    dispatch({ type: "CLEAR_SLOT_SELECTION" });
  }, [state.date]);

  // Auto-select single subject
  const subjectsForClass = useMemo(() => {
    if (!state.classId) return [];
    return assignments
      .filter((a) => a.class.id === state.classId)
      .map((a) => ({
        id: a.subject.id,
        name: a.division ? `${a.subject.name} (${a.division.name})` : a.subject.name,
        code: a.subject.code,
        assignmentId: a.id,
      }));
  }, [assignments, state.classId]);

  useEffect(() => {
    if (subjectsForClass.length === 1) {
      dispatch({ type: "SET_SUBJECT_ID", subjectId: subjectsForClass[0].id });
      dispatch({ type: "SET_ASSIGNMENT_ID", id: subjectsForClass[0].assignmentId });
    }
  }, [subjectsForClass]);

  // Pre-fill from URL params
  useEffect(() => {
    if (!assignments.length) return;
    const presetAssignmentId = searchParams.get("assignmentId");
    const presetSlotId = searchParams.get("slotId");
    const presetDidNotHold = searchParams.get("didNotHold") === "true";
    if (presetAssignmentId) {
      const assignment = assignments.find((a) => a.id === presetAssignmentId);
      if (assignment) {
        dispatch({ type: "SET_CLASS_ID", classId: assignment.class.id });
        dispatch({ type: "SET_SUBJECT_ID", subjectId: assignment.subject.id });
        dispatch({ type: "SET_ASSIGNMENT_ID", id: assignment.id });
      }
    }
    if (presetSlotId) dispatch({ type: "SET_TIMETABLE_SLOT_ID", id: presetSlotId });
    if (presetDidNotHold) dispatch({ type: "SET_CLASS_DID_NOT_HOLD", value: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  // Derived data
  const assignedClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string; level: string }>();
    for (const a of assignments) {
      if (!classMap.has(a.class.id)) {
        classMap.set(a.class.id, { id: a.class.id, name: a.class.name, level: a.class.level });
      }
    }
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  const selectedClassLevel = useMemo(() => {
    return assignedClasses.find((c) => c.id === state.classId)?.level || "";
  }, [assignedClasses, state.classId]);

  const otherClassesForSubject = useMemo(() => {
    if (!state.subjectId || !state.classId) return [];
    return assignments
      .filter((a) => a.subject.id === state.subjectId && a.class.id !== state.classId)
      .map((a) => ({ classId: a.class.id, className: a.class.name, assignmentId: a.id }));
  }, [assignments, state.subjectId, state.classId]);

  const modules = useMemo(() => {
    if (!state.subjectId || !selectedClassLevel) return [];
    const subject = subjects.find((s) => s.id === state.subjectId);
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
  }, [subjects, state.subjectId, selectedClassLevel]);

  const topicsForModule = useMemo(() => {
    if (!state.subjectId) return [];
    const subject = subjects.find((s) => s.id === state.subjectId);
    if (!subject) return [];
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    const topicsToUse = filtered.length > 0 ? filtered : subject.topics;
    if (state.moduleName) return topicsToUse.filter((t) => t.moduleName === state.moduleName);
    return topicsToUse;
  }, [subjects, state.subjectId, selectedClassLevel, state.moduleName]);

  const topicsForModuleCount = useCallback((mod: string) => {
    const subject = subjects.find((s) => s.id === state.subjectId);
    if (!subject) return 0;
    const filtered = subject.topics.filter((t) => t.classLevel === selectedClassLevel);
    const topicsToUse = filtered.length > 0 ? filtered : subject.topics;
    return topicsToUse.filter((t) => t.moduleName === mod).length;
  }, [subjects, state.subjectId, selectedClassLevel]);

  const selectedSlotsData = useMemo(() => {
    return state.selectedSlotIds
      .map((id) => timetableSlots.find((s) => s.id === id))
      .filter(Boolean) as TimetableSlot[];
  }, [state.selectedSlotIds, timetableSlots]);

  const subjectCode = useMemo(() => {
    if (!state.subjectId) return "";
    const subject = subjects.find((s) => s.id === state.subjectId);
    return subject?.code || "";
  }, [subjects, state.subjectId]);

  const moduleNum = useMemo(() => {
    if (!state.moduleName) return 0;
    const match = state.moduleName.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }, [state.moduleName]);

  const autoFamilyOfSit = useMemo(() => {
    if (!subjectCode || !selectedClassLevel || !moduleNum) return null;
    return getFamilyOfSituation(subjectCode, selectedClassLevel, moduleNum);
  }, [subjectCode, selectedClassLevel, moduleNum]);

  // Auto-fill family of situation
  useEffect(() => {
    if (autoFamilyOfSit && !state.familyOfSitEditing) {
      dispatch({ type: "SET_FAMILY_OF_SITUATION", value: autoFamilyOfSit });
    }
  }, [autoFamilyOfSit, state.familyOfSitEditing]);

  // Fetch curriculum metadata
  useEffect(() => {
    if (!subjectCode || !selectedClassLevel) {
      dispatch({ type: "SET_METADATA_OBJECTIVES", objectives: [] });
      dispatch({ type: "SET_AVAILABLE_FAMILIES", families: [] });
      return;
    }
    let cancelled = false;
    dispatch({ type: "SET_LOADING_METADATA", value: true });
    const params = new URLSearchParams({ subjectCode, classLevel: selectedClassLevel });
    if (moduleNum) params.set("moduleNum", String(moduleNum));
    if (state.moduleName) params.set("moduleName", state.moduleName);
    fetch(`/api/curriculum/metadata?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const objs: string[] = (data.objectives || []).map((o: string | { text: string }) =>
          typeof o === "string" ? o : o.text
        );
        dispatch({ type: "SET_METADATA_OBJECTIVES", objectives: objs });
        dispatch({ type: "SET_AVAILABLE_FAMILIES", families: data.availableFamilies || [] });
        if (objs.length > 0) {
          const defaultSelected: Record<string, string> = {};
          for (const obj of objs) defaultSelected[obj] = "all";
          dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: defaultSelected });
        } else {
          dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: {} });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: "SET_METADATA_OBJECTIVES", objectives: [] });
          dispatch({ type: "SET_AVAILABLE_FAMILIES", families: [] });
        }
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: "SET_LOADING_METADATA", value: false });
      });
    return () => { cancelled = true; };
  }, [subjectCode, selectedClassLevel, moduleNum, state.moduleName]);

  // Check pending assignments
  useEffect(() => {
    if (!state.classId || !state.subjectId) {
      dispatch({ type: "SET_PENDING_ASSIGNMENT_INFO", value: null });
      return;
    }
    let cancelled = false;
    const fromDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    fetch(`/api/entries?classId=${state.classId}&limit=5&from=${fromDate}&to=${state.date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const entries = data.entries || [];
        const recent = entries.find((e: { assignmentGiven?: boolean; assignmentDetails?: string; assignment?: { subjectId: string } }) =>
          e.assignmentGiven && e.assignment?.subjectId === state.subjectId
        );
        dispatch({ type: "SET_PENDING_ASSIGNMENT_INFO", value: recent ? (recent.assignmentDetails || "Assignment was given") : null });
      })
      .catch(() => { if (!cancelled) dispatch({ type: "SET_PENDING_ASSIGNMENT_INFO", value: null }); });
    return () => { cancelled = true; };
  }, [state.classId, state.subjectId, state.date]);

  // Context names
  const contextClassName = assignedClasses.find((c) => c.id === state.classId)?.name || "";
  const contextSubjectName = subjectsForClass.find((s) => s.assignmentId === state.assignmentId || s.id === state.subjectId)?.name || "";

  // Validation
  const selectedDayName = state.date ? DAY_NAMES[getDayOfWeek(state.date)] || "" : "";
  const isWeekend = state.date ? getDayOfWeek(state.date) > 5 : false;
  const hasPeriodSelected = state.selectedSlotIds.length > 0 || state.period !== "";
  const isFormValid = state.date && state.classId && state.subjectId &&
    (state.classDidNotHold || (state.moduleName && (state.selectedTopicIds.length > 0 || state.topicText.trim().length > 0))) &&
    !isWeekend && hasPeriodSelected;
  const isDraftValid = state.date && state.classId && state.subjectId;

  const completenessScore = useMemo(() => {
    if (state.classDidNotHold && hasPeriodSelected && state.classId) return 100;
    const checks = [
      !!state.date, !!state.classId, hasPeriodSelected, !!state.moduleName,
      state.selectedTopicIds.length > 0 || !!state.topicText.trim(),
      !!state.notes.trim(), Object.keys(state.selectedObjectives).length > 0,
      !!state.studentAttendance, !!state.engagementLevel, !!state.familyOfSituation,
      !!state.signatureData,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [state, hasPeriodSelected]);

  const selectedPeriodNotEnded = useMemo(() => {
    const isToday = state.date === new Date().toISOString().split("T")[0];
    if (!isToday || selectedSlotsData.length === 0) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return selectedSlotsData.some((s) => {
      const [eh, em] = s.endTime.split(":").map(Number);
      return currentMins < eh * 60 + em;
    });
  }, [state.date, selectedSlotsData]);

  // Slot toggle handler
  const handleSlotToggle = useCallback((slot: TimetableSlot) => {
    const pm = slot.periodLabel.match(/\d+/);
    const pNum = pm ? parseInt(pm[0]) : null;
    if (filledSlotIds.has(slot.id) || (pNum !== null && filledPeriods.has(pNum))) return;

    const prev = state.selectedSlotIds;
    const already = prev.includes(slot.id);

    if (already) {
      const next = prev.filter((id) => id !== slot.id);
      dispatch({ type: "SET_SELECTED_SLOT_IDS", ids: next });
      if (next.length === 0) {
        dispatch({ type: "SET_TIMETABLE_SLOT_ID", id: null });
        dispatch({ type: "SET_PERIOD", period: "" });
        dispatch({ type: "SET_DURATION", duration: "60" });
      } else {
        const remaining = timetableSlots.find((s) => s.id === next[0]);
        if (remaining) {
          dispatch({ type: "SET_TIMETABLE_SLOT_ID", id: remaining.id });
          const periodMatch = remaining.periodLabel.match(/\d+/);
          if (periodMatch) dispatch({ type: "SET_PERIOD", period: periodMatch[0] });
        }
      }
      return;
    }

    if (prev.length >= 4) return;

    if (prev.length > 0) {
      const existingSlot = timetableSlots.find((s) => s.id === prev[0]);
      if (existingSlot && (slot.assignment.classId !== existingSlot.assignment.classId || slot.assignment.subjectId !== existingSlot.assignment.subjectId)) {
        const periodMatch = slot.periodLabel.match(/\d+/);
        const [sh, sm] = slot.startTime.split(":").map(Number);
        const [eh, em] = slot.endTime.split(":").map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        dispatch({ type: "SELECT_SLOT", classId: slot.assignment.classId, subjectId: slot.assignment.subjectId, assignmentId: slot.assignment.id, slotId: slot.id, period: periodMatch ? periodMatch[0] : "", duration: mins > 0 ? String(mins) : "60" });
        dispatch({ type: "SET_SELECTED_SLOT_IDS", ids: [slot.id] });
        return;
      }
    }

    if (prev.length === 0) {
      dispatch({ type: "SELECT_SLOT", classId: slot.assignment.classId, subjectId: slot.assignment.subjectId, assignmentId: slot.assignment.id, slotId: slot.id, period: "", duration: "60" });
    }

    dispatch({ type: "SET_TIMETABLE_SLOT_ID", id: slot.id });
    const periodMatch = slot.periodLabel.match(/\d+/);
    if (periodMatch) dispatch({ type: "SET_PERIOD", period: periodMatch[0] });
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins > 0) dispatch({ type: "SET_DURATION", duration: String(mins) });
    dispatch({ type: "SET_SELECTED_SLOT_IDS", ids: [...prev, slot.id] });
  }, [state.selectedSlotIds, filledSlotIds, filledPeriods, timetableSlots]);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
    setSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  return {
    state,
    dispatch,
    // Fetched data
    assignments,
    subjects,
    timetableSlots,
    filledPeriods,
    filledSlotIds,
    loadingData,
    loadingSlots,
    userCreatedAt,
    // Timer
    seconds,
    stopTimer,
    // Derived
    assignedClasses,
    subjectsForClass,
    selectedClassLevel,
    otherClassesForSubject,
    modules,
    topicsForModule,
    topicsForModuleCount,
    selectedSlotsData,
    subjectCode,
    moduleNum,
    autoFamilyOfSit,
    contextClassName,
    contextSubjectName,
    selectedDayName,
    isWeekend,
    hasPeriodSelected,
    isFormValid: Boolean(isFormValid),
    isDraftValid: Boolean(isDraftValid),
    completenessScore,
    selectedPeriodNotEnded,
    // Handlers
    handleSlotToggle,
    resetForm,
  };
}
