"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CheckCircle,
  Loader2,
  MessageSquare,
  Eye,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SignaturePad } from "@/components/SignaturePad";

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
  teacher: { id: string; firstName: string; lastName: string; email: string };
  class: { id: string; name: string; level: string };
  topics: {
    id: string; name: string; moduleName: string | null;
    subject: { id: string; name: string; code: string };
  }[];
  assignment?: { subject: { id: string; name: string } } | null;
  timetableSlot?: { id: string; periodLabel: string; startTime: string; endTime: string } | null;
  verifiedByName?: string | null;
  verifiedByTitle?: string | null;
  verifiedAt?: string | null;
  verificationSignature?: string | null;
  remarks?: {
    id: string; content: string; remarkType: string; authorRole: string; createdAt: string;
    author: { firstName: string; lastName: string };
  }[];
}

interface CoordinatorInfo { id: string; title: string; levels: string[] }

const VERIFIER_NAME_KEY = "coordinator_verifier_name";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function CoordinatorEntryReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [remark, setRemark] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [verifierTitle, setVerifierTitle] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState<"VERIFIED" | "FLAGGED" | null>(null);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [doneStatus, setDoneStatus] = useState<"VERIFIED" | "FLAGGED" | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [entryRes, checkRes] = await Promise.all([
          fetch(`/api/entries/${id}`),
          fetch("/api/coordinator/check"),
        ]);

        if (entryRes.ok) {
          const data = await entryRes.json();
          setEntry(data);
        } else {
          const err = await entryRes.json();
          setError(err.error || "Failed to load entry");
        }

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCoordinator({ id: "", title: checkData.title || "Level Coordinator", levels: checkData.levels || [] });
          setVerifierTitle(checkData.title || "Level Coordinator");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }

    const savedName = typeof window !== "undefined"
      ? localStorage.getItem(VERIFIER_NAME_KEY) || ""
      : "";
    setVerifierName(savedName);
    // Auto-fill remark with default "Seen ✓" placeholder for verify
    setRemark("Seen ✓");

    fetchData();

    // Record that this coordinator has seen this entry
    fetch(`/api/entries/${id}/view`, { method: "POST" }).catch(() => {});
  }, [id]);

  async function handleSubmit(status: "VERIFIED" | "FLAGGED") {
    if (status === "FLAGGED" && !remark.trim()) {
      setFormError("A remark is required when flagging an entry.");
      return;
    }
    if (!verifierName.trim()) {
      setFormError("Your name is required.");
      return;
    }

    setFormError("");
    setSubmitting(status);

    try {
      localStorage.setItem(VERIFIER_NAME_KEY, verifierName.trim());

      // Clear default "Seen ✓" if unchanged and verifying (optional) — send as-is
      const effectiveRemark = remark.trim() === "Seen ✓" && status === "VERIFIED"
        ? undefined
        : remark.trim() || undefined;

      const res = await fetch("/api/coordinator/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: id,
          status,
          remark: effectiveRemark,
          verifierName: verifierName.trim(),
          verifierTitle: verifierTitle.trim(),
          signature: signature || undefined,
        }),
      });

      if (res.ok) {
        setDone(true);
        setDoneStatus(status);
        setEntry((prev) => prev ? { ...prev, status } : prev);
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to submit. Please try again.");
      }
    } catch {
      setFormError("Failed to connect to server.");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="px-5 pt-10 pb-8 rounded-b-[2rem]"
          style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}>
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
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] font-semibold">{error || "Entry not found"}</p>
          <Link href="/coordinator" className="text-sm font-semibold mt-3 inline-block" style={{ color: "hsl(var(--accent))" }}>
            Back to Coordinator
          </Link>
        </div>
      </div>
    );
  }

  const subjectName = entry.assignment?.subject?.name || entry.topics?.[0]?.subject?.name || "N/A";
  const topicNames = entry.topics?.length > 0
    ? entry.topics.map((t) => t.name).join(", ")
    : entry.topicText || "N/A";
  const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
  const alreadyReviewed = entry.status === "VERIFIED" || entry.status === "FLAGGED";

  // Find coordinator_review remark if already reviewed
  const coordRemark = entry.remarks?.find((r) => r.remarkType === "coordinator_review");

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <Link href="/coordinator"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Coordinator
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md border border-white/10">{subjectName}</span>
            <span className="text-[10px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-md border border-white/10">{entry.class.name}</span>
            {entry.status === "SUBMITTED" && (
              <span className="text-[10px] font-bold bg-[hsl(var(--accent)/0.2)] text-[hsl(var(--accent)/0.7)] px-2 py-0.5 rounded-md">Submitted</span>
            )}
            {entry.status === "VERIFIED" && (
              <span className="text-[10px] font-bold bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success)/0.7)] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
            {entry.status === "FLAGGED" && (
              <span className="text-[10px] font-bold bg-[hsl(var(--danger)/0.2)] text-[hsl(var(--danger)/0.7)] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Flag className="w-3 h-3" /> Flagged
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-snug">{topicNames}</h1>
          <div className="flex items-center gap-3 text-white/70 text-xs mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />{formatDate(entry.date)}
            </span>
            {entry.period && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Period {entry.period}</span>
            )}
            <span>{teacherName}</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* ── Verification Audit Trail (already reviewed) ── */}
        {alreadyReviewed && (
          <div className="rounded-2xl border overflow-hidden"
            style={{
              background: entry.status === "VERIFIED" ? "hsl(var(--success) / 0.06)" : "hsl(var(--danger) / 0.06)",
              borderColor: entry.status === "VERIFIED" ? "hsl(var(--success) / 0.4)" : "hsl(var(--danger) / 0.3)",
            }}>
            {/* Header row */}
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${entry.status === "VERIFIED" ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}` }}>
              {entry.status === "VERIFIED"
                ? <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0" />
                : <Flag className="w-5 h-5 text-[hsl(var(--danger))] flex-shrink-0" />}
              <p className="text-sm font-bold" style={{ color: entry.status === "VERIFIED" ? "hsl(var(--success))" : "hsl(var(--danger))" }}>
                {entry.status === "VERIFIED" ? "Entry Verified" : "Entry Flagged"}
              </p>
            </div>
            {/* Audit detail */}
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
              {coordRemark && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${entry.status === "VERIFIED" ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Remark</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    &ldquo;{coordRemark.content}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entry Details Card */}
        <div className="card p-4 space-y-3.5">
          {(entry.moduleName || entry.topics?.some((t) => t.moduleName)) && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
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

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Duration</p>
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                {entry.duration} min
                {entry.timetableSlot && (
                  <span className="text-[var(--text-tertiary)] ml-2">
                    ({entry.timetableSlot.startTime} – {entry.timetableSlot.endTime})
                  </span>
                )}
              </p>
            </div>
          </div>

          {entry.notes && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Notes</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{entry.notes}</p>
              </div>
            </div>
          )}

          {entry.objectives && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <PenTool className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Objectives</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {Array.isArray(entry.objectives)
                    ? (entry.objectives as { text: string }[]).map((o) => o.text).join(", ")
                    : entry.objectives}
                </p>
              </div>
            </div>
          )}

          {(entry.studentAttendance !== null || entry.engagementLevel) && (
            <div className="flex gap-3">
              {entry.studentAttendance !== null && (
                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Attendance</p>
                  <p className="text-sm font-bold text-[var(--text-secondary)] mt-0.5">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                    {entry.studentAttendance} students
                  </p>
                </div>
              )}
              {entry.engagementLevel && (
                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
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

        {/* Success state after verification */}
        {done && doneStatus && (
          <div className="card p-5 text-center animate-scale-in"
            style={{ borderLeft: `4px solid ${doneStatus === "VERIFIED" ? "hsl(var(--success))" : "hsl(var(--danger))"}` }}>
            {doneStatus === "VERIFIED"
              ? <CheckCircle className="w-10 h-10 text-[hsl(var(--success))] mx-auto mb-2" />
              : <Flag className="w-10 h-10 text-[hsl(var(--danger))] mx-auto mb-2" />}
            <p className="font-bold text-[var(--text-primary)]">
              Entry {doneStatus === "VERIFIED" ? "Verified" : "Flagged"}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {doneStatus === "VERIFIED"
                ? "The teacher has been notified."
                : "The teacher has been notified to correct this entry."}
            </p>
            <button onClick={() => router.push("/coordinator")}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "hsl(var(--accent))" }}>
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Verification Form — only show if entry is pending and not done */}
        {!done && !alreadyReviewed && coordinator && (
          <div className="card overflow-hidden" style={{ borderTop: "3px solid hsl(var(--accent))" }}>
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, hsl(var(--accent-soft)), hsl(var(--accent-soft)))" }}>
              <Eye className="w-4 h-4" style={{ color: "hsl(var(--accent-text))" }} />
              <h3 className="text-sm font-bold" style={{ color: "hsl(var(--accent-text))" }}>Review this entry</h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Remark */}
              <div>
                <label className="label-field">
                  Remark{" "}
                  <span className="text-[var(--text-quaternary)] font-normal">
                    (optional for verify, required to flag)
                  </span>
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Seen ✓"
                  maxLength={500}
                  rows={3}
                  className="input-field resize-none"
                />
                <p className="text-[10px] text-[var(--text-quaternary)] text-right mt-1">{remark.length}/500</p>
              </div>

              {/* Verifier Name */}
              <div>
                <label className="label-field">Your Name</label>
                <input type="text" value={verifierName} onChange={(e) => setVerifierName(e.target.value)}
                  placeholder="Mr. Tanyi John" className="input-field" />
              </div>

              {/* Verifier Title */}
              <div>
                <label className="label-field">Your Title</label>
                <input type="text" value={verifierTitle} onChange={(e) => setVerifierTitle(e.target.value)}
                  placeholder="VP Form 1" className="input-field" />
              </div>

              {/* Signature */}
              <div>
                <label className="label-field">Signature <span className="text-[var(--text-quaternary)] font-normal">(optional)</span></label>
                <SignaturePad onSign={(base64) => setSignature(base64)} onClear={() => setSignature("")} />
              </div>

              {formError && (
                <p className="text-sm text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.1)] rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => handleSubmit("FLAGGED")} disabled={!!submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ borderColor: "hsl(var(--danger))", color: "hsl(var(--danger))", background: "transparent" }}>
                  {submitting === "FLAGGED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  Flag Entry
                </button>
                <button type="button" onClick={() => handleSubmit("VERIFIED")} disabled={!!submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: submitting ? "hsl(var(--success) / 0.6)" : "hsl(var(--success))" }}>
                  {submitting === "VERIFIED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Verify Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View indicator — show to coordinators when entry is still submitted */}
        {!alreadyReviewed && !done && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)" }}>
            <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
            <p className="text-xs text-[var(--text-tertiary)]">
              This entry has been marked as <span className="font-semibold text-[var(--text-secondary)]">seen by you</span>.
            </p>
          </div>
        )}

        {/* Remarks history */}
        {entry.remarks && entry.remarks.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Remarks</h3>
              <span className="text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-full">
                {entry.remarks.length}
              </span>
            </div>
            <div className="divide-y divide-[var(--border-secondary)]">
              {entry.remarks.map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {r.author.firstName} {r.author.lastName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: r.remarkType === "coordinator_review" ? "hsl(var(--accent-soft))" : "var(--bg-tertiary)",
                        color: r.remarkType === "coordinator_review" ? "hsl(var(--accent-text))" : "var(--text-tertiary)",
                      }}>
                      {r.remarkType === "coordinator_review" ? "VP Review" : r.remarkType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-[var(--text-quaternary)]">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
