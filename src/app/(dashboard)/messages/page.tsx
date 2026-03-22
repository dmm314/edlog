"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Globe, Megaphone } from "lucide-react";
import type { NotificationData } from "@/types";

type Tab = "school" | "regional";

type DateGroup = "Today" | "Yesterday" | "This Week" | "Earlier";

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const h = hours % 12 || 12;
  return `${month} ${day}, ${year} · ${h}:${minutes}${ampm}`;
}

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const d = new Date(dateStr);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // Start of this week (Monday)
  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfToday.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  if (d >= startOfWeek) return "This Week";
  return "Earlier";
}

function groupMessagesByDate(
  messages: NotificationData[]
): { group: DateGroup; messages: NotificationData[] }[] {
  const order: DateGroup[] = ["Today", "Yesterday", "This Week", "Earlier"];
  const grouped: Record<DateGroup, NotificationData[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  for (const msg of messages) {
    const group = getDateGroup(msg.createdAt);
    grouped[group].push(msg);
  }

  return order
    .filter((g) => grouped[g].length > 0)
    .map((g) => ({ group: g, messages: grouped[g] }));
}

function SenderBadge({ senderRole }: { senderRole: string | null }) {
  if (senderRole === "REGIONAL_ADMIN") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          background: "hsl(var(--info) / 0.12)",
          color: "hsl(var(--info))",
        }}
      >
        <Globe className="w-3 h-3" />
        From Regional Admin
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: "rgba(var(--accent-rgb, 99,102,241), 0.12)",
        color: "var(--accent)",
      }}
    >
      <Building2 className="w-3 h-3" />
      From School
    </span>
  );
}

export default function MessagesPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("school");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently fail
    }
  }

  const schoolMessages = notifications.filter(
    (n) =>
      n.type === "SCHOOL_ANNOUNCEMENT" ||
      (n.type === "GENERAL" && n.senderRole === "SCHOOL_ADMIN")
  );

  const regionalMessages = notifications.filter(
    (n) =>
      n.type === "REGIONAL_ANNOUNCEMENT" ||
      (n.type === "GENERAL" && n.senderRole === "REGIONAL_ADMIN")
  );

  const messages = activeTab === "school" ? schoolMessages : regionalMessages;
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--header-from)] to-[var(--header-to)] px-5 pt-10 pb-4 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => history.back()}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <h1
            className="text-white"
            style={{ fontFamily: "var(--font-body)", fontSize: "18px", fontWeight: 700 }}
          >
            Messages
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 max-w-lg mx-auto">
        <div
          className="flex mt-3 rounded-xl overflow-hidden border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-primary)",
          }}
        >
          <button
            onClick={() => setActiveTab("school")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: activeTab === "school" ? "var(--accent)" : "transparent",
              color: activeTab === "school" ? "white" : "var(--text-secondary)",
              borderRadius: activeTab === "school" ? "10px" : "0",
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            School
            {schoolMessages.filter((n) => !n.isRead).length > 0 && (
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                {schoolMessages.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("regional")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: activeTab === "regional" ? "var(--accent)" : "transparent",
              color: activeTab === "regional" ? "white" : "var(--text-secondary)",
              borderRadius: activeTab === "regional" ? "10px" : "0",
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            Regional
            {regionalMessages.filter((n) => !n.isRead).length > 0 && (
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                {regionalMessages.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="px-5 mt-3 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-full mb-1" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-elevated)" }}
            >
              <Megaphone className="w-8 h-8 text-[var(--text-quaternary)]" />
            </div>
            <p
              className="font-semibold text-base mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              No announcements yet
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              {activeTab === "school"
                ? "When your school admin sends announcements, they will appear here."
                : "When the regional administration sends announcements, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map(({ group, messages: groupMsgs }) => (
              <div key={group}>
                {/* Date group label */}
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {group}
                  </p>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--border-primary)" }}
                  />
                </div>

                <div className="space-y-2">
                  {groupMsgs.map((msg) => (
                    <button
                      key={msg.id}
                      className="w-full text-left"
                      onClick={() => {
                        if (!msg.isRead) markAsRead(msg.id);
                      }}
                    >
                      <div
                        className="card p-4 transition-all"
                        style={{
                          background: !msg.isRead
                            ? "var(--accent-light)"
                            : "var(--bg-elevated)",
                          borderColor: !msg.isRead
                            ? "var(--accent)"
                            : "var(--border-primary)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderLeftWidth: !msg.isRead ? "3px" : "1px",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SenderBadge senderRole={msg.senderRole} />
                            {!msg.isRead && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  background: "var(--accent)",
                                  color: "white",
                                }}
                              >
                                New
                              </span>
                            )}
                          </div>
                          {!msg.isRead && (
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                              style={{
                                background:
                                  activeTab === "school"
                                    ? "var(--accent)"
                                    : "hsl(var(--info))",
                              }}
                            />
                          )}
                        </div>
                        <h4
                          className="mt-1.5"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "15px",
                            fontWeight: !msg.isRead ? 700 : 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {msg.title}
                        </h4>
                        <p
                          className="whitespace-pre-wrap mt-1"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "14px",
                            color: !msg.isRead
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.message}
                        </p>
                        <p
                          className="mt-2"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {formatMessageDate(msg.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
