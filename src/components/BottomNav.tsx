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
      { href: "/coordinator/teachers", label: "Teachers", icon: Users, activePrefix: "/coordinator/teachers", dataTour: "nav-coordinator-teachers" },
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
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "mx-auto grid h-16 max-w-[640px] items-center px-2",
          tabs.length === 4 ? "grid-cols-4" : "grid-cols-5",
        )}
      >
        {tabs.map((tab) => {
          const prefix = tab.activePrefix || tab.href;
          const isActive = pathname === prefix || pathname.startsWith(`${prefix}/`);
          const Icon = tab.icon;

          /* ─ Center highlight button (New Entry) ─ */
          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1"
                aria-label={tab.label}
                data-tour={tab.dataTour}
              >
                <span className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white active:scale-95">
                  <Plus className="h-4 w-4" /> New
                </span>
              </Link>
            );
          }

          /* ─ Regular nav tab ─ */
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              data-tour={tab.dataTour}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] font-medium active:scale-95",
                isActive
                  ? "text-[hsl(var(--accent))]"
                  : "text-[hsl(var(--text-tertiary))]",
              )}
            >
              <Icon className="h-[20px] w-[20px]" />
              <span className={cn("font-semibold", isActive && "font-bold")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
