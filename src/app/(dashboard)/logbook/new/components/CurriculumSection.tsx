"use client";

import { Layers, Check, Copy, Info } from "lucide-react";
import { HelpHint } from "@/components/HelpHint";
import type { EntryFormState, EntryFormAction, TopicItem } from "../types";

interface CurriculumSectionProps {
  state: EntryFormState;
  dispatch: React.Dispatch<EntryFormAction>;
  topicsForModule: TopicItem[];
  contextSubjectName: string;
  selectedClassLevel: string;
  otherClassesForSubject: { classId: string; className: string; assignmentId: string }[];
  userCreatedAt?: string;
}

export function CurriculumSection({
  state,
  dispatch,
  topicsForModule,
  contextSubjectName,
  selectedClassLevel,
  otherClassesForSubject,
  userCreatedAt,
}: CurriculumSectionProps) {
  const toggleAdditionalClass = (cId: string) => {
    const prev = state.additionalClassIds;
    dispatch({
      type: "SET_ADDITIONAL_CLASS_IDS",
      ids: prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId],
    });
  };

  return (
    <div className="space-y-4 animate-slide-in-right">
      {state.moduleName && (
        <div className="inline-flex items-center gap-2 text-xs font-semibold"
          style={{ background: "hsl(var(--accent-soft))", border: "1px solid hsl(var(--accent))", color: "hsl(var(--accent-text))", borderRadius: "10px", padding: "6px 12px" }}>
          <Layers className="w-3 h-3" />
          {state.moduleName}
        </div>
      )}

      <p className="text-[13px] text-[var(--text-tertiary)]">
        {topicsForModule.length > 0 ? "Additional notes on topic (optional)" : "What topic did you cover?"}
      </p>

      <div className="border overflow-hidden" style={{ borderColor: "var(--border-primary)", background: "hsl(var(--surface-elevated))", borderRadius: "16px" }}>
        <input id="topic-input-field" value={state.topicText} onChange={(e) => dispatch({ type: "SET_TOPIC_TEXT", text: e.target.value.slice(0, 300) })}
          placeholder="e.g. Laws of reflection, image formation..."
          className="w-full px-4 py-3.5 border-none outline-none text-[15px] bg-transparent"
          style={{ color: "var(--text-primary)" }} maxLength={300} />
      </div>
      {state.topicText.length > 0 && <p className="text-xs text-[var(--text-tertiary)] text-right">{state.topicText.length}/300</p>}

      {topicsForModule.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
              {contextSubjectName} {selectedClassLevel}{state.moduleName ? ` · ${state.moduleName}` : ""} · {topicsForModule.length} topics in syllabus
            </p>
            <HelpHint text="Tap the specific topics you covered. This tracks your syllabus progress automatically." position="right" createdAt={userCreatedAt} />
          </div>
          <p className="text-[11px] font-semibold uppercase text-[var(--text-tertiary)]" style={{ letterSpacing: "0.06em" }}>Or select from curriculum</p>
          <div className="flex flex-wrap gap-1.5">
            {topicsForModule.map((topic) => {
              const isSel = state.selectedTopicIds.includes(topic.id);
              return (
                <button key={topic.id} type="button"
                  onClick={() => {
                    if (isSel) {
                      dispatch({ type: "SET_SELECTED_TOPIC_IDS", ids: state.selectedTopicIds.filter((id) => id !== topic.id) });
                    } else {
                      dispatch({ type: "SET_SELECTED_TOPIC_IDS", ids: [...state.selectedTopicIds, topic.id] });
                      dispatch({ type: "SET_TOPIC_TEXT", text: topic.name });
                    }
                  }}
                  className="text-sm transition-all"
                  style={{
                    background: isSel ? "var(--accent-soft)" : "hsl(var(--surface-elevated))",
                    border: isSel ? "2px solid var(--accent)" : "1px solid var(--border-primary)",
                    color: isSel ? "var(--accent-text)" : "var(--text-secondary)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    minHeight: "44px",
                    fontWeight: isSel ? 600 : 500,
                  }}>
                  {isSel && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {topic.name}
                </button>
              );
            })}
          </div>
          {state.topicText.length > 0 && state.selectedTopicIds.length === 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-body)", fontSize: 11, color: "hsl(var(--accent-strong))",
              background: "hsl(var(--accent-soft))", borderRadius: 8, padding: "8px 12px",
            }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              Tip: Selecting topics from the curriculum above helps your school track syllabus progress.
            </div>
          )}
        </>
      )}

      {/* Multi-class option */}
      {state.subjectId && otherClassesForSubject.length > 0 && (
        <div>
          <label className="label-field flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
            Also submit for other classes?
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {otherClassesForSubject.map((oc) => {
              const isSel = state.additionalClassIds.includes(oc.classId);
              return (
                <button key={oc.classId} type="button" onClick={() => toggleAdditionalClass(oc.classId)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: isSel ? "var(--accent)" : "var(--border-primary)",
                    background: isSel ? "var(--accent-soft)" : "hsl(var(--surface-elevated))",
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

      <button type="button" onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
        disabled={!state.topicText.trim() && state.selectedTopicIds.length === 0}
        className="w-full font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          background: (state.topicText.trim() || state.selectedTopicIds.length > 0) ? "linear-gradient(135deg, var(--accent), var(--accent-hover))" : "hsl(var(--surface-tertiary))",
          color: (state.topicText.trim() || state.selectedTopicIds.length > 0) ? "white" : "var(--text-tertiary)",
          boxShadow: (state.topicText.trim() || state.selectedTopicIds.length > 0) ? "var(--shadow-accent)" : "none",
          padding: "16px",
          borderRadius: "16px",
        }}>
        Continue
      </button>
    </div>
  );
}
