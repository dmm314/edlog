"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellOff,
  CheckCheck,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Users,
  Info,
  ChevronUp,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { NotificationData } from "@/types";

function getNotificationIcon(type: string) {
  switch (type) {
    case "LOG_REMINDER":
      return <BookOpen className="w-4 h-4 text-blue-500" />;
    case "WEEKLY_SUMMARY":
      return <BarChart3 className="w-4 h-4 text-purple-500" />;
    case "COMPLIANCE_WARNING":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "LOG_REVIEWED":
      return <CheckCheck className="w-4 h-4 text-green-500" />;
    case "NEW_TEACHER":
      return <Users className="w-4 h-4 text-indigo-500" />;
    case "CURRICULUM_GAP":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "SCHOOL_ANNOUNCEMENT":
    case "REGIONAL_ANNOUNCEMENT":
      return <Megaphone className="w-4 h-4 text-amber-500" />;
    default:
      return <Info className="w-4 h-4 text-[var(--text-tertiary)]" />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const count = notifications.filter(
      (n) =>
        !n.isRead &&
        (n.type === "SCHOOL_ANNOUNCEMENT" || n.type === "REGIONAL_ANNOUNCEMENT")
    ).length;
    setUnreadAnnouncements(count);
  }, [notifications]);

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

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    }
  }

  function handleNotificationTap(notification: NotificationData) {
    if (notification.link) return;
    if (expandedId === notification.id) {
      setExpandedId(null);
    } else {
      setExpandedId(notification.id);
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => history.back()}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm text-white/70 hover:text-white flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-brand-400 text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {/* View Announcements link */}
        <Link
          href="/messages"
          className="flex items-center justify-between p-3.5 mb-3 rounded-2xl border active:scale-[0.98] transition-all"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              View Announcements
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadAnnouncements > 0 && (
              <span className="text-[10px] font-bold text-white bg-amber-500 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadAnnouncements}
              </span>
            )}
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </div>
        </Link>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] font-medium">No notifications yet</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              You&apos;ll see updates here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isExpanded = expandedId === notification.id;
              const isLongMessage = notification.message.length > 80;

              const content = (
                <div
                  className={`card p-4 flex gap-3 transition-colors ${
                    !notification.isRead
                      ? "bg-brand-50/50 border-brand-100"
                      : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm ${
                          !notification.isRead
                            ? "font-semibold text-[var(--text-primary)]"
                            : "font-medium text-[var(--text-secondary)]"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p
                      className={`text-xs text-[var(--text-tertiary)] mt-0.5 ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {notification.message}
                    </p>
                    {/* "Tap to read more" for long collapsed messages without link */}
                    {!isExpanded && !notification.link && isLongMessage && (
                      <p
                        className="mt-1"
                        style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
                      >
                        Tap to read more
                      </p>
                    )}
                    {/* Collapse indicator when expanded */}
                    {isExpanded && (
                      <div
                        className="flex items-center gap-1 mt-2 pb-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <ChevronUp className="w-3 h-3" />
                        <span style={{ fontSize: "11px" }}>Show less</span>
                      </div>
                    )}
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );

              if (notification.link) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={notification.id}
                  className="w-full text-left"
                  onClick={() => handleNotificationTap(notification)}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
