"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  X, Calendar, Layers, BookOpen, Monitor, Smartphone,
  Users, MessageSquare, FileText, Send, Loader2, Eye, CheckCircle,
  Flag, AlertCircle, ClipboardList, BarChart2,
} from "lucide-react";
import { getEntryCompleteness } from "@/lib/entry-completeness";

/* ─── Types ──────────────────────────────────────────────────── */

interface EntryTopic { name: string }
interface EntryView {
  viewerRole: string;
  viewerTitle: string | null;
  viewedAt: string;
  viewer: { id: string; firstName: string; lastName: string };
}
interface EntryRemark {
  id: string;
  content: string;
  remarkType: string;
  authorRole: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; role: string; photoUrl: string | null };
}
interface EntryDetail {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  status: string;
  moduleName: string | null;
  topicText: string | null;
  familyOfSituation: string | null;
  integrationActivity: string | null;
  integrationLevel: string | null;
  integrationStatus: string | null;
  bilingualActivity: boolean;
  bilingualType: string | null;
  bilingualNote: string | null;
  lessonMode: string | null;
  digitalTools: string[];
  engagementLevel: string | null;
  studentAttendance: number | null;
  assignmentGiven: boolean;
  assignmentDetails: string | null;
  assignmentReviewed: boolean | null;
  notes: string | null;
  objectives: unknown;
  signatureData: string | null;
  verifiedByName: string | null;
  verifiedByTitle: string | null;
  verifiedAt: string | null;
  classDidNotHold: boolean;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  class: { name: string; level: string };
  assignment: { subject: { name: string } } | null;
  timetableSlot: { startTime: string; endTime: string } | null;
  topics: EntryTopic[];
  remarks: EntryRemark[];
  views: EntryView[];
}

/* ─── Constants ──────────────────────────────────────────────── */

const REMARK_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; label: string }> = {
  self_reflection: { bg: "bg-[hsl(var(--success)/0.08)]", text: "text-status-success", border: "border-[hsl(var(--success)/0.2)]", bar: "bg-status-success", label: "Teacher" },
  hod_review: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-text))]", border: "border-[hsl(var(--accent)/0.2)]", bar: "bg-[hsl(var(--accent))]", label: "HOD" },
  admin_observation: { bg: "bg-[hsl(var(--info)/0.08)]", text: "text-status-info", border: "border-[hsl(var(--info)/0.2)]", bar: "bg-status-info", label: "Admin" },
  inspector_note: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-text))]", border: "border-[hsl(var(--accent)/0.2)]", bar: "bg-[hsl(var(--accent))]", label: "Inspector" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  VERIFIED: { color: "hsl(var(--success))", label: "Verified", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  FLAGGED: { color: "hsl(var(--danger))", label: "Flagged", icon: <Flag className="w-3.5 h-3.5" /> },
  SUBMITTED: { color: "hsl(var(--accent))", label: "Pending Review", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  DRAFT: { color: "hsl(var(--text-tertiary))", label: "Draft", icon: <FileText className="w-3.5 h-3.5" /> },
};

/* ─── Section helpers ────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 8 }}>
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)", minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}

function CompletenessBar({ score }: { score: number }) {
  const color = score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--accent))" : "hsl(var(--danger))";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-tertiary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color, minWidth: 36 }}>{score}%</span>
    </div>
  );
}

/* ─── Props ──────────────────────────────────────────────────── */

interface EntryDetailModalProps {
  entryId: string;
  onClose: () => void;
  /** Allow leaving remarks — pass the remark label e.g. "Inspector Note" */
  remarkLabel?: string;
  /** Accent color for the header gradient */
  accentClass?: string;
}

