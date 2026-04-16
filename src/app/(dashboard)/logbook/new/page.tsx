"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertCircle, Save, Zap, Check, WifiOff } from "lucide-react";
import Link from "next/link";
import { EntrySubmitBar } from "@/components/domain/EntrySubmitBar";
import { useEntryForm } from "./hooks/useEntryForm";
import { useEntrySubmit } from "./hooks/useEntrySubmit";
import { useAutoSave, loadLocalDraft, clearLocalDraft } from "./hooks/useAutoSave";
import { EntrySuccessScreen } from "./components/EntrySuccessScreen";
import { SlotSelectionSection } from "./components/SlotSelectionSection";
import { CurriculumSection } from "./components/CurriculumSection";
import { LessonDetailsSection } from "./components/LessonDetailsSection";
import { setupOfflineSync, getQueueCount } from "@/lib/offline-queue";
import type { SubmittedEntryData } from "./types";

const STEP_LABELS = ["Module", "Topic", "Details"];

export default function NewEntryPage() {
  const router = useRouter();

  const {
    state, dispatch,
    assignments, timetableSlots, filledPeriods, filledSlotIds,
    loadingData, loadingSlots, userCreatedAt,
    seconds, stopTimer,
    assignedClasses, subjectsForClass, selectedClassLevel,
    otherClassesForSubject, modules, topicsForModule, topicsForModuleCount,
    selectedSlotsData, autoFamilyOfSit,
    contextClassName, contextSubjectName,
    selectedDayName, isWeekend, hasPeriodSelected,
    isFormValid, isDraftValid, completenessScore, selectedPeriodNotEnded,
    handleSlotToggle, resetForm,
  } = useEntryForm();

  const { handleSubmit: submitEntry } = useEntrySubmit({
    state, dispatch, assignments, selectedSlotsData, topicsForModule, seconds, stopTimer,
  });

  // Auto-save every 5 seconds to localStorage + server DraftEntry
  useAutoSave(state, { enabled: !state.success && !state.submitting });

  // Draft recovery — check for saved draft on mount
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  useEffect(() => {
    const draft = loadLocalDraft();
    if (draft && (draft.classId || draft.moduleName || draft.topicText)) {
      setShowDraftRecovery(true);
    }
    setPendingOfflineCount(getQueueCount());
    const cleanup = setupOfflineSync();
    return cleanup;
  }, []);

  function restoreDraft() {
    const draft = loadLocalDraft();
    if (draft) {
      dispatch({ type: "RESTORE_DRAFT", data: draft });
      setShowDraftRecovery(false);
    }
  }

  function dismissDraft() {
    clearLocalDraft();
    setShowDraftRecovery(false);
  }

  const [submittedEntries, setSubmittedEntries] = useState<SubmittedEntryData | null>(null);
  const [completionTime, setCompletionTime] = useState(0);

  const hasMultiSlots = state.selectedSlotIds.length > 1;
  const hasMultiClass = state.additionalClassIds.length > 0;
  const contextSlot = selectedSlotsData[0];
  const hasContext = state.classId && state.subjectId && hasPeriodSelected;

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    const result = await submitEntry(e, asDraft);
    if (result) {
      setSubmittedEntries(result.submittedData);
      setCompletionTime(result.completionTime);
    }
  }

  async function handleReflectionSend() {
    if (!state.reflectionText.trim() || !submittedEntries?.entryIds[0]) return;
    dispatch({ type: "SET_REFLECTION_SENDING", value: true });
    try {
      const res = await fetch(`/api/entries/${submittedEntries.entryIds[0]}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: state.reflectionText.trim() }),
      });
      if (res.ok) {
        dispatch({ type: "SET_REFLECTION_SENT", value: true });
        dispatch({ type: "SET_REFLECTION_TEXT", value: "" });
      }
    } catch {
      // silently fail
    } finally {
      dispatch({ type: "SET_REFLECTION_SENDING", value: false });
    }
  }

  function handleNewEntry() {
    resetForm();
    setSubmittedEntries(null);
    setCompletionTime(0);
  }

  // Desktop sidebar data
  const sidebarChecklist = useMemo(() => [
    { done: !!state.moduleName, label: "Module selected" },
    { done: state.selectedTopicIds.length > 0 || !!state.topicText.trim(), label: "Topic entered" },
    { done: Object.keys(state.selectedObjectives).length > 0, label: "Learning objectives" },
    { done: !!state.familyOfSituation, label: "Family of situation" },
    { done: !!state.notes.trim(), label: "Notes added" },
    { done: !!state.studentAttendance, label: "Attendance recorded" },
    { done: !!state.engagementLevel, label: "Engagement level" },
  ], [state]);

  // ─── Success Screen ─────────────────────────────────────────────
  if (state.success && submittedEntries) {
    return (
      <EntrySuccessScreen
        submittedEntries={submittedEntries}
        completionTime={completionTime}
        reflectionText={state.reflectionText}
        reflectionSending={state.reflectionSending}
        reflectionSent={state.reflectionSent}
        onReflectionChange={(text) => dispatch({ type: "SET_REFLECTION_TEXT", value: text })}
        onReflectionSend={handleReflectionSend}
        onNewEntry={handleNewEntry}
      />
    );
  }

  // ─── Entry Form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
      {/* Persistent Header */}
      <div className="bg-[hsl(var(--surface-elevated))] border-b border-[hsl(var(--border-primary))]">
        <div className="page-shell px-5 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => state.step > 0 ? dispatch({ type: "SET_STEP", step: state.step - 1 }) : router.back()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-[hsl(var(--surface-tertiary))] text-content-tertiary hover:bg-[hsl(var(--surface-canvas))]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-content-primary flex-1">New Entry</h1>
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono font-bold tabular-nums transition-all ${
                seconds > 60
                  ? "border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]"
                  : "border border-[hsl(var(--border-primary))] text-content-tertiary"
              }`}
            >
              <Clock className="w-3 h-3" />
              {seconds}s
            </div>
          </div>

          {/* Context banner */}
          {hasContext && (
            <div className="flex items-center gap-3 mb-4 animate-slide-up rounded-2xl p-4 bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent)/0.18))] border border-[hsl(var(--accent)/0.15)]">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--accent-text))]">
                  Auto-filled from timetable
                </p>
                <p className="text-[15px] font-bold text-content-primary mt-1 truncate">
                  {contextSubjectName} — {contextClassName}
                </p>
                <p className="text-xs font-mono mt-0.5 text-content-secondary">
                  {selectedDayName}
                  {contextSlot && ` \u00B7 ${contextSlot.periodLabel} \u00B7 ${contextSlot.startTime}\u2013${contextSlot.endTime}`}
                  {hasMultiSlots && ` (+${state.selectedSlotIds.length - 1} more)`}
                </p>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl bg-[hsl(var(--surface-elevated)/0.7)] text-[hsl(var(--accent-strong))] backdrop-blur-sm">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Period not ended warning */}
          {(() => {
            const isToday = state.date === new Date().toISOString().split("T")[0];
            if (isToday && selectedSlotsData.length > 0) {
              const now = new Date();
              const currentMins = now.getHours() * 60 + now.getMinutes();
              const unendedSlot = selectedSlotsData.find((s) => {
                const [eh, em] = s.endTime.split(":").map(Number);
                return currentMins < eh * 60 + em;
              });
              if (unendedSlot) {
                return (
                  <div className="flex items-center gap-2 mb-3 animate-slide-up rounded-xl p-3 bg-[hsl(var(--accent-soft))] border border-[hsl(var(--accent)/0.2)]">
                    <Clock className="w-4 h-4 flex-shrink-0 text-[hsl(var(--accent-text))]" />
                    <p className="text-xs font-medium text-[hsl(var(--accent-text))]">
                      This period hasn&apos;t ended yet. You can save as draft now and submit after {unendedSlot.endTime}.
                    </p>
                  </div>
                );
              }
            }
            return null;
          })()}

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => {
              const isActive = i === state.step;
              const isDone = i < state.step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { if (isDone) dispatch({ type: "SET_STEP", step: i }); }}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${isDone ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-[hsl(var(--surface-tertiary))]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: isDone ? "100%" : isActive ? "50%" : "0%",
                        background: "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent-strong)))",
                      }}
                    />
                  </div>
                  <span className={`text-[11px] transition-colors ${
                    isActive ? "font-bold text-content-primary" : isDone ? "font-semibold text-[hsl(var(--accent-text))]" : "font-medium text-content-tertiary"
                  }`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-4 page-shell">
        {state.error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2 bg-[var(--warning-light)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.2)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {state.error}
            <button onClick={() => dispatch({ type: "SET_ERROR", value: "" })} className="ml-auto font-semibold underline text-xs">Dismiss</button>
          </div>
        )}

        {state.draftSaved && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2 bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] border border-[hsl(var(--accent)/0.2)]">
            <Save className="w-4 h-4" />
            Draft saved! You can complete this entry later.
          </div>
        )}

        {/* Draft recovery banner */}
        {showDraftRecovery && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm border border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))]">
            <div className="flex items-center gap-2 mb-2">
              <Save className="w-4 h-4 text-[hsl(var(--accent-text))]" />
              <span className="font-semibold text-[hsl(var(--accent-text))]">Unsaved draft found</span>
            </div>
            <p className="text-xs text-[hsl(var(--accent-strong))] mb-2">You have an incomplete entry from a previous session.</p>
            <div className="flex gap-2">
              <button onClick={restoreDraft} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[hsl(var(--accent))] text-white">
                Restore Draft
              </button>
              <button onClick={dismissDraft} className="text-xs font-medium px-3 py-1.5 rounded-lg text-[hsl(var(--accent-text))]">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Offline queue banner */}
        {pendingOfflineCount > 0 && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2 bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.2)]">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            {pendingOfflineCount} entr{pendingOfflineCount === 1 ? "y" : "ies"} waiting to sync when online
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

            {/* STEP 0 — Module */}
            {state.step === 0 && (
              <SlotSelectionSection
                state={state}
                dispatch={dispatch}
                timetableSlots={timetableSlots}
                filledSlotIds={filledSlotIds}
                filledPeriods={filledPeriods}
                loadingSlots={loadingSlots}
                selectedDayName={selectedDayName}
                isWeekend={isWeekend}
                hasPeriodSelected={hasPeriodSelected}
                assignedClasses={assignedClasses}
                subjectsForClass={subjectsForClass}
                contextClassName={contextClassName}
                contextSubjectName={contextSubjectName}
                modules={modules}
                topicsForModuleCount={topicsForModuleCount}
                userCreatedAt={userCreatedAt}
                onSlotToggle={handleSlotToggle}
                assignments={assignments}
              />
            )}

            {/* STEP 1 — Topic */}
            {state.step === 1 && (
              <CurriculumSection
                state={state}
                dispatch={dispatch}
                topicsForModule={topicsForModule}
                contextSubjectName={contextSubjectName}
                selectedClassLevel={selectedClassLevel}
                otherClassesForSubject={otherClassesForSubject}
                userCreatedAt={userCreatedAt}
              />
            )}

            {/* STEP 2 — Details & Submit */}
            {state.step === 2 && (
              <div className="space-y-4 animate-slide-in-right lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:space-y-0">
                {/* Left column */}
                <div className="space-y-4">
                  <LessonDetailsSection
                    state={state}
                    dispatch={dispatch}
                    topicsForModule={topicsForModule}
                    contextSubjectName={contextSubjectName}
                    contextClassName={contextClassName}
                    autoFamilyOfSit={autoFamilyOfSit}
                    completenessScore={completenessScore}
                    userCreatedAt={userCreatedAt}
                  />

                  <EntrySubmitBar
                    isFormValid={isFormValid}
                    isDraftValid={isDraftValid}
                    submitting={state.submitting}
                    savingDraft={state.savingDraft}
                    selectedPeriodNotEnded={selectedPeriodNotEnded}
                    hasMultiSlots={hasMultiSlots}
                    hasMultiClass={hasMultiClass}
                    slotCount={state.selectedSlotIds.length}
                    classCount={1 + state.additionalClassIds.length}
                    onSaveDraft={(e) => handleSubmit(e, true)}
                  />
                </div>

                {/* Right column: desktop sidebar */}
                <aside className="hidden lg:block">
                  <div className="sticky top-6 space-y-4">
                    {/* Completeness ring */}
                    <div className="card rounded-2xl p-5 text-center">
                      <div className="relative w-24 h-24 mx-auto mb-3">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--surface-tertiary))" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none"
                            stroke={completenessScore >= 80 ? "hsl(var(--success))" : completenessScore >= 50 ? "hsl(var(--accent))" : "hsl(var(--warning))"}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${completenessScore * 2.64} ${264 - completenessScore * 2.64}`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-content-primary">{completenessScore}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-content-primary">Entry Completeness</p>
                      {completenessScore < 80 && (
                        <p className="text-xs text-content-tertiary mt-1">
                          Add {[
                            !state.notes.trim() && "notes",
                            !state.engagementLevel && "engagement",
                            !state.studentAttendance && "attendance",
                            !state.familyOfSituation && "family of situation",
                          ].filter(Boolean).slice(0, 2).join(", ")} to improve
                        </p>
                      )}
                      {completenessScore >= 80 && (
                        <p className="text-xs text-[hsl(var(--success))] font-medium mt-1">Looking great!</p>
                      )}
                    </div>

                    {/* Quick checklist */}
                    <div className="card rounded-2xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-content-tertiary mb-3">Checklist</p>
                      <div className="space-y-2">
                        {sidebarChecklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 ${
                              item.done ? "bg-[hsl(var(--success))]" : "border border-[hsl(var(--border-strong))]"
                            }`}>
                              {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs ${item.done ? "text-content-secondary line-through" : "text-content-primary"}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
