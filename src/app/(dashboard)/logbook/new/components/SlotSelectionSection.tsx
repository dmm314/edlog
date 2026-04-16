"use client";

import { AlertCircle, Check } from "lucide-react";
import { SlotSelector } from "@/components/domain/SlotSelector";
import { HelpHint } from "@/components/HelpHint";
import { ChevronRight } from "lucide-react";
import type { EntryFormState, EntryFormAction, TimetableSlot } from "../types";

interface SlotSelectionSectionProps {
  state: EntryFormState;
  dispatch: React.Dispatch<EntryFormAction>;
  timetableSlots: TimetableSlot[];
  filledSlotIds: Set<string>;
  filledPeriods: Set<number>;
  loadingSlots: boolean;
  selectedDayName: string;
  isWeekend: boolean;
  hasPeriodSelected: boolean;
  assignedClasses: { id: string; name: string; level: string }[];
  subjectsForClass: { id: string; name: string; code: string; assignmentId: string }[];
  contextClassName: string;
  contextSubjectName: string;
  modules: string[];
  topicsForModuleCount: (mod: string) => number;
  userCreatedAt?: string;
  onSlotToggle: (slot: TimetableSlot) => void;
  assignments: { id: string; class: { id: string }; subject: { id: string } }[];
}

export function SlotSelectionSection({
  state,
  dispatch,
  timetableSlots,
  filledSlotIds,
  filledPeriods,
  loadingSlots,
  selectedDayName,
  isWeekend,
  hasPeriodSelected,
  assignedClasses,
  subjectsForClass,
  contextClassName,
  contextSubjectName,
  modules,
  topicsForModuleCount,
  userCreatedAt,
  onSlotToggle,
  assignments,
}: SlotSelectionSectionProps) {

  const handleClassChange = (newClassId: string) => {
    dispatch({ type: "HANDLE_CLASS_CHANGE", classId: newClassId });
  };

  const handleSubjectChange = (value: string) => {
    const matchByAssignment = assignments.find((a) => a.id === value);
    if (matchByAssignment) {
      dispatch({ type: "HANDLE_SUBJECT_CHANGE", subjectId: matchByAssignment.subject.id, assignmentId: matchByAssignment.id });
    } else {
      const match = assignments.find((a) => a.class.id === state.classId && a.subject.id === value);
      dispatch({ type: "HANDLE_SUBJECT_CHANGE", subjectId: value, assignmentId: match?.id || null });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="label-field">Date</label>
        <input type="date" value={state.date} onChange={(e) => dispatch({ type: "SET_DATE", date: e.target.value })} max={new Date().toISOString().split("T")[0]} className="input-field" required />
        {state.date && !isWeekend && <p className="text-xs mt-1 font-medium" style={{ color: "var(--accent-text)" }}>{selectedDayName}</p>}
        {isWeekend && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>Weekend — select a weekday</p>}
      </div>

      <SlotSelector
        date={state.date}
        slots={timetableSlots}
        selectedSlotIds={state.selectedSlotIds}
        filledSlotIds={filledSlotIds}
        filledPeriods={filledPeriods}
        selectedDayName={selectedDayName}
        loading={loadingSlots}
        onSlotToggle={onSlotToggle}
      />

      {state.selectedSlotIds.length === 0 && !loadingSlots && (
        <div>
          <label className="label-field">Period <span style={{ color: "var(--warning)" }}>*</span></label>
          <select id="period-select-field" value={state.period} onChange={(e) => dispatch({ type: "SET_PERIOD", period: e.target.value })} className="input-field" required>
            <option value="">Select period</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
              <option key={p} value={p} disabled={filledPeriods.has(p)}>Period {p}{filledPeriods.has(p) ? " (filled)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      {state.selectedSlotIds.length === 0 && (
        <div>
          <label className="label-field">Class <span style={{ color: "var(--warning)" }}>*</span></label>
          <select id="class-select-field" value={state.classId} onChange={(e) => handleClassChange(e.target.value)} className="input-field" required>
            <option value="">Select class</option>
            {assignedClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      )}

      {!loadingSlots && timetableSlots.length === 0 && !isWeekend && state.date && (
        <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No classes on {selectedDayName}</p>
            <p className="mt-0.5">Select a day you have classes.</p>
          </div>
        </div>
      )}

      {state.selectedSlotIds.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Class</label>
            <div className="input-field flex items-center text-sm" style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}>{contextClassName || "—"}</div>
          </div>
          <div>
            <label className="label-field">Subject</label>
            <div className="input-field flex items-center text-sm" style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}>{contextSubjectName || "—"}</div>
          </div>
        </div>
      )}

      {state.classId && state.selectedSlotIds.length === 0 && (
        <div>
          <label className="label-field">Subject <span style={{ color: "var(--warning)" }}>*</span></label>
          {subjectsForClass.length === 1 ? (
            <div className="input-field flex items-center" style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}>{subjectsForClass[0].name}</div>
          ) : (
            <select value={state.assignmentId || state.subjectId} onChange={(e) => handleSubjectChange(e.target.value)} className="input-field" required>
              <option value="">Select subject</option>
              {subjectsForClass.map((s) => (<option key={s.assignmentId} value={s.assignmentId}>{s.name}</option>))}
            </select>
          )}
        </div>
      )}

      {state.subjectId && hasPeriodSelected && (
        <button type="button" onClick={() => dispatch({ type: "SET_CLASS_DID_NOT_HOLD", value: !state.classDidNotHold })}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
          style={{
            borderColor: state.classDidNotHold ? "var(--warning)" : "var(--border-primary)",
            background: state.classDidNotHold ? "var(--warning-light)" : "hsl(var(--surface-elevated))",
          }}>
          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: state.classDidNotHold ? "var(--warning)" : "var(--border-primary)", background: state.classDidNotHold ? "var(--warning)" : "hsl(var(--surface-elevated))" }}>
            {state.classDidNotHold && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <p className={`text-sm font-semibold ${state.classDidNotHold ? "text-[var(--warning)]" : "text-[var(--text-secondary)]"}`}>Class did not hold</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Mark if the class was cancelled</p>
          </div>
        </button>
      )}

      {state.subjectId && !state.classDidNotHold && modules.length > 0 && (
        <div id="module-list-section">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-content-primary">Select the module you taught</p>
            <HelpHint text="Select the module (unit/chapter) your lesson was part of. Topics will auto-populate based on this." position="right" createdAt={userCreatedAt} />
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {modules.map((mod, i) => {
              const topicCount = topicsForModuleCount(mod);
              return (
                <button key={mod} type="button"
                  onClick={() => { dispatch({ type: "SET_MODULE_NAME", name: mod }); dispatch({ type: "SET_SELECTED_TOPIC_IDS", ids: [] }); dispatch({ type: "SET_STEP", step: 1 }); }}
                  className="card flex items-center gap-3.5 p-4 text-left transition-all active:scale-[0.98] hover:-translate-y-0.5 group motion-safe:animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-10 h-10 flex items-center justify-center text-base font-bold flex-shrink-0 rounded-xl bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent)/0.2))] text-[hsl(var(--accent-text))]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-content-primary truncate group-hover:text-[hsl(var(--accent-text))] transition-colors">{mod}</p>
                    {topicCount > 0 && (
                      <p className="text-xs text-content-tertiary">{topicCount} topics</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-content-tertiary group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.subjectId && !state.classDidNotHold && modules.length === 0 && hasPeriodSelected && (
        <button type="button" onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
          className="w-full py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "var(--shadow-accent)" }}>
          Continue to Topic
        </button>
      )}

      {state.classDidNotHold && hasPeriodSelected && (
        <button type="submit" disabled={state.submitting} className="btn-primary flex items-center justify-center gap-2">
          {state.submitting ? "Submitting..." : "Mark as Class Did Not Hold"}
        </button>
      )}
    </div>
  );
}
