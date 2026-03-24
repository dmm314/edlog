"use client";

import {
  CheckCircle, Save, XCircle, Layers, BookOpen, Calendar,
  Clock, Check, MessageSquare, Send, Loader2,
} from "lucide-react";
import Link from "next/link";
import type { SubmittedEntryData } from "../types";

interface EntrySuccessScreenProps {
  submittedEntries: SubmittedEntryData;
  completionTime: number;
  reflectionText: string;
  reflectionSending: boolean;
  reflectionSent: boolean;
  onReflectionChange: (text: string) => void;
  onReflectionSend: () => void;
  onNewEntry: () => void;
}

export function EntrySuccessScreen({
  submittedEntries,
  completionTime,
  reflectionText,
  reflectionSending,
  reflectionSent,
  onReflectionChange,
  onReflectionSend,
  onNewEntry,
}: EntrySuccessScreenProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--surface-canvas))" }}>
      <div className={`px-5 pt-12 pb-8 rounded-b-3xl ${
        submittedEntries.isDraft ? "bg-gradient-to-br from-[hsl(var(--accent-strong))] to-[hsl(var(--accent))]"
          : submittedEntries.classDidNotHold ? "bg-gradient-to-br from-[var(--text-secondary)] to-[var(--text-tertiary)]"
          : "bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(var(--success))]"
      }`}>
        <div className="page-shell text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-fade-in">
            {submittedEntries.isDraft ? <Save className="w-12 h-12 text-white" />
              : submittedEntries.classDidNotHold ? <XCircle className="w-12 h-12 text-white" />
              : <CheckCircle className="w-12 h-12 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-white">
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

      <div className="px-5 -mt-4 page-shell w-full flex-1">
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
            <p className="text-white font-bold text-base">{submittedEntries.subject}</p>
            <p className="text-white/70 text-xs">{submittedEntries.className} &middot; {submittedEntries.date}</p>
          </div>
          <div className="p-5 space-y-0 divide-y" style={{ borderColor: "var(--border-secondary)" }}>
            {submittedEntries.isDraft && (
              <div className="pb-3">
                <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                  <Save className="w-4 h-4" />
                  Saved as draft — complete this entry later
                </div>
              </div>
            )}
            {submittedEntries.classDidNotHold && (
              <div className="pb-3">
                <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}>
                  <XCircle className="w-4 h-4" />
                  Marked as &ldquo;Class Did Not Hold&rdquo;
                </div>
              </div>
            )}
            {!submittedEntries.classDidNotHold && (
              <div className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--accent-soft)" }}>
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
                      <div key={cell.label} className="text-center rounded-xl py-2.5 px-2" style={{ background: "hsl(var(--surface-tertiary))" }}>
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
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg border" style={{ background: "var(--accent-soft)", color: "var(--accent-text)", borderColor: "var(--accent)" }}>{cn}</span>
                  ))}
                </div>
              </div>
            )}
            {(submittedEntries.attendance || submittedEntries.engagement) && (
              <div className="py-3">
                <div className="grid grid-cols-2 gap-3">
                  {submittedEntries.attendance && (
                    <div className="text-center rounded-xl py-2.5 px-2" style={{ background: "hsl(var(--surface-tertiary))" }}>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium">Attendance</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{submittedEntries.attendance}</p>
                    </div>
                  )}
                  {submittedEntries.engagement && (
                    <div className="text-center rounded-xl py-2.5 px-2" style={{ background: "hsl(var(--surface-tertiary))" }}>
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
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--surface-tertiary))" }}>
                      <p className="text-[10px] text-[var(--text-tertiary)]">Family of Situation</p>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{submittedEntries.familyOfSituation}</p>
                    </div>
                  )}
                  {submittedEntries.lessonMode !== "physical" && (
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--surface-tertiary))" }}>
                      <p className="text-[10px] text-[var(--text-tertiary)]">Lesson Mode</p>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{submittedEntries.lessonMode.charAt(0).toUpperCase() + submittedEntries.lessonMode.slice(1)}</p>
                    </div>
                  )}
                  {submittedEntries.bilingualActivity && (
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--accent-soft))" }}>
                      <p className="text-[10px]" style={{ color: "hsl(var(--accent-strong))" }}>Bilingual Activity</p>
                      <p className="text-xs font-semibold" style={{ color: "hsl(var(--accent-text))" }}>
                        {submittedEntries.bilingualType ? submittedEntries.bilingualType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Yes"}
                      </p>
                    </div>
                  )}
                  {submittedEntries.integrationActivity && (
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--surface-tertiary))" }}>
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
                    <div className="rounded-xl py-2 px-3" style={{ background: "var(--accent-soft)" }}>
                      <p className="text-[10px]" style={{ color: "var(--accent-text)" }}>Given</p>
                      <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
                        {submittedEntries.assignmentDetails || "Yes"}
                      </p>
                    </div>
                  )}
                  {submittedEntries.assignmentReviewed === true && (
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--success) / 0.15)" }}>
                      <p className="text-[10px] text-[hsl(var(--success))]">Previous Assignment</p>
                      <p className="text-xs font-semibold text-[hsl(var(--success))]">Reviewed</p>
                    </div>
                  )}
                  {submittedEntries.assignmentReviewed === false && (
                    <div className="rounded-xl py-2 px-3" style={{ background: "hsl(var(--danger) / 0.1)" }}>
                      <p className="text-[10px] text-[hsl(var(--danger))]">Previous Assignment</p>
                      <p className="text-xs font-semibold text-[hsl(var(--danger))]">Not reviewed</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Self-Reflection */}
        {!submittedEntries.isDraft && !submittedEntries.classDidNotHold && (
          <div className="mt-4 card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[hsl(var(--success))]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Quick Reflection</h3>
              <span className="text-[10px] text-[var(--text-quaternary)]">(optional)</span>
            </div>
            <div className="p-4">
              {reflectionSent ? (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))] font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Reflection saved
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={reflectionText}
                    onChange={(e) => onReflectionChange(e.target.value)}
                    placeholder="How did the lesson go? Any notes for yourself?"
                    maxLength={1000}
                    rows={2}
                    className="w-full bg-[hsl(var(--surface-elevated))] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--success))] focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[var(--text-quaternary)]">{reflectionText.length}/1000</p>
                    <button
                      onClick={onReflectionSend}
                      disabled={!reflectionText.trim() || reflectionSending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[hsl(var(--success))] rounded-xl shadow-sm hover:bg-[hsl(var(--success))] hover:brightness-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reflectionSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3 pb-8">
          <button onClick={onNewEntry} className="btn-primary text-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
            New Entry
          </button>
          <Link href="/logbook" className="btn-secondary block text-center">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
