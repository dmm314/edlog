"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User, Shield, Globe, BarChart3, Calendar, Users, ClipboardList, Bell } from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";
import { cn } from "@/lib/utils";

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

  if (isCoordinator && activeMode === "coordinator") {
    return [
      { href: "/coordinator", label: "Dashboard", icon: Shield, activePrefix: "/coordinator", dataTour: "nav-coordinator-dashboard" },
      { href: "/coordinator/entries", label: "Entries", icon: ClipboardList, activePrefix: "/coordinator/entries", dataTour: "nav-coordinator-entries" },
      { href: "/coordinator/reports", label: "Reports", icon: BarChart3, activePrefix: "/coordinator/reports", dataTour: "nav-coordinator-reports" },
      { href: "/coordinator/teachers", label: "Teachers", icon: Users, dataTour: "nav-coordinator-teachers" },
      { href: "/profile", label: "Profile", icon: User, dataTour: "nav-coordinator-profile" },
    ];
  }

  return [
    { href: "/logbook", label: "Home", icon: Home, dataTour: "nav-home" },
    { href: "/timetable", label: "Timetable", icon: Calendar, dataTour: "nav-timetable" },
    { href: "/logbook/new", label: "New Entry", icon: Plus, highlight: true, dataTour: "nav-new-entry" },
    { href: "/messages", label: "Notices", icon: Bell, dataTour: "nav-notices" },
    { href: "/profile", label: "Profile", icon: User, dataTour: "nav-profile" },
  ];
}

function BottomNav({ role, isCoordinator, activeMode }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role, isCoordinator, activeMode);

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 z-50 w-full pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto max-w-[640px] px-3 pb-3">
        <div className={`glass-nav grid h-[78px] items-center rounded-[28px] border border-white/60 px-2 shadow-lifted backdrop-blur-xl ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
          {tabs.map((tab) => {
            const prefix = tab.activePrefix || tab.href;
            const isActive = pathname === prefix || pathname.startsWith(`${prefix}/`);
            const Icon = tab.icon;

            if (tab.highlight) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center gap-1"
                  aria-label={tab.label}
                  data-tour={tab.dataTour}
                >
                  <span className="inline-flex min-h-11 min-w-[92px] items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#1877F2] to-[#0866FF] px-3 text-xs font-semibold text-white shadow-accent active:scale-95">
                    <Plus className="h-4 w-4" /> New
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                data-tour={tab.dataTour}
                className={cn(
                  `flex min-h-11 flex-col items-center justify-center rounded-xl text-[10px] font-medium transition ${isActive ? "text-[#0866FF]" : "text-content-tertiary"}`,
                  "group flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-300 ease-out active:scale-95",
                  isActive && "bg-[hsl(var(--accent-soft))] shadow-card",
                )}
              >
                <Icon className={`mb-1 h-[18px] w-[18px] ${isActive ? "drop-shadow-[0_0_8px_rgba(8,102,255,0.35)]" : ""}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
