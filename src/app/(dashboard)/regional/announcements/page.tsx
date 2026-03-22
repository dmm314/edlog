"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, CheckCircle, AlertTriangle, Search, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

type TargetMode = "all" | "school" | "teacher";

interface SchoolOption {
  id: string;
  name: string;
  code: string;
}

interface TeacherResult {
  id: string;
  name: string;
  schoolName: string;
}

interface RecentAnnouncement {
  title: string;
  message: string;
  createdAt: string;
  count: number;
}

export default function RegionalAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [schoolCount, setSchoolCount] = useState<number | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);

  // Targeting state
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
  const [teacherResults, setTeacherResults] = useState<TeacherResult[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherResult | null>(null);
  const [searchingTeachers, setSearchingTeachers] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/regional/notifications/broadcast");
        if (res.ok) {
          const data = await res.json();
          setTeacherCount(data.teacherCount);
          setSchoolCount(data.schoolCount);
          setSchools(data.schools || []);
          setRecentAnnouncements(data.recentAnnouncements || []);
        }
      } catch {
        // silently fail
      }
    }
    fetchCounts();
  }, []);

  // Debounced teacher search
  const searchTeachers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setTeacherResults([]);
      return;
    }
    setSearchingTeachers(true);
    try {
      const res = await fetch(`/api/regional/teachers?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setTeacherResults(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setSearchingTeachers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetMode === "teacher" && !selectedTeacher) {
        searchTeachers(teacherQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [teacherQuery, targetMode, selectedTeacher, searchTeachers]);

  function getRecipientCount(): string {
    if (targetMode === "teacher") return selectedTeacher ? "1" : "0";
    if (targetMode === "school") {
      return selectedSchoolId ? "school's teachers" : "0";
    }
    return teacherCount !== null ? `${teacherCount}` : "all";
  }

  function getRecipientLabel(): string {
    if (targetMode === "teacher" && selectedTeacher) return `Send to ${selectedTeacher.name}`;
    if (targetMode === "school" && selectedSchoolId) {
      const school = schools.find((s) => s.id === selectedSchoolId);
      return school ? `Send to teachers at ${school.name}` : "Send Announcement";
    }
    if (teacherCount !== null) return `Send to ${teacherCount} teacher${teacherCount !== 1 ? "s" : ""}`;
    return "Send Announcement";
  }

  function canSend(): boolean {
    if (!title.trim() || !message.trim()) return false;
    if (targetMode === "school" && !selectedSchoolId) return false;
    if (targetMode === "teacher" && !selectedTeacher) return false;
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Please enter a title"); return; }
    if (!message.trim()) { setError("Please enter a message"); return; }
    if (targetMode === "school" && !selectedSchoolId) { setError("Please select a school"); return; }
    if (targetMode === "teacher" && !selectedTeacher) { setError("Please select a teacher"); return; }
    setShowConfirm(true);
  }

  async function handleSend() {
    setShowConfirm(false);
    setSending(true);
    setError("");

    try {
      const payload: Record<string, string> = {
        title: title.trim(),
        message: message.trim(),
        target: targetMode,
      };
      if (targetMode === "school") payload.schoolId = selectedSchoolId;
      if (targetMode === "teacher" && selectedTeacher) payload.teacherId = selectedTeacher.id;

      const res = await fetch("/api/regional/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.teacherCount);
        setRecentAnnouncements((prev) => [
          { title: title.trim(), message: message.trim(), createdAt: new Date().toISOString(), count: data.teacherCount },
          ...prev,
        ].slice(0, 5));
        setTitle("");
        setMessage("");
        setSelectedTeacher(null);
        setTeacherQuery("");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send announcement");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-2xl"
        style={{ background: "linear-gradient(135deg, var(--header-from) 0%, var(--header-via) 50%, var(--header-to) 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--success)/0.2)] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[hsl(var(--success))]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Regional Announcement</h1>
              <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
                Broadcast to teachers in your region
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4 desktop-content-form">
        {/* Success */}
        {success !== null && (
          <div className="flex items-center gap-2 bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] text-sm rounded-xl px-4 py-3 animate-slide-down">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Announcement sent to {success} teacher{success !== 1 ? "s" : ""}!
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-[hsl(var(--danger)/0.1)] border border-[hsl(var(--danger)/0.2)] text-[hsl(var(--danger))] text-sm rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Large audience warning */}
        {targetMode === "all" && teacherCount !== null && teacherCount > 50 && (
          <div className="flex items-center gap-2 bg-[hsl(var(--accent-soft))] border border-[hsl(var(--accent)/0.2)] text-[hsl(var(--accent-text))] text-sm rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            This will send to {teacherCount} teachers across {schoolCount ?? "multiple"} schools.
          </div>
        )}

        {/* Targeting Options */}
        <div
          className="border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-primary)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
            Send to
          </label>
          <div className="space-y-2">
            {[
              { value: "all" as const, label: "All teachers in region", sub: teacherCount !== null ? `${teacherCount} teachers` : "" },
              { value: "school" as const, label: "Teachers at a specific school", sub: "" },
              { value: "teacher" as const, label: "A specific teacher", sub: "" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: targetMode === opt.value ? "hsl(var(--success) / 0.08)" : "var(--bg-secondary)",
                  border: targetMode === opt.value ? "1px solid hsl(var(--success) / 0.3)" : "1px solid var(--border-secondary)",
                }}
              >
                <input
                  type="radio"
                  name="target"
                  value={opt.value}
                  checked={targetMode === opt.value}
                  onChange={() => {
                    setTargetMode(opt.value);
                    setSelectedTeacher(null);
                    setTeacherQuery("");
                    setSelectedSchoolId("");
                  }}
                  className="mt-0.5 accent-[hsl(var(--success))]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                  {opt.sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{opt.sub}</p>}
                </div>
              </label>
            ))}
          </div>

          {/* School selector */}
          {targetMode === "school" && (
            <div className="mt-3">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="input-field text-sm"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="">Select a school...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Teacher search */}
          {targetMode === "teacher" && (
            <div className="mt-3">
              {selectedTeacher ? (
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.3)" }}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedTeacher.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{selectedTeacher.schoolName}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedTeacher(null); setTeacherQuery(""); }}
                    className="text-xs font-semibold text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={teacherQuery}
                      onChange={(e) => setTeacherQuery(e.target.value)}
                      className="input-field pl-9 text-sm"
                      placeholder="Search teacher name..."
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                  {searchingTeachers && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-2 px-1">Searching...</p>
                  )}
                  {teacherResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {teacherResults.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTeacher(t);
                            setTeacherResults([]);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{t.schoolName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {teacherQuery.length >= 2 && !searchingTeachers && teacherResults.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-2 px-1">No teachers found</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            className="border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) setTitle(e.target.value);
                  }}
                  className="input-field"
                  placeholder="e.g., Regional Staff Update"
                  style={{ fontFamily: "var(--font-body)", fontSize: "15px" }}
                />
                <p className="text-right text-xs text-[var(--text-tertiary)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                  {title.length}/100
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setMessage(e.target.value);
                  }}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Write your message to teachers..."
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
                />
                <p className="text-right text-xs text-[var(--text-tertiary)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                  {message.length}/500
                </p>
              </div>
            </div>

            {/* Preview */}
            {(title.trim() || message.trim()) && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  Preview
                </p>
                <div
                  className="border rounded-xl p-3"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
                    {title.trim() || "Untitled"}
                  </p>
                  {message.trim() && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-wrap" style={{ fontFamily: "var(--font-body)" }}>
                      {message.trim()}
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--text-quaternary)] mt-2" style={{ fontFamily: "var(--font-body)" }}>
                    Just now
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || !canSend()}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.85))",
              color: "hsl(var(--success) / 0.05)",
              boxShadow: "0 2px 8px hsl(var(--success) / 0.3)",
            }}
          >
            {sending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                {getRecipientLabel()}
              </>
            )}
          </button>
        </form>

        {/* Recent Announcements */}
        {recentAnnouncements.length > 0 && (
          <div
            className="border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              Recent Announcements
            </h3>
            <div className="space-y-3">
              {recentAnnouncements.map((ann, i) => (
                <div
                  key={i}
                  className="pb-3"
                  style={{
                    borderBottom: i < recentAnnouncements.length - 1 ? "1px solid var(--border-secondary)" : "none",
                  }}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
                    {ann.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>
                    {ann.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock className="w-3 h-3 text-[var(--text-quaternary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatDate(ann.createdAt)}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      · {ann.count} recipient{ann.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div
            className="w-full max-w-sm border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success)/0.1)] flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-[hsl(var(--success))]" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
                Confirm Announcement
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1" style={{ fontFamily: "var(--font-body)" }}>
              {targetMode === "teacher" && selectedTeacher
                ? `Send this announcement to ${selectedTeacher.name}?`
                : targetMode === "school" && selectedSchoolId
                ? `Send this announcement to teachers at ${schools.find((s) => s.id === selectedSchoolId)?.name}?`
                : `Send this announcement to ${getRecipientCount()} teachers?`}
            </p>
            {targetMode === "all" && schoolCount !== null && (
              <p className="text-xs text-[var(--text-tertiary)] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Across {schoolCount} school{schoolCount !== 1 ? "s" : ""} in your region
              </p>
            )}

            {/* Preview in modal */}
            <div
              className="border rounded-xl p-3 mb-5"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">{title.trim()}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{message.trim()}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)))",
                  color: "hsl(var(--success) / 0.06)",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
