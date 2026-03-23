"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  PenTool,
  Users,
  Check,
  Flag,
  Send,
  MessageSquare,
  Loader2,
  CheckCircle,
  Shield,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EntryDetail {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  moduleName: string | null;
  topicText: string | null;
  notes: string | null;
  objectives: string | null;
  status: string;
  studentAttendance: number | null;
  engagementLevel: string | null;
  createdAt: string;
  teacherId: string;
  isEditable: boolean;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    schoolId: string | null;
    school?: { name: string; regionId: string } | null;
  };
  class: { id: string; name: string };
  topics: {
    id: string;
    name: string;
    moduleName: string | null;
    subject: { id: string; name: string; code: string };
  }[];
  assignment?: {
    subject: { id: string; name: string; code: string };
  } | null;
  timetableSlot?: {
    id: string;
    periodLabel: string;
    startTime: string;
    endTime: string;
  } | null;
  verifiedByName?: string | null;
  verifiedByTitle?: string | null;
  verifiedAt?: string | null;
  verificationSignature?: string | null;
  views?: {
    viewerRole: string;
    viewerTitle: string | null;
    viewedAt: string;
    viewer: { id: string; firstName: string; lastName: string };
  }[];
  remarks?: {
    id: string;
    content: string;
    remarkType: string;
    authorRole: string;
    createdAt: string;
    author: { id: string; firstName: string; lastName: string; role: string; photoUrl: string | null };
  }[];
}

interface Remark {
  id: string;
  content: string;
  remarkType: string;
  authorRole: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    photoUrl: string | null;
  };
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RemarkRoleBadge({ authorRole, remarkType }: { authorRole: string; remarkType: string }) {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    self_reflection: { bg: "bg-[hsl(var(--success)/0.1)]", text: "text-[hsl(var(--success))]", border: "border-[hsl(var(--success)/0.2)]", label: "Teacher" },
    hod_review: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-text))]", border: "border-[hsl(var(--accent)/0.2)]", label: "HOD" },
    admin_observation: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-strong))]", border: "border-[hsl(var(--accent)/0.2)]", label: "Admin" },
    coordinator_review: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-strong))]", border: "border-[hsl(var(--accent)/0.2)]", label: "VP Review" },
    inspector_note: { bg: "bg-[hsl(var(--accent-soft))]", text: "text-[hsl(var(--accent-strong))]", border: "border-[hsl(var(--accent)/0.2)]", label: "Inspector" },
  };
  const c = config[remarkType] || config.self_reflection;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>
      {c.label}
    </span>
  );
}

function RemarkColorBar({ remarkType }: { remarkType: string }) {
  const colors: Record<string, string> = {
    self_reflection: "bg-[hsl(var(--success))]",
    hod_review: "bg-[hsl(var(--accent))]",
    admin_observation: "bg-[hsl(var(--accent))]",
    coordinator_review: "bg-[hsl(var(--accent))]",
    inspector_note: "bg-[hsl(var(--accent))]",
  };
  return <div className={`w-1 rounded-full self-stretch flex-shrink-0 ${colors[remarkType] || "bg-[var(--text-tertiary)]"}`} />;
}

