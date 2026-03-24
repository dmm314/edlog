"use client";

import { useEffect, useRef, useCallback } from "react";
import type { EntryFormState } from "../types";

const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const LOCAL_STORAGE_KEY = "edlog_draft_form";

/** Extract saveable form data from state (exclude UI-only fields) */
function extractFormData(state: EntryFormState): Record<string, unknown> {
  return {
    date: state.date,
    classId: state.classId,
    subjectId: state.subjectId,
    assignmentId: state.assignmentId,
    moduleName: state.moduleName,
    topicText: state.topicText,
    selectedTopicIds: state.selectedTopicIds,
    additionalClassIds: state.additionalClassIds,
    selectedSlotIds: state.selectedSlotIds,
    timetableSlotId: state.timetableSlotId,
    period: state.period,
    duration: state.duration,
    classDidNotHold: state.classDidNotHold,
    familyOfSituation: state.familyOfSituation,
    selectedObjectives: state.selectedObjectives,
    integrationLevel: state.integrationLevel,
    integrationStatus: state.integrationStatus,
    bilingualActivity: state.bilingualActivity,
    bilingualType: state.bilingualType,
    bilingualNote: state.bilingualNote,
    lessonMode: state.lessonMode,
    digitalTools: state.digitalTools,
    assignmentGiven: state.assignmentGiven,
    assignmentDetails: state.assignmentDetails,
    assignmentReviewed: state.assignmentReviewed,
    notes: state.notes,
    studentAttendance: state.studentAttendance,
    engagementLevel: state.engagementLevel,
    step: state.step,
  };
}

/** Check if form has meaningful data worth saving */
function hasFormData(state: EntryFormState): boolean {
  return !!(state.classId || state.subjectId || state.moduleName || state.topicText.trim() || state.notes.trim());
}

interface UseAutoSaveOptions {
  enabled: boolean;
}

export function useAutoSave(state: EntryFormState, options: UseAutoSaveOptions = { enabled: true }) {
  const lastSavedRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Save to localStorage immediately (offline-first)
  const saveToLocal = useCallback((formState: EntryFormState) => {
    if (!hasFormData(formState)) return;
    try {
      const data = extractFormData(formState);
      const serialized = JSON.stringify(data);
      // Only save if data changed
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
        lastSavedRef.current = serialized;
      }
    } catch {
      // localStorage might be full or unavailable
    }
  }, []);

  // Save to server (DraftEntry)
  const saveToServer = useCallback(async (formState: EntryFormState) => {
    if (!hasFormData(formState)) return;
    try {
      const data = extractFormData(formState);
      await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: data,
          slotId: formState.timetableSlotId,
        }),
      });
    } catch {
      // Network failure — local save is the fallback
    }
  }, []);

  // Auto-save on interval
  useEffect(() => {
    if (!options.enabled || state.success || state.submitting) return;

    saveTimerRef.current = setInterval(() => {
      saveToLocal(state);
      saveToServer(state);
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(saveTimerRef.current);
  }, [state, options.enabled, saveToLocal, saveToServer]);

  // Save on unmount / page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasFormData(state)) {
        saveToLocal(state);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on unmount too
      if (hasFormData(state)) {
        saveToLocal(state);
      }
    };
  }, [state, saveToLocal]);

  // Clear draft when form is successfully submitted
  useEffect(() => {
    if (state.success) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch { /* ignore */ }
      // Also delete server-side draft
      fetch("/api/drafts", { method: "DELETE" }).catch(() => {});
    }
  }, [state.success]);

  return { saveToLocal, saveToServer };
}

/** Load saved draft from localStorage (for form recovery) */
export function loadLocalDraft(): Record<string, unknown> | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Clear saved draft from localStorage */
export function clearLocalDraft(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch { /* ignore */ }
}
