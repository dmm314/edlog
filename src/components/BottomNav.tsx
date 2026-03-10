"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Clock, User, Shield, Globe, BarChart3, Calendar, Users, ClipboardList } from "lucide-react";

interface BottomNavProps {
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  activePrefix?: string;
}

function getNavTabs(role: string): NavItem[] {
  if (role === "REGIONAL_ADMIN") {
    return [
      { href: "/regional", label: "Overview", icon: Globe },
      { href: "/regional/schools", label: "Schools", icon: Home },
      { href: "/regional/reports/schools", label: "Reports", icon: BarChart3, activePrefix: "/regional/reports" },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  if (role === "SCHOOL_ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Shield },
      { href: "/admin/teachers", label: "Teachers", icon: Users },
      { href: "/admin/entry-timetable", label: "Entries", icon: ClipboardList, activePrefix: "/admin/entry-timetable" },
      { href: "/admin/timetable", label: "Timetable", icon: Calendar },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  // TEACHER (default)
  return [
    { href: "/logbook", label: "Home", icon: Home },
    { href: "/logbook/new", label: "New Entry", icon: Plus, highlight: true },
    { href: "/timetable", label: "Timetable", icon: Calendar },
    { href: "/history", label: "History", icon: Clock },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role);

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] bottom-nav"
      style={{ backgroundColor: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)" }}
    >
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const prefix = tab.activePrefix || tab.href;
          const isActive = pathname === prefix || pathname.startsWith(prefix + "/");
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5"
                aria-label={tab.label}
                style={{ marginTop: "-12px" }}
              >
                <div
                  className="flex items-center justify-center rounded-full active:scale-95 transition-transform"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    boxShadow: "0 4px 16px -4px rgba(245, 158, 11, 0.5)",
                    transitionDuration: "var(--transition-micro)",
                  }}
                >
                  <Plus className="text-white" style={{ width: "22px", height: "22px" }} strokeWidth={2.5} />
                </div>
                <span
                  className="font-bold"
                  style={{ fontSize: "10px", color: "var(--accent-text)" }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
              style={{ color: isActive ? "var(--nav-text-active)" : "var(--nav-text)" }}
              aria-label={tab.label}
            >
              <Icon style={{ width: "20px", height: "20px" }} />
              <span
                className={isActive ? "font-bold" : "font-medium"}
                style={{ fontSize: "10px" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
