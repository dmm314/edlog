"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentAnnouncement {
  title: string;
  message: string;
  createdAt: string;
  count: number;
}

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/notifications/broadcast");
        if (res.ok) {
          const data = await res.json();
          setTeacherCount(data.teacherCount);
          setRecentAnnouncements(data.recentAnnouncements || []);
        }
      } catch {
        // silently fail
      }
    }
    fetchData();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }
    setShowConfirm(true);
  }

  async function handleSend() {
    setShowConfirm(false);
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.teacherCount);
        // Add to recent
        setRecentAnnouncements((prev) => [
          { title: title.trim(), message: message.trim(), createdAt: new Date().toISOString(), count: data.teacherCount },
          ...prev,
        ].slice(0, 5));
        setTitle("");
        setMessage("");
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
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Send Announcement</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Message all teachers in your school
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success state — replaces the form */}
        {success !== null ? (
          <div
            className="border text-center"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "16px",
              padding: "32px 18px",
            }}
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
              Announcement sent to {success} teacher{success !== 1 ? "s" : ""}!
            </p>
            <button
              onClick={() => setSuccess(null)}
              className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#FFFBEB",
              }}
            >
              Send another
            </button>
          </div>
        ) : (
        /* Form */
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
                <label
                  className="block font-semibold text-[var(--text-tertiary)] mb-2"
                  style={{ fontSize: "13px" }}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) setTitle(e.target.value);
                  }}
                  className="input-field"
                  placeholder="e.g., Staff Meeting Friday"
                  style={{ fontFamily: "var(--font-body)", fontSize: "15px" }}
                />
                <p className="text-right text-xs text-[var(--text-tertiary)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
                  {title.length}/100
                </p>
              </div>

              <div>
                <label
                  className="block font-semibold text-[var(--text-tertiary)] mb-2"
                  style={{ fontSize: "13px" }}
                >
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setMessage(e.target.value);
                  }}
                  rows={5}
                  className="input-field resize-none"
                  placeholder="Write your message to all teachers..."
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
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-secondary)",
                  }}
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
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#FFFBEB",
              boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
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
                {teacherCount !== null
                  ? `Send to ${teacherCount} teacher${teacherCount !== 1 ? "s" : ""}`
                  : "Send Announcement"}
              </>
            )}
          </button>
        </form>
        )}

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
            <h3
              className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3"
            >
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
                Confirm Announcement
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5" style={{ fontFamily: "var(--font-body)" }}>
              Send this announcement to{" "}
              <strong className="text-[var(--text-primary)]">
                {teacherCount ?? "all"} teacher{teacherCount !== 1 ? "s" : ""}
              </strong>
              ?
            </p>

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
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#FFFBEB",
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
