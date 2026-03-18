"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Globe,
  Home,
  Plus,
  Shield,
  User,
  Users,
} from "lucide-react";
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
    { href: "/logbook", label: "Feed", icon: Home, dataTour: "nav-home" },
    { href: "/logbook/new", label: "Compose", icon: Plus, highlight: true, dataTour: "nav-new-entry" },
    { href: "/timetable", label: "Timetable", icon: Calendar, dataTour: "nav-timetable" },
    { href: "/history", label: "History", icon: ClipboardList, dataTour: "nav-history" },
    { href: "/profile", label: "Profile", icon: User, dataTour: "nav-profile" },
  ];
}

function BottomNav({ role, isCoordinator, activeMode }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role, isCoordinator, activeMode);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-mobile rounded-[28px] border border-[var(--nav-border)] bg-[var(--nav-bg)] px-2 py-2 shadow-nav backdrop-blur-2xl">
        <div className="grid grid-cols-5 items-end gap-1">
          {tabs.map((tab) => {
            const prefix = tab.activePrefix || tab.href;
            const isActive = pathname === prefix || pathname.startsWith(`${prefix}/`);
            const Icon = tab.icon;

            if (tab.highlight) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  data-tour={tab.dataTour}
                  className="flex flex-col items-center gap-1 pb-0.5"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dynamic-accent text-white shadow-float transition-transform duration-300 ease-out active:scale-95 motion-safe:animate-nav-bob">
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--nav-text-active)]">
                    {tab.label}
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
                  "group flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-300 ease-out active:scale-95",
                  isActive && "bg-[hsl(var(--accent-soft))] shadow-card",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                    isActive ? "scale-105 bg-[hsl(var(--accent-glow)/0.18)] text-[var(--nav-text-active)] shadow-accent" : "text-[var(--nav-text)] group-hover:text-[var(--nav-text-active)]",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2.2} />
                </span>
                <span className={cn("text-[10px] font-bold tracking-[0.04em]", isActive ? "text-[var(--nav-text-active)]" : "text-[var(--nav-text)]")}>{tab.label}</span>
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
