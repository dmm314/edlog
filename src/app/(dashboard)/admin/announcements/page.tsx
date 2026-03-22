"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, CheckCircle, AlertTriangle, Clock, Users, Search, X, Check, Send, History, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentAnnouncement {
  title: string;
  message: string;
  createdAt: string;
  count: number;
}

type DateGroup = "Today" | "Yesterday" | "This Week" | "Earlier";

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfToday.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  if (d >= startOfWeek) return "This Week";
  return "Earlier";
}

function groupAnnouncementsByDate(
  items: RecentAnnouncement[]
): { group: DateGroup; items: RecentAnnouncement[] }[] {
  const order: DateGroup[] = ["Today", "Yesterday", "This Week", "Earlier"];
  const grouped: Record<DateGroup, RecentAnnouncement[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };
  for (const item of items) {
    grouped[getDateGroup(item.createdAt)].push(item);
  }
  return order
    .filter((g) => grouped[g].length > 0)
    .map((g) => ({ group: g, items: grouped[g] }));
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }
  return formatDate(dateStr);
}

interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
  subjects: string[];
  membershipStatus: string;
}

function SentAnnouncementHistory({ announcements }: { announcements: RecentAnnouncement[] }) {
  const [expanded, setExpanded] = useState(false);
  const grouped = groupAnnouncementsByDate(announcements.slice(0, 10));

  // Show only the first 3 when collapsed
  const visibleCount = expanded ? Math.min(announcements.length, 10) : 3;
  let shown = 0;

  return (
    <div
      className="border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-primary)",
        borderRadius: "16px",
        padding: "18px",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--text-tertiary)]" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Sent History
          </h3>
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-tertiary)",
          }}
        >
          {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {grouped.map(({ group, items }) => {
          const groupItems: RecentAnnouncement[] = [];
          for (const item of items) {
            if (shown >= visibleCount) break;
            groupItems.push(item);
            shown++;
          }
          if (groupItems.length === 0) return null;

          return (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {group}
                </p>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border-secondary)" }}
                />
              </div>
              <div className="space-y-2.5">
                {groupItems.map((ann, i) => (
                  <div
                    key={`${group}-${i}`}
                    className="rounded-xl p-3.5 border"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold text-[var(--text-primary)] leading-snug"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {ann.title}
                        </p>
                        <p
                          className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 whitespace-pre-wrap leading-relaxed"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {ann.message}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <Users className="w-3 h-3 text-[hsl(var(--accent))]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                          {ann.count}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-[var(--text-quaternary)]" />
                      <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                        {getRelativeTime(ann.createdAt)}
                      </span>
                      <span className="text-[11px] text-[var(--text-quaternary)]">
                        &middot;
                      </span>
                      <span
                        className="text-[11px] text-[var(--text-quaternary)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatDate(ann.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {announcements.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 mt-3 pt-3 text-xs font-semibold transition-colors"
          style={{
            color: "var(--accent-text)",
            borderTop: "1px solid var(--border-secondary)",
          }}
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View all {Math.min(announcements.length, 10)} announcements <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
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

  // Teacher filtering
  const [sendToAll, setSendToAll] = useState(true);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [teacherSearch, setTeacherSearch] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

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

  useEffect(() => {
    if (!sendToAll && teachers.length === 0) {
      setLoadingTeachers(true);
      fetch("/api/admin/teachers")
        .then((r) => r.json())
        .then((data: TeacherInfo[]) => {
          const active = (Array.isArray(data) ? data : []).filter(
            (t) => t.membershipStatus === "ACTIVE"
          );
          setTeachers(active);
        })
        .catch(() => {})
        .finally(() => setLoadingTeachers(false));
    }
  }, [sendToAll, teachers.length]);

  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const q = teacherSearch.toLowerCase();
    return teachers.filter(
      (t) =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q))
    );
  }, [teachers, teacherSearch]);

  const recipientCount = sendToAll ? teacherCount : selectedTeacherIds.size;

  function toggleTeacher(id: string) {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      for (const t of filteredTeachers) next.add(t.id);
      return next;
    });
  }

  function deselectAll() {
    setSelectedTeacherIds(new Set());
  }

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
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          ...(sendToAll ? {} : { teacherIds: Array.from(selectedTeacherIds) }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.teacherCount);
        // Add to recent
        setRecentAnnouncements((prev) => [
          { title: title.trim(), message: message.trim(), createdAt: new Date().toISOString(), count: data.teacherCount },
          ...prev,
        ].slice(0, 10));
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
        className="px-5 pt-10 pb-8 rounded-b-2xl"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[hsl(var(--accent-soft))]0/20 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-[hsl(var(--accent-glow))]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Announcements</h1>
              <p className="text-white/70 text-sm mt-0.5">
                Broadcast messages to your teachers
              </p>
            </div>
          </div>
          {teacherCount !== null && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
                <Users className="w-3.5 h-3.5 text-[hsl(var(--accent-glow))]" />
                <span className="text-xs font-semibold text-white/80">
                  {teacherCount} active teacher{teacherCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
                <History className="w-3.5 h-3.5 text-[hsl(var(--accent-glow))]" />
                <span className="text-xs font-semibold text-white/80">
                  {recentAnnouncements.length} sent
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-6 max-w-lg mx-auto space-y-6 desktop-content-form">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success state */}
        {success !== null ? (
          <div
            className="border text-center"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "16px",
              padding: "40px 24px",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-body)" }}>
              Announcement Sent!
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5" style={{ fontFamily: "var(--font-body)" }}>
              Delivered to {success} teacher{success !== 1 ? "s" : ""} successfully
            </p>
            <button
              onClick={() => { setSuccess(null); setSendToAll(true); setSelectedTeacherIds(new Set()); }}
              className="mt-6 px-8 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-strong)))",
                color: "hsl(var(--accent-soft))",
                boxShadow: "0 2px 8px hsl(var(--accent) / 0.25)",
              }}
            >
              Send Another
            </button>
          </div>
        ) : (
        /* Compose Form */
        <form onSubmit={handleSubmit}>
          <div
            className="border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Send className="w-4 h-4 text-[var(--text-tertiary)]" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                Compose Announcement
              </h2>
            </div>

            <div className="space-y-5">
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

            {/* Recipient selector */}
            <div>
              <label
                className="block font-semibold text-[var(--text-tertiary)] mb-2"
                style={{ fontSize: "13px" }}
              >
                Recipients
              </label>
              <div
                className="flex rounded-xl overflow-hidden border"
                style={{
                  borderColor: "var(--border-primary)",
                  background: "var(--bg-secondary)",
                }}
              >
                <button
                  type="button"
                  onClick={() => { setSendToAll(true); setSelectedTeacherIds(new Set()); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: sendToAll ? "var(--accent)" : "transparent",
                    color: sendToAll ? "white" : "var(--text-secondary)",
                    borderRadius: sendToAll ? "10px" : "0",
                  }}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Teachers
                </button>
                <button
                  type="button"
                  onClick={() => setSendToAll(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: !sendToAll ? "var(--accent)" : "transparent",
                    color: !sendToAll ? "white" : "var(--text-secondary)",
                    borderRadius: !sendToAll ? "10px" : "0",
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  Select Teachers
                </button>
              </div>

              {/* Teacher picker */}
              {!sendToAll && (
                <div
                  className="mt-3 border rounded-xl overflow-hidden"
                  style={{
                    borderColor: "var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {/* Search */}
                  <div className="relative px-3 py-2" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-quaternary)]" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search by name or subject..."
                      className="w-full bg-transparent pl-6 pr-6 py-1 text-sm outline-none"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                    />
                    {teacherSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherSearch("")}
                        className="absolute right-5 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3.5 h-3.5 text-[var(--text-quaternary)]" />
                      </button>
                    )}
                  </div>

                  {/* Select all / Deselect */}
                  <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    <span className="text-xs font-semibold text-[var(--text-tertiary)]">
                      {selectedTeacherIds.size} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "var(--accent-text)" }}
                      >
                        Select all
                      </button>
                      {selectedTeacherIds.size > 0 && (
                        <button
                          type="button"
                          onClick={deselectAll}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teacher list */}
                  <div className="max-h-48 overflow-y-auto">
                    {loadingTeachers ? (
                      <div className="py-6 text-center">
                        <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                      </div>
                    ) : filteredTeachers.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--text-tertiary)]">
                        {teachers.length === 0 ? "No active teachers found" : "No teachers match your search"}
                      </p>
                    ) : (
                      filteredTeachers.map((t) => {
                        const selected = selectedTeacherIds.has(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTeacher(t.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{
                              borderBottom: "1px solid var(--border-secondary)",
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                background: selected ? "var(--accent)" : "var(--bg-elevated)",
                                border: selected ? "none" : "1.5px solid var(--border-primary)",
                              }}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {t.firstName} {t.lastName}
                              </p>
                              {t.subjects.length > 0 && (
                                <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                                  {t.subjects.join(", ")}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {(title.trim() || message.trim()) && (
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border-secondary)" }}>
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
            disabled={sending || !title.trim() || !message.trim() || (!sendToAll && selectedTeacherIds.size === 0)}
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
                {recipientCount !== null && recipientCount > 0
                  ? `Send to ${recipientCount} teacher${recipientCount !== 1 ? "s" : ""}`
                  : sendToAll
                    ? "Send Announcement"
                    : "Select teachers to send"}
              </>
            )}
          </button>
        </form>
        )}

        {/* Sent Announcement History */}
        {recentAnnouncements.length > 0 && (
          <SentAnnouncementHistory announcements={recentAnnouncements} />
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
                {recipientCount ?? "all"} teacher{recipientCount !== 1 ? "s" : ""}
              </strong>
              {!sendToAll && " (selected)"}?
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
