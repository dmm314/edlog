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
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: { id: string; name: string; level: string };
  topics: {
    id: string;
    name: string;
    moduleName: string | null;
    subject: { id: string; name: string; code: string };
  }[];
  assignment?: { subject: { id: string; name: string } } | null;
  timetableSlot?: {
    id: string;
    periodLabel: string;
    startTime: string;
    endTime: string;
  } | null;
  verifiedByName?: string | null;
  verifiedByTitle?: string | null;
  verifiedAt?: string | null;
}

interface CoordinatorInfo {
  id: string;
  title: string;
  levels: string[];
}

const VERIFIER_NAME_KEY = "coordinator_verifier_name";

export default function CoordinatorEntryReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Verification form state
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
        const [entryRes, dashRes] = await Promise.all([
          fetch(`/api/entries/${id}`),
          fetch("/api/coordinator/dashboard"),
        ]);

        if (entryRes.ok) {
          const data = await entryRes.json();
          setEntry(data);
        } else {
          const err = await entryRes.json();
          setError(err.error || "Failed to load entry");
        }

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setCoordinator(dashData.coordinator);
          setVerifierTitle(dashData.coordinator.title);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }

    // Pre-fill verifier name from localStorage
    const savedName = typeof window !== "undefined"
      ? localStorage.getItem(VERIFIER_NAME_KEY) || ""
      : "";
    setVerifierName(savedName);

    fetchData();
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
      // Save verifier name for next time
      localStorage.setItem(VERIFIER_NAME_KEY, verifierName.trim());

      const res = await fetch("/api/coordinator/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: id,
          status,
          remark: remark.trim() || undefined,
          verifierName: verifierName.trim(),
          verifierTitle: verifierTitle.trim(),
          signature: signature || undefined,
        }),
      });

      if (res.ok) {
        setDone(true);
        setDoneStatus(status);
        // Update local entry status
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
        <div
          className="px-5 pt-10 pb-8 rounded-b-[2rem]"
          style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
        >
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
          <Link href="/coordinator" className="text-sm font-semibold mt-3 inline-block" style={{ color: "#7C3AED" }}>
            Back to Coordinator
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

  const alreadyReviewed = entry.status === "VERIFIED" || entry.status === "FLAGGED";

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coordinator
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold bg-white/15 text-white px-2 py-0.5 rounded-md">
              {subjectName}
            </span>
            <span className="text-[10px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded-md">
              {entry.class.name}
            </span>
            {entry.status === "SUBMITTED" && (
              <span className="text-[10px] font-bold bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-md">
                Submitted
              </span>
            )}
            {entry.status === "VERIFIED" && (
              <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
            {entry.status === "FLAGGED" && (
              <span className="text-[10px] font-bold bg-red-400/20 text-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Flag className="w-3 h-3" /> Flagged
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-snug">{topicNames}</h1>
          <div className="flex items-center gap-3 text-white/60 text-xs mt-2 flex-wrap">
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
                    entry.engagementLevel === "HIGH" ? "text-emerald-600" :
                    entry.engagementLevel === "MEDIUM" ? "text-amber-600" : "text-red-500"
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
          <div
            className="card p-5 text-center animate-scale-in"
            style={{
              borderLeft: `4px solid ${doneStatus === "VERIFIED" ? "#16A34A" : "#DC2626"}`,
            }}
          >
            {doneStatus === "VERIFIED" ? (
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            ) : (
              <Flag className="w-10 h-10 text-red-500 mx-auto mb-2" />
            )}
            <p className="font-bold text-[var(--text-primary)]">
              Entry {doneStatus === "VERIFIED" ? "Verified" : "Flagged"}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {doneStatus === "VERIFIED"
                ? "The teacher has been notified."
                : "The teacher has been notified to correct this entry."}
            </p>
            <button
              onClick={() => router.push("/coordinator")}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Verification Form — only show if entry is pending and not done */}
        {!done && !alreadyReviewed && coordinator && (
          <div
            className="card overflow-hidden"
            style={{ borderTop: "3px solid #7C3AED" }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: "#5B21B6" }} />
              <h3 className="text-sm font-bold" style={{ color: "#3B0764" }}>
                Verify this entry
              </h3>
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
                  placeholder="Well documented lesson. Consider adding more detail on learner engagement..."
                  maxLength={500}
                  rows={3}
                  className="input-field resize-none"
                />
                <p className="text-[10px] text-[var(--text-quaternary)] text-right mt-1">
                  {remark.length}/500
                </p>
              </div>

              {/* Verifier Name */}
              <div>
                <label className="label-field">Your Name</label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  placeholder="Mr. Tanyi John"
                  className="input-field"
                />
              </div>

              {/* Verifier Title */}
              <div>
                <label className="label-field">Your Title</label>
                <input
                  type="text"
                  value={verifierTitle}
                  onChange={(e) => setVerifierTitle(e.target.value)}
                  placeholder="VP Form 1"
                  className="input-field"
                />
              </div>

              {/* Signature */}
              <div>
                <label className="label-field">Signature <span className="text-[var(--text-quaternary)] font-normal">(optional)</span></label>
                <SignaturePad
                  onSign={(base64) => setSignature(base64)}
                  onClear={() => setSignature("")}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit("FLAGGED")}
                  disabled={!!submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    borderColor: "#DC2626",
                    color: "#DC2626",
                    background: "transparent",
                  }}
                >
                  {submitting === "FLAGGED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Flag Entry
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("VERIFIED")}
                  disabled={!!submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: submitting ? "#16A34A99" : "#16A34A",
                  }}
                >
                  {submitting === "VERIFIED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Verify Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Already reviewed notice */}
        {alreadyReviewed && !done && (
          <div className="card p-4 flex items-center gap-3">
            {entry.status === "VERIFIED" ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Flag className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Already {entry.status === "VERIFIED" ? "verified" : "flagged"}
              </p>
              {entry.verifiedByName && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  by {entry.verifiedByName}
                  {entry.verifiedByTitle ? ` (${entry.verifiedByTitle})` : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