export function EntryDetailModal({
  entryId,
  onClose,
  remarkLabel,
  accentClass = "from-slate-900 to-slate-800",
}: EntryDetailModalProps) {
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [sendingRemark, setSendingRemark] = useState(false);
  const [remarkError, setRemarkError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/entries/${entryId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => setEntry(data))
      .catch(() => setError("Failed to load entry details"))
      .finally(() => setLoading(false));
  }, [entryId]);

  async function sendRemark() {
    if (!remarkText.trim() || !entry) return;
    setSendingRemark(true);
    setRemarkError("");
    try {
      const res = await fetch(`/api/entries/${entryId}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: remarkText.trim() }),
      });
      if (res.ok) {
        const newRemark = await res.json();
        setEntry((prev) => prev ? { ...prev, remarks: [...prev.remarks, newRemark] } : prev);
        setRemarkText("");
      } else {
        const err = await res.json();
        setRemarkError(err.error || "Failed to send remark");
      }
    } catch {
      setRemarkError("Failed to connect to server");
    } finally {
      setSendingRemark(false);
    }
  }

  const statusCfg = entry ? (STATUS_CONFIG[entry.status] || STATUS_CONFIG.SUBMITTED) : STATUS_CONFIG.SUBMITTED;
  const completeness = entry ? getEntryCompleteness({
    moduleName: entry.moduleName,
    topicText: entry.topicText,
    topics: entry.topics,
    familyOfSituation: entry.familyOfSituation,
    integrationActivity: entry.integrationActivity,
    studentAttendance: entry.studentAttendance,
    engagementLevel: entry.engagementLevel,
    objectives: entry.objectives,
  }) : null;

  const objectives = (() => {
    if (!entry?.objectives) return null;
    if (typeof entry.objectives === "string") return entry.objectives;
    if (Array.isArray(entry.objectives)) {
      return (entry.objectives as { text: string; proportion: string }[])
        .map((o) => `${o.text} (${o.proportion})`)
        .join(" · ");
    }
    return null;
  })();

  const lessonModeIcon = entry?.lessonMode === "digital"
    ? <Monitor className="w-3.5 h-3.5 text-accent-text" />
    : entry?.lessonMode === "hybrid"
    ? <Smartphone className="w-3.5 h-3.5 text-accent-text" />
    : <Users className="w-3.5 h-3.5 text-status-success" />;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header */}
        <div className={`px-5 pt-5 pb-4 bg-gradient-to-br ${accentClass} rounded-t-2xl sm:rounded-t-2xl`}>
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              <span className="text-white/60 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <p className="text-red-300 text-sm">{error}</p>
          ) : entry ? (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold bg-white/15 text-white px-2 py-0.5 rounded-md">
                  {entry.assignment?.subject.name || "No subject"}
                </span>
                <span className="text-[10px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded-md">
                  {entry.class.name}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: `${statusCfg.color}30`, color: statusCfg.color }}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
                {entry.classDidNotHold && (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-full">
                    Class did not hold
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                {entry.topicText || (entry.topics[0]?.name) || (entry.moduleName ? `Module: ${entry.moduleName}` : "No topic")}
              </h3>
              <div className="flex items-center gap-3 text-white/60 text-xs mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                {entry.period && <span>Period {entry.period}</span>}
                {entry.timetableSlot && <span>{entry.timetableSlot.startTime}–{entry.timetableSlot.endTime}</span>}
                <span>{entry.teacher.firstName} {entry.teacher.lastName}</span>
              </div>
              {/* Completeness bar */}
              {completeness && (
                <div className="mt-3">
                  <CompletenessBar score={completeness.score} />
                  {completeness.missing.length > 0 && (
                    <p className="text-[10px] text-white/40 mt-1">
                      Missing: {completeness.missing.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {entry && !loading && (
          <>
            {/* ── Section 1+2: Lesson Content ── */}
            <div className="px-5 py-4 border-b border-[var(--border-secondary)] space-y-4">
              <div>
                <SectionTitle><Layers className="w-3 h-3 inline mr-1" />Lesson Content</SectionTitle>
                <InfoRow label="Module" value={entry.moduleName} />
                <InfoRow label="Topic (free text)" value={entry.topicText} />
                {entry.topics.length > 0 && (
                  <InfoRow label="Curriculum Topics" value={entry.topics.map((t) => t.name).join(", ")} />
                )}
                <InfoRow label="Family of Situation" value={entry.familyOfSituation} />
                <InfoRow label="Notes" value={entry.notes} />
              </div>
            </div>

            {/* ── Section 3: CBA Compliance ── */}
            {(entry.integrationActivity || entry.bilingualActivity || objectives) && (
              <div className="px-5 py-4 border-b border-[var(--border-secondary)]">
                <SectionTitle><BookOpen className="w-3 h-3 inline mr-1" />CBA Compliance</SectionTitle>
                {entry.integrationActivity && (
                  <InfoRow label="Integration Activity" value={entry.integrationActivity} />
                )}
                {entry.integrationLevel && (
                  <InfoRow label="Integration Level" value={entry.integrationLevel} />
                )}
                {entry.integrationStatus && (
                  <InfoRow label="Integration Status" value={entry.integrationStatus.replace(/_/g, " ")} />
                )}
                {entry.bilingualActivity && (
                  <InfoRow
                    label="Bilingual Activity"
                    value={entry.bilingualType ? entry.bilingualType.replace(/_/g, " ") : "Yes"}
                  />
                )}
                {entry.bilingualNote && <InfoRow label="Bilingual Note" value={entry.bilingualNote} />}
                {objectives && <InfoRow label="Objectives" value={objectives} />}
              </div>
            )}

            {/* ── Section 4: Lesson Delivery ── */}
            <div className="px-5 py-4 border-b border-[var(--border-secondary)]">
              <SectionTitle>{lessonModeIcon} Lesson Delivery</SectionTitle>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: "Mode", value: entry.lessonMode ? entry.lessonMode.charAt(0).toUpperCase() + entry.lessonMode.slice(1) : "Physical" },
                  { label: "Duration", value: entry.duration ? `${entry.duration} min` : null },
                  { label: "Engagement", value: entry.engagementLevel },
                  { label: "Attendance", value: entry.studentAttendance != null ? `${entry.studentAttendance} students` : null },
                ].filter((i) => i.value).map((item) => (
                  <div key={item.label} className="rounded-lg py-1.5 px-2.5 bg-[var(--bg-tertiary)]">
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium">{item.label}</p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
              {entry.digitalTools && entry.digitalTools.length > 0 && (
                <InfoRow
                  label="Digital Tools"
                  value={<span className="flex flex-wrap gap-1">
                    {entry.digitalTools.map((t) => (
                      <span key={t} className="text-xs bg-accent-soft text-accent-text px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </span>}
                />
              )}
            </div>

            {/* ── Section 5: Assignment Tracking ── */}
            {(entry.assignmentGiven || entry.assignmentReviewed !== null) && (
              <div className="px-5 py-4 border-b border-[var(--border-secondary)]">
                <SectionTitle><ClipboardList className="w-3 h-3 inline mr-1" />Assignment Tracking</SectionTitle>
                <InfoRow label="Assignment Given" value={entry.assignmentGiven ? "Yes" : "No"} />
                {entry.assignmentGiven && entry.assignmentDetails && (
                  <InfoRow label="Details" value={entry.assignmentDetails} />
                )}
                {entry.assignmentReviewed !== null && (
                  <InfoRow label="Previous Assignment Reviewed" value={entry.assignmentReviewed ? "Yes" : "No"} />
                )}
              </div>
            )}

            {/* ── Section 6: Verification ── */}
            {(entry.verifiedByName || entry.signatureData) && (
              <div className="px-5 py-4 border-b border-[var(--border-secondary)]">
                <SectionTitle><CheckCircle className="w-3 h-3 inline mr-1 text-status-success" />Verification</SectionTitle>
                {entry.verifiedByName && (
                  <InfoRow
                    label="Verified By"
                    value={`${entry.verifiedByName}${entry.verifiedByTitle ? ` — ${entry.verifiedByTitle}` : ""}`}
                  />
                )}
                {entry.verifiedAt && (
                  <InfoRow
                    label="Verified At"
                    value={new Date(entry.verifiedAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  />
                )}
                {entry.signatureData && (
                  <div className="mt-2">
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Signature</p>
                    <Image
                      src={entry.signatureData}
                      alt="Verification signature"
                      width={240}
                      height={60}
                      unoptimized
                      style={{ maxHeight: 60, width: "auto", border: "1px solid var(--border-primary)", borderRadius: 8, background: "white", padding: 4 }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Section 7: Remarks Thread ── */}
            <div>
              <div className="px-5 py-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Remarks</h3>
                {entry.remarks.length > 0 && (
                  <span className="text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-full">
                    {entry.remarks.length}
                  </span>
                )}
              </div>

              {entry.remarks.length === 0 ? (
                <div className="px-5 py-4 text-center">
                  <p className="text-xs text-[var(--text-tertiary)]">No remarks yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-secondary)]">
                  {entry.remarks.map((remark) => {
                    const rc = REMARK_COLORS[remark.remarkType] || REMARK_COLORS.self_reflection;
                    return (
                      <div key={remark.id} className="px-5 py-3 flex gap-3">
                        <div className={`w-1 rounded-full self-stretch flex-shrink-0 ${rc.bar}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {remark.author.firstName} {remark.author.lastName}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rc.bg} ${rc.text} border ${rc.border}`}>
                              {rc.label}
                            </span>
                            <span className="text-[10px] text-[var(--text-quaternary)]">
                              {new Date(remark.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
                              {new Date(remark.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{remark.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add remark */}
              {remarkLabel && (
                <div className="px-5 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-1 mb-2">
                    <FileText className="w-3 h-3" />
                    {remarkLabel}
                  </label>
                  {remarkError && <p className="text-xs text-red-600 mb-2">{remarkError}</p>}
                  <div className="flex gap-2">
                    <textarea
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      placeholder="Leave an observation..."
                      maxLength={1000}
                      rows={2}
                      className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                    />
                    <button
                      onClick={sendRemark}
                      disabled={!remarkText.trim() || sendingRemark}
                      className="self-end w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      style={{ background: "var(--accent)", color: "white" }}
                    >
                      {sendingRemark ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-quaternary)] mt-1 text-right">{remarkText.length}/1000</p>
                </div>
              )}
            </div>

            {/* ── Section 8: View History ── */}
            {entry.views.length > 0 && (
              <div className="px-5 py-4 border-t border-[var(--border-secondary)]">
                <SectionTitle><Eye className="w-3 h-3 inline mr-1" />View History</SectionTitle>
                <div className="space-y-1">
                  {entry.views.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {v.viewer.firstName} {v.viewer.lastName}
                        {v.viewerTitle ? ` (${v.viewerTitle})` : ""}
                      </span>
                      <span className="text-[10px] text-[var(--text-quaternary)]">
                        {new Date(v.viewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completeness summary */}
            {completeness && completeness.missing.length > 0 && (
              <div className="px-5 py-4 border-t border-[var(--border-secondary)]">
                <SectionTitle><BarChart2 className="w-3 h-3 inline mr-1" />Completeness — {completeness.score}%</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {completeness.missing.map((m) => (
                    <span key={m} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]">
                      Missing: {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-6" />
          </>
        )}
      </div>
    </div>
  );
}
