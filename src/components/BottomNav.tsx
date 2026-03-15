"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Clock, User, Shield, Globe, BarChart3, Calendar, Users, ClipboardList } from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";

interface BottomNavProps {
  role: string;
  isCoordinator?: boolean;
  activeMode?: PortalMode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  activePrefix?: string;
  dataTour?: string;
}

function getNavTabs(role: string, isCoordinator?: boolean, activeMode?: PortalMode): NavItem[] {
  if (role === "REGIONAL_ADMIN") {
    return [
      { href: "/regional", label: "Overview", icon: Globe, dataTour: "nav-regional-overview" },
      { href: "/regional/schools", label: "Schools", icon: Home, dataTour: "nav-regional-schools" },
      { href: "/regional/reports/schools", label: "Reports", icon: BarChart3, activePrefix: "/regional/reports", dataTour: "nav-regional-reports" },
      { href: "/profile", label: "Profile", icon: User, dataTour: "nav-regional-profile" },
    ];
  }

  if (role === "SCHOOL_ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Shield, dataTour: "nav-admin-dashboard" },
      { href: "/admin/teachers", label: "Teachers", icon: Users, dataTour: "nav-admin-teachers" },
      { href: "/admin/entry-timetable", label: "Entries", icon: ClipboardList, activePrefix: "/admin/entry-timetable", dataTour: "nav-admin-entries" },
      { href: "/admin/timetable", label: "Timetable", icon: Calendar, dataTour: "nav-admin-timetable" },
      { href: "/profile", label: "Profile", icon: User, dataTour: "nav-admin-profile" },
    ];
  }

  // COORDINATOR mode (only when user is coordinator AND mode is coordinator)
  if (isCoordinator && activeMode === "coordinator") {
    return [
      { href: "/coordinator", label: "Dashboard", icon: Shield, activePrefix: "/coordinator", dataTour: "nav-coordinator-dashboard" },
      { href: "/coordinator/entries", label: "Entries", icon: ClipboardList, activePrefix: "/coordinator/entries", dataTour: "nav-coordinator-entries" },
      { href: "/coordinator/reports", label: "Reports", icon: BarChart3, activePrefix: "/coordinator/reports", dataTour: "nav-coordinator-reports" },
      { href: "/coordinator/teachers", label: "Teachers", icon: Users, dataTour: "nav-coordinator-teachers" },
      { href: "/profile", label: "Profile", icon: User, dataTour: "nav-coordinator-profile" },
    ];
  }

  // TEACHER mode (default — even if user is a coordinator)
  return [
    { href: "/logbook", label: "Home", icon: Home, dataTour: "nav-home" },
    { href: "/logbook/new", label: "New Entry", icon: Plus, highlight: true, dataTour: "nav-new-entry" },
    { href: "/timetable", label: "Timetable", icon: Calendar, dataTour: "nav-timetable" },
    { href: "/history", label: "History", icon: Clock, dataTour: "nav-history" },
    { href: "/profile", label: "Profile", icon: User, dataTour: "nav-profile" },
  ];
}

function BottomNav({ role, isCoordinator, activeMode }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role, isCoordinator, activeMode);

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
                data-tour={tab.dataTour}
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
              data-tour={tab.dataTour}
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
