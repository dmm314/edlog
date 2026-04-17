"use client";

import { useCallback } from "react";
import { enqueueEntry } from "@/lib/offline-queue";
import type { EntryFormState, EntryFormAction, AssignmentItem, TimetableSlot, TopicItem, SubmittedEntryData } from "../types";

interface UseEntrySubmitParams {
  state: EntryFormState;
  dispatch: React.Dispatch<EntryFormAction>;
  assignments: AssignmentItem[];
  selectedSlotsData: TimetableSlot[];
  topicsForModule: TopicItem[];
  seconds: number;
  stopTimer: () => void;
}

export function useEntrySubmit({
  state,
  dispatch,
  assignments,
  selectedSlotsData,
  topicsForModule,
  seconds,
  stopTimer,
}: UseEntrySubmitParams) {

  function validateBeforeSubmit(): { error: string; targetStep: number; fieldId: string } | null {
    if (!state.classId) return { error: "Select a class", targetStep: 0, fieldId: "class-select-field" };
    const hasPeriod = state.selectedSlotIds.length > 0 || state.period !== "";
    if (!hasPeriod) return { error: "Select a period", targetStep: 0, fieldId: "period-select-field" };
    if (!state.classDidNotHold) {
      if (!state.moduleName) return { error: "Select a module — which chapter or unit did you teach?", targetStep: 0, fieldId: "module-list-section" };
      if (state.selectedTopicIds.length === 0 && !state.topicText?.trim()) return { error: "Select or type at least one topic", targetStep: 1, fieldId: "topic-input-field" };
    }
    return null;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    const hasPeriod = state.selectedSlotIds.length > 0 || state.period !== "";
    const isFormValid = state.date && state.classId && state.subjectId &&
      (state.classDidNotHold || (state.moduleName && (state.selectedTopicIds.length > 0 || state.topicText.trim().length > 0))) &&
      hasPeriod;
    const isDraftValid = state.date && state.classId && state.subjectId;

    if (asDraft ? !isDraftValid : !isFormValid) return;
    if (state.submitting || state.savingDraft) return;
    dispatch({ type: "SET_ERROR", value: "" });

    if (!asDraft) {
      const validationResult = validateBeforeSubmit();
      if (validationResult) {
        dispatch({ type: "SET_ERROR", value: validationResult.error });
        const needsStepChange = validationResult.targetStep !== state.step;
        if (needsStepChange) dispatch({ type: "SET_STEP", step: validationResult.targetStep });
        setTimeout(() => {
          document.getElementById(validationResult.fieldId)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, needsStepChange ? 150 : 50);
        return;
      }
    }

    if (asDraft) dispatch({ type: "SET_SAVING_DRAFT", value: true });
    else dispatch({ type: "SET_SUBMITTING", value: true });

    try {
      const slotsToSubmit = selectedSlotsData.length > 0 ? selectedSlotsData : [null];
      const createdEntries: Record<string, unknown>[] = [];
      const allClassIds = [state.classId, ...state.additionalClassIds];
      const allAssignmentIds = allClassIds.map((cId) => {
        const match = assignments.find((a) => a.class.id === cId && a.subject.id === state.subjectId);
        return match?.id || null;
      });

      for (const slot of slotsToSubmit) {
        let entryPeriod = state.period ? parseInt(state.period) : null;
        let entryDuration = parseInt(state.duration);
        let entrySlotId = state.timetableSlotId;
        let entryAssignmentId = state.assignmentId;

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

        const resolvedTopicText = state.topicText.trim()
          || state.selectedTopicIds.map((id) => topicsForModule.find((t) => t.id === id)?.name).filter(Boolean).join("; ")
          || null;

        const body: Record<string, unknown> = {
          date: state.date,
          classId: allClassIds[0],
          classIds: allClassIds.length > 1 ? allClassIds : undefined,
          assignmentId: entryAssignmentId || allAssignmentIds[0] || null,
          assignmentIds: allClassIds.length > 1 ? allAssignmentIds : undefined,
          timetableSlotId: entrySlotId || null,
          period: entryPeriod,
          duration: entryDuration,
          moduleName: state.moduleName || null,
          topicIds: state.selectedTopicIds.length > 0 ? state.selectedTopicIds : undefined,
          topicText: resolvedTopicText,
          notes: state.notes || null,
          objectives: Object.keys(state.selectedObjectives).length > 0
            ? Object.entries(state.selectedObjectives).map(([text, proportion]) => ({ text, proportion }))
            : (state.integrationActivity ? [{ text: state.integrationActivity, proportion: "all" as const }] : null),
          studentAttendance: state.studentAttendance ? parseInt(state.studentAttendance) : null,
          engagementLevel: state.engagementLevel || null,
          signatureData: state.signatureData,
          familyOfSituation: state.familyOfSituation || null,
          bilingualActivity: state.bilingualActivity || false,
          bilingualType: state.bilingualActivity ? (state.bilingualType || null) : null,
          bilingualNote: state.bilingualActivity ? (state.bilingualNote || null) : null,
          integrationActivity: Object.keys(state.selectedObjectives).length > 0
            ? Object.keys(state.selectedObjectives).join("; ")
            : (state.integrationActivity || null),
          integrationLevel: state.integrationLevel || null,
          integrationStatus: state.integrationStatus || null,
          lessonMode: state.lessonMode || "physical",
          digitalTools: (state.lessonMode === "digital" || state.lessonMode === "hybrid") ? state.digitalTools : [],
          assignmentGiven: state.assignmentGiven || false,
          assignmentDetails: state.assignmentGiven ? (state.assignmentDetails || null) : null,
          assignmentReviewed: state.assignmentReviewed,
          status: asDraft ? "DRAFT" : "SUBMITTED",
          classDidNotHold: state.classDidNotHold || undefined,
        };

        let res: Response;
        try {
          res = await fetch("/api/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          // Network failure — queue for offline sync
          enqueueEntry("/api/entries", "POST", body);
          throw new Error("You appear to be offline. Your entry has been saved and will be submitted when you reconnect.");
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create entry");
        }

        const result = await res.json();
        if (Array.isArray(result)) createdEntries.push(...result);
        else createdEntries.push(result);
      }

      const firstEntry = createdEntries[0] as Record<string, unknown>;
      const assignment = firstEntry.assignment as Record<string, unknown> | undefined;
      const topics = firstEntry.topics as Array<Record<string, unknown>> | undefined;
      const baseSubjectName = (assignment?.subject as Record<string, unknown>)?.name as string ?? (topics?.[0]?.subject as Record<string, unknown>)?.name as string ?? "—";
      const divisionName = (assignment?.division as Record<string, unknown>)?.name as string | undefined;
      const subjectDisplayName = divisionName ? `${baseSubjectName} (${divisionName})` : baseSubjectName;
      const entryDate = new Date(firstEntry.date as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

      const periodsList = createdEntries
        .filter((entry, idx, arr) => arr.findIndex((e) => e.period === entry.period && e.timetableSlotId === entry.timetableSlotId) === idx)
        .map((entry) => {
          const ts = entry.timetableSlot as Record<string, unknown> | undefined;
          return {
            period: ts?.periodLabel as string || (entry.period ? `Period ${entry.period}` : "—"),
            time: ts ? `${ts.startTime} - ${ts.endTime}` : "—",
            duration: `${entry.duration} min`,
          };
        });

      const topicNames = state.selectedTopicIds
        .map((id) => topicsForModule.find((t) => t.id === id)?.name)
        .filter(Boolean) as string[];

      const classNames = Array.from(new Set(createdEntries.map((e) => (e.class as Record<string, unknown>)?.name as string)));

      const submittedData: SubmittedEntryData = {
        entryIds: createdEntries.map((e) => e.id as string),
        subject: subjectDisplayName,
        module: (firstEntry.moduleName as string) || "—",
        topic: (firstEntry.topicText as string) || (topics?.[0]?.name as string) || "—",
        topics: topicNames.length > 0 ? topicNames : (topics || []).map((t) => t.name as string),
        className: classNames.join(", "),
        classNames,
        date: entryDate,
        periods: periodsList,
        notes: (firstEntry.notes as string) || "",
        objectives: (firstEntry.objectives as string) || "",
        attendance: firstEntry.studentAttendance ? `${firstEntry.studentAttendance} students` : "",
        engagement: (firstEntry.engagementLevel as string) || "",
        isDraft: asDraft,
        classDidNotHold: state.classDidNotHold,
        familyOfSituation: state.familyOfSituation || "",
        bilingualActivity: state.bilingualActivity,
        bilingualType: state.bilingualType || "",
        lessonMode: state.lessonMode || "physical",
        integrationActivity: Object.keys(state.selectedObjectives).length > 0
          ? Object.keys(state.selectedObjectives).join("; ")
          : (state.integrationActivity || ""),
        assignmentGiven: state.assignmentGiven,
        assignmentDetails: state.assignmentDetails || "",
        assignmentReviewed: state.assignmentReviewed,
      };

      if (asDraft) {
        dispatch({ type: "SET_DRAFT_SAVED", value: true });
        setTimeout(() => dispatch({ type: "SET_DRAFT_SAVED", value: false }), 3000);
      } else {
        dispatch({ type: "SET_SUCCESS", value: true });
        stopTimer();
      }

      return { submittedData, completionTime: seconds };
    } catch (err) {
      dispatch({ type: "SET_ERROR", value: err instanceof Error ? err.message : "Failed to create entry" });
      return null;
    } finally {
      dispatch({ type: "SET_SUBMITTING", value: false });
      dispatch({ type: "SET_SAVING_DRAFT", value: false });
    }
  }, [state, assignments, selectedSlotsData, topicsForModule, seconds, stopTimer, dispatch, validateBeforeSubmit]);

  return { handleSubmit, validateBeforeSubmit };
}
