"use client";

import {
  Check, Info, Plus, Globe, Monitor, Smartphone,
  ClipboardList, ChevronDown,
} from "lucide-react";
import { HelpHint } from "@/components/HelpHint";
import type { EntryFormState, EntryFormAction, TopicItem } from "../types";

interface LessonDetailsSectionProps {
  state: EntryFormState;
  dispatch: React.Dispatch<EntryFormAction>;
  topicsForModule: TopicItem[];
  contextSubjectName: string;
  contextClassName: string;
  autoFamilyOfSit: string | null;
  completenessScore: number;
  userCreatedAt?: string;
}

export function LessonDetailsSection({
  state,
  dispatch,
  topicsForModule,
  contextSubjectName,
  contextClassName,
  autoFamilyOfSit,
  completenessScore,
  userCreatedAt,
}: LessonDetailsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Entry summary card */}
      <div className="card rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-content-tertiary mb-2">Entry Summary</p>
        {[
          ["Subject", contextSubjectName],
          ["Class", contextClassName + (state.additionalClassIds.length > 0 ? ` (+${state.additionalClassIds.length})` : "")],
          ["Module", state.moduleName || "—"],
          ["Topic", state.topicText || state.selectedTopicIds.map((id) => topicsForModule.find((t) => t.id === id)?.name).filter(Boolean).join(", ") || "—"],
        ].map(([label, value], idx) => (
          <div key={label} className={`flex justify-between py-2 ${idx < 3 ? "border-b border-[hsl(var(--surface-tertiary))]" : ""}`}>
            <span className="text-[13px] text-content-tertiary">{label}</span>
            <span className="text-[13px] font-semibold text-content-primary text-right max-w-[60%] truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Family of Situation */}
      {state.moduleName && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Family of Situation</p>
            <HelpHint text="The official MINSEC real-life context for this module. Auto-filled from the curriculum — you can change it if needed." position="right" createdAt={userCreatedAt} />
          </div>
          {state.familyOfSitCustom ? (
            <div className="flex gap-2">
              <input
                value={state.familyOfSituation}
                onChange={(e) => { dispatch({ type: "SET_FAMILY_OF_SITUATION", value: e.target.value }); dispatch({ type: "SET_FAMILY_OF_SIT_EDITING", value: true }); }}
                placeholder="Type custom family of situation..."
                className="input-field text-sm flex-1"
                maxLength={200}
              />
              <button type="button" onClick={() => {
                dispatch({ type: "SET_FAMILY_OF_SIT_CUSTOM", value: false });
                if (autoFamilyOfSit) { dispatch({ type: "SET_FAMILY_OF_SITUATION", value: autoFamilyOfSit }); dispatch({ type: "SET_FAMILY_OF_SIT_EDITING", value: false }); }
              }}
                className="text-xs font-medium px-3 rounded-xl"
                style={{ color: "var(--accent-text)", background: "var(--accent-soft)" }}>
                Back
              </button>
            </div>
          ) : (
            <select
              value={state.familyOfSituation}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  dispatch({ type: "SET_FAMILY_OF_SIT_CUSTOM", value: true });
                  dispatch({ type: "SET_FAMILY_OF_SITUATION", value: "" });
                  dispatch({ type: "SET_FAMILY_OF_SIT_EDITING", value: true });
                } else {
                  dispatch({ type: "SET_FAMILY_OF_SITUATION", value: e.target.value });
                  dispatch({ type: "SET_FAMILY_OF_SIT_EDITING", value: e.target.value !== autoFamilyOfSit });
                }
              }}
              className="input-field text-sm w-full"
              style={{ color: state.familyOfSituation ? "var(--text-primary)" : "var(--text-tertiary)" }}
            >
              <option value="">Select family of situation...</option>
              {autoFamilyOfSit && (
                <option value={autoFamilyOfSit}>{autoFamilyOfSit} (auto)</option>
              )}
              {(state.availableFamilies.length > 0 ? state.availableFamilies : [
                "Social and family environment",
                "Economic activity and the environment",
                "Health and well-being",
                "Media and communication",
                "Environment and sustainable development",
                "Industry and technology",
              ]).filter((f) => f !== autoFamilyOfSit).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>
          )}
        </div>
      )}

      {/* Learning Objectives Achieved */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Learning Objectives Achieved</p>
          <div className="relative group">
            <Info className="w-3.5 h-3.5 text-[var(--text-tertiary)] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 text-[11px] rounded-lg px-3 py-2 z-10"
              style={{ background: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", boxShadow: "var(--shadow-card)" }}>
              What can learners demonstrate after this lesson?
            </div>
          </div>
        </div>
        <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
          Select what learners demonstrated in this lesson
        </p>

        <ObjectivesList state={state} dispatch={dispatch} />

        {/* Integration difficulty & status */}
        {(Object.keys(state.selectedObjectives).length > 0 || state.integrationActivity) && (
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1.5">Difficulty</p>
              <div className="flex gap-1">
                {(["basic", "intermediate", "advanced"] as const).map((lvl) => (
                  <button key={lvl} type="button" onClick={() => dispatch({ type: "SET_INTEGRATION_LEVEL", value: state.integrationLevel === lvl ? "" : lvl })}
                    className="flex-1 py-2 text-xs font-semibold transition-all"
                    style={{
                      background: state.integrationLevel === lvl ? "var(--accent-soft)" : "hsl(var(--surface-tertiary))",
                      color: state.integrationLevel === lvl ? "var(--accent-text)" : "var(--text-tertiary)",
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
                  <button key={val} type="button" onClick={() => dispatch({ type: "SET_INTEGRATION_STATUS", value: state.integrationStatus === val ? "" : val })}
                    className="flex-1 py-2 text-xs font-semibold transition-all"
                    style={{
                      background: state.integrationStatus === val ? "var(--accent-soft)" : "hsl(var(--surface-tertiary))",
                      color: state.integrationStatus === val ? "var(--accent-text)" : "var(--text-tertiary)",
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

      {/* Bilingual Activity */}
      <div>
        <button type="button" onClick={() => dispatch({ type: "SET_BILINGUAL_ACTIVITY", value: !state.bilingualActivity })}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
          style={{
            borderColor: state.bilingualActivity ? "hsl(var(--accent))" : "var(--border-primary)",
            background: state.bilingualActivity ? "hsl(var(--accent-soft))" : "hsl(var(--surface-elevated))",
          }}>
          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: state.bilingualActivity ? "hsl(var(--accent))" : "var(--border-primary)", background: state.bilingualActivity ? "hsl(var(--accent))" : "hsl(var(--surface-elevated))" }}>
            {state.bilingualActivity && <Check className="w-3 h-3 text-white" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${state.bilingualActivity ? "text-[hsl(var(--accent-text))]" : "text-[var(--text-secondary)]"}`}>
              <Globe className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Bilingual activity conducted
            </p>
          </div>
        </button>
        {state.bilingualActivity && (
          <div className="mt-2 space-y-2 animate-fade-in">
            <div className="flex flex-wrap gap-1.5">
              {([["game", "Game"], ["discussion", "Discussion"], ["quiz", "Quiz"], ["role_play", "Role Play"], ["exercise", "Exercise"], ["translation", "Translation"], ["song", "Song/Poem"]] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => dispatch({ type: "SET_BILINGUAL_TYPE", value: state.bilingualType === val ? "" : val })}
                  className="text-sm transition-all"
                  style={{
                    background: state.bilingualType === val ? "var(--accent-soft)" : "hsl(var(--surface-elevated))",
                    border: state.bilingualType === val ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                    color: state.bilingualType === val ? "var(--accent-text)" : "var(--text-secondary)",
                    borderRadius: "12px", padding: "8px 16px",
                    fontWeight: state.bilingualType === val ? 600 : 500,
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <input
              value={state.bilingualNote}
              onChange={(e) => dispatch({ type: "SET_BILINGUAL_NOTE", value: e.target.value.slice(0, 200) })}
              placeholder="Brief description (optional)"
              className="input-field text-sm"
              maxLength={200}
            />
          </div>
        )}
      </div>

      {/* Lesson Mode */}
      <div>
        <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Lesson Mode</p>
        <div className="flex gap-1">
          {([["physical", "Physical", null], ["digital", "Digital", Monitor], ["hybrid", "Hybrid", Smartphone]] as const).map(([val, label, Icon]) => (
            <button key={val} type="button" onClick={() => dispatch({ type: "SET_LESSON_MODE", value: val })}
              className="flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: state.lessonMode === val ? "var(--accent-soft)" : "hsl(var(--surface-tertiary))",
                color: state.lessonMode === val ? "var(--accent-text)" : "var(--text-tertiary)",
                borderRadius: "12px",
              }}>
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
        {(state.lessonMode === "digital" || state.lessonMode === "hybrid") && (
          <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
            {["Projector", "YouTube", "Zoom/Google Meet", "WhatsApp", "PowerPoint", "Phone/Tablet", "Smart Board", "Other"].map((tool) => {
              const isSelected = state.digitalTools.includes(tool);
              return (
                <button key={tool} type="button"
                  onClick={() => dispatch({ type: "SET_DIGITAL_TOOLS", tools: isSelected ? state.digitalTools.filter((t) => t !== tool) : [...state.digitalTools, tool] })}
                  className="text-sm transition-all"
                  style={{
                    background: isSelected ? "var(--accent-soft)" : "hsl(var(--surface-elevated))",
                    border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                    color: isSelected ? "var(--accent-text)" : "var(--text-secondary)",
                    borderRadius: "12px", padding: "8px 14px",
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

      {/* Assignment Reminder Banner */}
      {state.pendingAssignmentInfo && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border-2 animate-fade-in"
          style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-soft))" }}>
          <ClipboardList className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--accent-strong))" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--accent-text))" }}>Previous assignment pending</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--accent-strong))" }}>{state.pendingAssignmentInfo}</p>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => dispatch({ type: "SET_ASSIGNMENT_REVIEWED", value: true })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: state.assignmentReviewed === true ? "hsl(var(--success) / 0.15)" : "hsl(var(--accent-soft))",
                  color: state.assignmentReviewed === true ? "hsl(var(--success))" : "hsl(var(--accent-text))",
                  border: state.assignmentReviewed === true ? "1px solid hsl(var(--success) / 0.4)" : "1px solid hsl(var(--accent) / 0.2)",
                }}>
                {state.assignmentReviewed === true && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                Reviewed
              </button>
              <button type="button" onClick={() => dispatch({ type: "SET_ASSIGNMENT_REVIEWED", value: false })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: state.assignmentReviewed === false ? "hsl(var(--danger) / 0.1)" : "hsl(var(--accent-soft))",
                  color: state.assignmentReviewed === false ? "hsl(var(--danger))" : "hsl(var(--accent-text))",
                  border: state.assignmentReviewed === false ? "1px solid hsl(var(--danger) / 0.3)" : "1px solid hsl(var(--accent) / 0.2)",
                }}>
                {state.assignmentReviewed === false && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                Not reviewed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Given Toggle */}
      <div>
        <button type="button" onClick={() => dispatch({ type: "SET_ASSIGNMENT_GIVEN", value: !state.assignmentGiven })}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all"
          style={{
            borderColor: state.assignmentGiven ? "var(--accent)" : "var(--border-primary)",
            background: state.assignmentGiven ? "var(--accent-soft)" : "hsl(var(--surface-elevated))",
          }}>
          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: state.assignmentGiven ? "var(--accent)" : "var(--border-primary)", background: state.assignmentGiven ? "var(--accent)" : "hsl(var(--surface-elevated))" }}>
            {state.assignmentGiven && <Check className="w-3 h-3 text-white" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${state.assignmentGiven ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)]"}`}>
              <ClipboardList className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Assignment given
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Did you give homework or an assignment?</p>
          </div>
        </button>
        {state.assignmentGiven && (
          <div className="mt-2 animate-fade-in">
            <input
              value={state.assignmentDetails}
              onChange={(e) => dispatch({ type: "SET_ASSIGNMENT_DETAILS", value: e.target.value.slice(0, 300) })}
              placeholder="Brief details (optional) — e.g. Exercise 3, page 45..."
              className="input-field text-sm"
              maxLength={300}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))", borderRadius: "16px" }}>
        <textarea value={state.notes} onChange={(e) => dispatch({ type: "SET_NOTES", value: e.target.value.slice(0, 500) })}
          placeholder="Optional notes — observations, challenges..." rows={3}
          className="w-full px-4 py-3.5 border-none outline-none text-sm bg-transparent resize-none"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }} maxLength={500} />
      </div>

      {/* Optional Details Collapsible */}
      <button type="button" onClick={() => dispatch({ type: "SET_SHOW_OPTIONAL_DETAILS", value: !state.showOptionalDetails })}
        className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all"
        style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))" }}>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${state.showOptionalDetails ? "rotate-180" : ""}`} />
        <span className="text-sm font-medium text-[var(--text-secondary)]">Optional details</span>
        <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">attendance, engagement, signature</span>
      </button>

      {state.showOptionalDetails && (
        <OptionalDetailsInline state={state} dispatch={dispatch} />
      )}

      {/* Mobile completeness bar */}
      <div className="lg:hidden">
        <div className="card rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-content-secondary">Entry completeness</span>
            <span className={`text-xs font-bold tabular-nums ${
              completenessScore >= 80 ? "text-[hsl(var(--success))]" : completenessScore >= 50 ? "text-[hsl(var(--accent-text))]" : "text-[hsl(var(--warning))]"
            }`}>
              {completenessScore}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[hsl(var(--surface-tertiary))]">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completenessScore}%`,
                background: completenessScore >= 80 ? "hsl(var(--success))" : completenessScore >= 50 ? "hsl(var(--accent))" : "hsl(var(--warning))",
              }}
            />
          </div>
          {completenessScore < 80 && (
            <p className="text-[11px] mt-1.5 text-content-tertiary">
              {[
                !state.notes.trim() && "notes",
                !state.engagementLevel && "engagement",
                !state.studentAttendance && "attendance",
                !state.familyOfSituation && "family of situation",
              ].filter(Boolean).slice(0, 3).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline sub-components to avoid additional files

function ObjectivesList({ state, dispatch }: { state: EntryFormState; dispatch: React.Dispatch<EntryFormAction> }) {
  const objectives = state.metadataObjectives.length > 0 ? state.metadataObjectives : [
    "identify and name measuring instruments",
    "describe and explain concepts from the lesson",
    "apply learned concepts to solve problems",
    "perform experiments and record observations",
    "analyse data and draw conclusions",
  ];

  if (state.loadingMetadata) {
    return (
      <div className="rounded-2xl border px-4 py-3 animate-pulse" style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))" }}>
        <div className="h-3 rounded w-3/4 mb-2" style={{ backgroundColor: "hsl(var(--surface-tertiary))" }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: "hsl(var(--surface-tertiary))" }} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))" }}>
      <div className="max-h-[200px] overflow-y-auto">
        {objectives.map((obj) => {
          const isSelected = obj in state.selectedObjectives;
          const proportion = state.selectedObjectives[obj] || "all";
          return (
            <div key={obj} className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--border-secondary)" }}>
              <button type="button"
                onClick={() => {
                  const next = { ...state.selectedObjectives };
                  if (isSelected) delete next[obj]; else next[obj] = "all";
                  dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: next });
                }}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ borderColor: isSelected ? "var(--accent)" : "var(--border-primary)", background: isSelected ? "var(--accent)" : "hsl(var(--surface-elevated))" }}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="text-[13px] flex-1 min-w-0" style={{ color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)" }}>{obj}</span>
              {isSelected && (
                <select value={proportion}
                  onChange={(e) => dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: { ...state.selectedObjectives, [obj]: e.target.value } })}
                  className="text-[10px] font-semibold border rounded-lg px-1.5 py-1 bg-transparent"
                  style={{ borderColor: "var(--border-primary)", color: "var(--accent-text)", minWidth: 52 }}>
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
      <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border-secondary)" }}>
        {state.showCustomObjectiveInput ? (
          <div className="flex gap-2">
            <input
              value={state.customObjective}
              onChange={(e) => dispatch({ type: "SET_CUSTOM_OBJECTIVE", value: e.target.value })}
              placeholder="describe what learners can do..."
              className="flex-1 text-[13px] bg-transparent outline-none"
              style={{ color: "var(--text-primary)" }}
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === "Enter" && state.customObjective.trim()) {
                  e.preventDefault();
                  const text = state.customObjective.trim();
                  dispatch({ type: "SET_METADATA_OBJECTIVES", objectives: [...state.metadataObjectives, text] });
                  dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: { ...state.selectedObjectives, [text]: "all" } });
                  dispatch({ type: "SET_CUSTOM_OBJECTIVE", value: "" });
                  dispatch({ type: "SET_SHOW_CUSTOM_OBJECTIVE_INPUT", value: false });
                }
              }}
            />
            <button type="button"
              onClick={() => {
                if (state.customObjective.trim()) {
                  const text = state.customObjective.trim();
                  dispatch({ type: "SET_METADATA_OBJECTIVES", objectives: [...state.metadataObjectives, text] });
                  dispatch({ type: "SET_SELECTED_OBJECTIVES", objectives: { ...state.selectedObjectives, [text]: "all" } });
                  dispatch({ type: "SET_CUSTOM_OBJECTIVE", value: "" });
                }
                dispatch({ type: "SET_SHOW_CUSTOM_OBJECTIVE_INPUT", value: false });
              }}
              className="text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ color: "var(--accent-text)" }}>
              {state.customObjective.trim() ? "Add" : "Cancel"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => dispatch({ type: "SET_SHOW_CUSTOM_OBJECTIVE_INPUT", value: true })}
            className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-text)" }}>
            <Plus className="w-3.5 h-3.5" />
            Add custom objective
          </button>
        )}
      </div>
    </div>
  );
}

