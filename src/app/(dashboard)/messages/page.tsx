"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Globe, Mail } from "lucide-react";
import type { NotificationData } from "@/types";

type Tab = "school" | "regional";

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
            <Mail className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] font-medium text-sm">
              {activeTab === "school"
                ? "No messages from your school yet"
                : "No messages from regional administration yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <button
                key={msg.id}
                className="w-full text-left"
                onClick={() => {
                  if (!msg.isRead) markAsRead(msg.id);
                }}
              >
                <div
                  className={`card p-4 transition-colors ${
                    !msg.isRead ? "bg-[var(--accent-light)] border-[var(--border-secondary)]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {msg.title}
                    </h4>
                    {!msg.isRead && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                        style={{
                          background:
                            activeTab === "school"
                              ? "var(--accent)"
                              : "#3B82F6",
                        }}
                      />
                    )}
                  </div>
                  <p
                    className="whitespace-pre-wrap"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      color: "var(--text-secondary)",
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
        )}
      </div>
    </div>
  );
}