export default function EntryDetailPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [sendingRemark, setSendingRemark] = useState(false);
  const [remarkError, setRemarkError] = useState("");
  const [canRemark, setCanRemark] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [entryRes, remarksRes, sessionRes] = await Promise.all([
          fetch(`/api/entries/${id}`),
          fetch(`/api/entries/${id}/remarks`),
          fetch("/api/auth/session"),
        ]);

        if (entryRes.ok) {
          const entryData = await entryRes.json();
          setEntry(entryData);
        } else {
          const err = await entryRes.json();
          setError(err.error || "Failed to load entry");
        }

        if (remarksRes.ok) {
          setRemarks(await remarksRes.json());
        }

        if (sessionRes.ok) {
          const session = await sessionRes.json();
          const userId = session?.user?.id;
          setCurrentUserId(userId);
          // Permission check is done server-side, but we show the input to all authenticated users
          // who successfully loaded the entry (they passed auth check)
          if (userId) setCanRemark(true);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function sendRemark() {
    if (!remarkText.trim()) return;
    setSendingRemark(true);
    setRemarkError("");
    try {
      const res = await fetch(`/api/entries/${id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: remarkText.trim() }),
      });
      if (res.ok) {
        const newRemark = await res.json();
        setRemarks((prev) => [...prev, newRemark]);
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

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem]">
          <div className="max-w-lg mx-auto">
            <div className="h-4 w-24 bg-white/15 rounded mb-4 animate-pulse" />
            <div className="h-6 w-48 bg-white/15 rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-[var(--skeleton-base)] rounded w-2/3 mb-3" />
              <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] font-semibold">{error || "Entry not found"}</p>
          <Link href="/logbook" className="text-sm text-[var(--accent-text)] font-semibold mt-3 inline-block">
            Go to Logbook
          </Link>
        </div>
      </div>
    );
  }

  const subjectName =
    entry.assignment?.subject?.name ||
    entry.topics?.[0]?.subject?.name ||
    "N/A";
  const topicNames =
    entry.topics?.length > 0
      ? entry.topics.map((t) => t.name).join(", ")
      : entry.topicText || "N/A";
  const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;

  const hasSeen = (entry.views?.length ?? 0) > 0;

  function getStatusBadge(status: string) {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] px-2 py-0.5 rounded-full border border-[hsl(var(--success)/0.15)]">
            <Check className="w-3 h-3" /> Verified
          </span>
        );
      case "FLAGGED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] px-2 py-0.5 rounded-full border border-[hsl(var(--danger)/0.15)]">
            <Flag className="w-3 h-3" /> Flagged
          </span>
        );
      case "DRAFT":
        return (
          <span className="text-[10px] font-bold bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
            Draft
          </span>
        );
      case "SUBMITTED":
        if (hasSeen) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] px-2 py-0.5 rounded-full border border-[hsl(var(--accent)/0.1)]">
              <CheckCircle className="w-3 h-3" /> Reviewed
            </span>
          );
        }
        return (
          <span className="text-[10px] font-bold bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
            Pending
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
            Pending
          </span>
        );
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold bg-white/15 text-white px-2 py-0.5 rounded-md">
              {subjectName}
            </span>
            <span className="text-[10px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded-md">
              {entry.class.name}
            </span>
            {getStatusBadge(entry.status)}
          </div>
          <h1 className="text-xl font-bold text-white mt-2">{topicNames}</h1>
          <div className="flex items-center gap-3 text-white/70 text-xs mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(entry.date)}
            </span>
            {entry.period && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Period {entry.period}
              </span>
            )}
            <span>{teacherName}</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* ── Verification Audit Trail ── */}
        {(entry.status === "VERIFIED" || entry.status === "FLAGGED") && (
          <div className="rounded-2xl border overflow-hidden"
            style={{
              background: entry.status === "VERIFIED" ? "hsl(var(--success) / 0.06)" : "hsl(var(--danger) / 0.06)",
              borderColor: entry.status === "VERIFIED" ? "hsl(var(--success) / 0.4)" : "hsl(var(--danger) / 0.3)",
            }}>
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${entry.status === "VERIFIED" ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}` }}>
              {entry.status === "VERIFIED"
                ? <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0" />
                : <Flag className="w-5 h-5 text-[hsl(var(--danger))] flex-shrink-0" />}
              <p className="text-sm font-bold" style={{ color: entry.status === "VERIFIED" ? "hsl(var(--success))" : "hsl(var(--danger))" }}>
                {entry.status === "VERIFIED" ? "Entry Verified" : "Entry Flagged"}
              </p>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {entry.verifiedByName && (
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: entry.status === "VERIFIED" ? "hsl(var(--success))" : "hsl(var(--danger))" }} />
                  <p className="text-xs" style={{ color: entry.status === "VERIFIED" ? "hsl(var(--success))" : "hsl(var(--danger))" }}>
                    <span className="font-semibold">{entry.verifiedByName}</span>
                    {entry.verifiedByTitle && <span className="ml-1 text-[var(--text-tertiary)]">({entry.verifiedByTitle})</span>}
                  </p>
                </div>
              )}
              {entry.verifiedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-quaternary)]" />
                  <p className="text-xs text-[var(--text-tertiary)]">{fmtDateTime(entry.verifiedAt)}</p>
                </div>
              )}
              {entry.verificationSignature && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${entry.status === "VERIFIED" ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">Signature</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.verificationSignature} alt="Verification signature"
                    className="max-h-16 rounded border" style={{ borderColor: "var(--border-secondary)" }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Seen By Info (for SUBMITTED entries viewed by coordinator/admin) ── */}
        {entry.status === "SUBMITTED" && hasSeen && entry.views && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "hsl(var(--accent-soft))", border: "1px solid hsl(var(--accent) / 0.2)" }}>
            <Eye className="w-3.5 h-3.5 flex-shrink-0 text-[hsl(var(--accent-strong))]" />
            <p className="text-xs text-[hsl(var(--accent-text))]">
              Seen by{" "}
              <span className="font-semibold">
                {entry.views.map((v) => v.viewerTitle || `${v.viewer.firstName} ${v.viewer.lastName}`).join(", ")}
              </span>
            </p>
          </div>
        )}

        {/* Entry Details Card */}
        <div className="card p-4 space-y-3.5">
          {/* Module */}
          {(entry.moduleName || entry.topics?.some((t) => t.moduleName)) && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[hsl(var(--surface-tertiary))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Module</p>
                <p className="text-sm text-[var(--text-secondary)] font-medium">
                  {entry.moduleName || entry.topics?.map((t) => t.moduleName).filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* Duration & Timetable */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[hsl(var(--surface-tertiary))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Duration</p>
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                {entry.duration} min
                {entry.timetableSlot && (
                  <span className="text-[var(--text-tertiary)] ml-2">
                    ({entry.timetableSlot.startTime} - {entry.timetableSlot.endTime})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[hsl(var(--surface-tertiary))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Notes</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{entry.notes}</p>
              </div>
            </div>
          )}

          {/* Objectives */}
          {entry.objectives && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[hsl(var(--surface-tertiary))] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <PenTool className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Objectives</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{Array.isArray(entry.objectives) ? entry.objectives.map((o: { text: string }) => o.text).join(", ") : entry.objectives}</p>
              </div>
            </div>
          )}

          {/* Attendance & Engagement */}
          {(entry.studentAttendance !== null || entry.engagementLevel) && (
            <div className="flex gap-3">
              {entry.studentAttendance !== null && (
                <div className="flex-1 bg-[hsl(var(--surface-tertiary))] rounded-xl p-3 border border-[var(--border-secondary)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Attendance</p>
                  <p className="text-sm font-bold text-[var(--text-secondary)] mt-0.5">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                    {entry.studentAttendance} students
                  </p>
                </div>
              )}
              {entry.engagementLevel && (
                <div className="flex-1 bg-[hsl(var(--surface-tertiary))] rounded-xl p-3 border border-[var(--border-secondary)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Engagement</p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    entry.engagementLevel === "HIGH" ? "text-[hsl(var(--success))]" :
                    entry.engagementLevel === "MEDIUM" ? "text-[hsl(var(--accent-strong))]" : "text-[hsl(var(--danger))]"
                  }`}>
                    {entry.engagementLevel}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remarks Section */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Remarks
            </h3>
            {remarks.length > 0 && (
              <span className="text-[10px] font-bold bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-full">
                {remarks.length}
              </span>
            )}
          </div>

          {remarks.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-[var(--text-quaternary)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-tertiary)]">No remarks yet</p>
              <p className="text-xs text-[var(--text-quaternary)] mt-1">
                Be the first to leave a remark on this entry
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-secondary)]">
              {remarks.map((remark) => (
                <div key={remark.id} className="px-4 py-3 flex gap-3">
                  <RemarkColorBar remarkType={remark.remarkType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {remark.author.firstName} {remark.author.lastName}
                      </span>
                      <RemarkRoleBadge authorRole={remark.authorRole} remarkType={remark.remarkType} />
                      <span className="text-[10px] text-[var(--text-quaternary)]">
                        {new Date(remark.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        {new Date(remark.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                      {remark.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add remark input */}
          {canRemark && (
            <div className="px-4 py-3 border-t border-[var(--border-secondary)] bg-[hsl(var(--surface-tertiary))]">
              {remarkError && (
                <p className="text-xs text-[hsl(var(--danger))] mb-2">{remarkError}</p>
              )}
              <div className="flex gap-2">
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Add a remark..."
                  maxLength={1000}
                  rows={2}
                  className="flex-1 bg-[hsl(var(--surface-elevated))] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                />
                <button
                  onClick={sendRemark}
                  disabled={!remarkText.trim() || sendingRemark}
                  className="self-end w-10 h-10 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sendingRemark ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-quaternary)] mt-1 text-right">
                {remarkText.length}/1000
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