function OptionalDetailsInline({ state, dispatch }: { state: EntryFormState; dispatch: React.Dispatch<EntryFormAction> }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2">
        <div className="flex-1 card p-3.5">
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-tertiary)" }}>Attendance</p>
          <input type="number" value={state.studentAttendance} onChange={(e) => dispatch({ type: "SET_STUDENT_ATTENDANCE", value: e.target.value })}
            className="w-full text-center py-2.5 text-lg font-bold font-mono bg-transparent"
            style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-primary)", borderRadius: "10px" }}
            placeholder="—" min="0" max="999" />
        </div>
        <div className="flex-1 card p-3.5">
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-tertiary)" }}>Engagement</p>
          <div className="flex gap-1">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => {
              const isActive = state.engagementLevel === level;
              const colors: Record<string, { bg: string; text: string }> = {
                HIGH: { bg: "hsl(var(--success) / 0.15)", text: "hsl(var(--success))" },
                MEDIUM: { bg: "hsl(var(--accent-soft))", text: "hsl(var(--accent-strong))" },
                LOW: { bg: "hsl(var(--danger) / 0.1)", text: "hsl(var(--danger))" },
              };
              const c = colors[level];
              return (
                <button key={level} type="button" onClick={() => dispatch({ type: "SET_ENGAGEMENT_LEVEL", value: isActive ? "" : level })}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all"
                  style={{ background: isActive ? c.bg : "hsl(var(--surface-tertiary))", color: isActive ? c.text : "var(--text-tertiary)", borderRadius: "10px" }}>
                  {level === "HIGH" ? "High" : level === "MEDIUM" ? "Med" : "Low"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="label-field">Digital Signature (Optional)</label>
        <SignaturePadLazy onSign={(data: string) => dispatch({ type: "SET_SIGNATURE_DATA", value: data })} onClear={() => dispatch({ type: "SET_SIGNATURE_DATA", value: null })} />
      </div>
    </div>
  );
}

import dynamic from "next/dynamic";

const SignaturePadLazy = dynamic(
  () => import("@/components/SignaturePad").then((mod) => mod.SignaturePad),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-sm" style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))", color: "var(--text-tertiary)" }}>
        Loading signature pad...
      </div>
    ),
  }
);
