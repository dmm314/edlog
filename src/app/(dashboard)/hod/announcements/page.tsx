"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, CheckCircle, AlertTriangle, Crown } from "lucide-react";

export default function HODAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/hod/notifications/broadcast");
        if (res.ok) {
          const data = await res.json();
          setTeacherCount(data.teacherCount);
        }
      } catch {
        // silently fail
      }
    }
    fetchCount();
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
      const res = await fetch("/api/hod/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.teacherCount);
        setTitle("");
        setMessage("");
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-2xl"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/hod"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent-soft))]0/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[hsl(var(--accent-glow))]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Department Announcement</h1>
              <p className="text-white/70 text-sm mt-0.5">
                Send a message to teachers in your department
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Success message */}
        {success !== null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 animate-slide-down">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Announcement sent to {success} teacher{success !== 1 ? "s" : ""}!
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            className="border"
            style={{
              background: "hsl(var(--surface-elevated))",
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
                  placeholder="e.g., Department Meeting Update"
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
                  placeholder="Write your message to department teachers..."
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
                    background: "hsl(var(--surface-secondary))",
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
              background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-strong)))",
              color: "hsl(var(--accent-soft))",
              boxShadow: "0 2px 8px hsl(var(--accent) / 0.3)",
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
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div
            className="w-full max-w-sm border"
            style={{
              background: "hsl(var(--surface-elevated))",
              borderColor: "var(--border-primary)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
                Confirm Announcement
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5" style={{ fontFamily: "var(--font-body)" }}>
              Send this announcement to{" "}
              <strong className="text-[var(--text-primary)]">
                {teacherCount ?? "all"} teacher{teacherCount !== 1 ? "s" : ""}
              </strong>{" "}
              in your department?
            </p>

            {/* Preview in modal */}
            <div
              className="border rounded-xl p-3 mb-5"
              style={{ background: "hsl(var(--surface-secondary))", borderColor: "var(--border-secondary)" }}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">{title.trim()}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{message.trim()}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  background: "hsl(var(--surface-secondary))",
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
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-strong)))",
                  color: "hsl(var(--accent-soft))",
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
