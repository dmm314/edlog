"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.length);
        }
      } catch {
        // silently fail
      }
    }
    fetchUnread();
    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-10 h-10 rounded-[14px] transition-colors"
      style={{ background: "rgba(255,255,255,0.06)" }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="w-5 h-5" style={{ color: "var(--header-text-muted)" }} />
      {unreadCount > 0 && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{
            backgroundColor: "#F59E0B",
            border: "2px solid var(--header-from)",
          }}
        />
      )}
    </Link>
  );
}
