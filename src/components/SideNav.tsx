"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Plus,
  Clock,
  User,
  Shield,
  Globe,
  BarChart3,
  Calendar,
  Users,
  ClipboardList,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";
import { cn } from "@/lib/utils";

interface SideNavProps {
  role: string;
  userName?: string;
  isCoordinator?: boolean;
  activeMode?: PortalMode;
  switchMode?: (mode: PortalMode) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  activePrefix?: string;
}

function getNavTabs(role: string, isCoordinator?: boolean, activeMode?: PortalMode): NavItem[] {
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
      { href: "/admin/reports", label: "Reports", icon: BarChart3, activePrefix: "/admin/reports" },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  // COORDINATOR mode
  if (isCoordinator && activeMode === "coordinator") {
    return [
      { href: "/coordinator", label: "Dashboard", icon: Shield, activePrefix: "/coordinator" },
      { href: "/coordinator/entries", label: "Entries", icon: ClipboardList, activePrefix: "/coordinator/entries" },
      { href: "/coordinator/reports", label: "Reports", icon: BarChart3, activePrefix: "/coordinator/reports" },
      { href: "/coordinator/teachers", label: "Teachers", icon: Users },
      { href: "/coordinator/timetable", label: "Timetable", icon: Calendar },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  // TEACHER mode (default)
  return [
    { href: "/logbook", label: "Home", icon: Home },
    { href: "/logbook/new", label: "New Entry", icon: Plus, highlight: true },
    { href: "/timetable", label: "Timetable", icon: Calendar },
    { href: "/history", label: "History", icon: Clock },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

function SideNav({ role, userName, isCoordinator, activeMode, switchMode }: SideNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role, isCoordinator, activeMode);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  function getRoleLabel() {
    if (role === "REGIONAL_ADMIN") return "Regional Admin";
    if (role === "SCHOOL_ADMIN") return "School Admin";
    if (isCoordinator && activeMode === "coordinator") return "VP / Coordinator";
    if (isCoordinator) return "Teacher · VP";
    return "Teacher";
  }

  function getWorkspaceLabel() {
    if (role === "REGIONAL_ADMIN") return "Regional command center";
    if (role === "SCHOOL_ADMIN") return "School operations workspace";
    if (isCoordinator && activeMode === "coordinator") return "VP review workspace";
    if (isCoordinator) return "Teacher + VP workspace";
    return "Teacher workspace";
  }

  return (
    <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[312px] lg:flex-col lg:px-5 lg:py-6">
      <div className="glass-panel flex h-full flex-col rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,hsl(var(--surface-elevated))/0.94,hsl(var(--surface-primary))/0.88)] p-4 shadow-[0_24px_90px_-42px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
        <div className="mb-4 flex items-center gap-3 rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-white/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--accent-strong)))] text-white shadow-accent">
            <span style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>E</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-[1.25rem] font-bold leading-none text-[var(--text-primary)]">Edlog</p>
            <p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">{getWorkspaceLabel()}</p>
          </div>
        </div>

        <div className="mb-3 rounded-[24px] border border-white/55 bg-white/65 p-4 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Signed in as</p>
              <h2 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{userName || "User"}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent-soft))] font-mono text-sm font-black text-[hsl(var(--accent-text))]">
              {initials}
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-secondary))] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent-text))]" />
            {getRoleLabel()}
          </div>
        </div>

        {isCoordinator && switchMode ? (
          <div className="mb-3 rounded-[24px] border border-white/55 bg-white/65 p-3 dark:bg-white/5">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Workspace</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => switchMode("teacher")}
                className={cn(
                  "rounded-2xl px-3 py-3 text-sm font-bold transition-all",
                  activeMode === "teacher"
                    ? "bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--accent-strong)))] text-white shadow-accent"
                    : "bg-[hsl(var(--surface-secondary))] text-[var(--text-secondary)] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                Teacher
              </button>
              <button
                onClick={() => switchMode("coordinator")}
                className={cn(
                  "rounded-2xl px-3 py-3 text-sm font-bold transition-all",
                  activeMode === "coordinator"
                    ? "bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] text-white shadow-[0_18px_40px_-24px_rgba(91,33,182,0.8)]"
                    : "bg-[hsl(var(--surface-secondary))] text-[var(--text-secondary)] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                VP
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {tabs.map((tab) => {
            const prefix = tab.activePrefix || tab.href;
            const isActive = pathname === prefix || pathname.startsWith(prefix + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "group flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-[linear-gradient(135deg,hsl(var(--accent-soft)),rgba(255,255,255,0.92))] text-[hsl(var(--accent-text))] shadow-[0_18px_40px_-28px_rgba(8,102,255,0.8)] ring-1 ring-[hsl(var(--accent)/0.18)]"
                    : "text-[var(--text-secondary)] hover:bg-white/70 hover:text-[var(--text-primary)] dark:hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300",
                    isActive
                      ? "border-transparent bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--accent-strong)))] text-white shadow-accent"
                      : "border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[var(--text-tertiary)] group-hover:border-[hsl(var(--accent)/0.3)] group-hover:text-[hsl(var(--accent-text))]",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{tab.label}</span>
                  {tab.highlight ? (
                    <span className="rounded-full bg-[hsl(var(--accent-soft))] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--accent-text))]">
                      New
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.62))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(15,23,42,0.22))]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-secondary))] font-mono text-sm font-black text-[var(--text-primary)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{userName || "User"}</p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">{getRoleLabel()}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[var(--text-secondary)] transition hover:border-[hsl(var(--accent)/0.3)] hover:text-[hsl(var(--accent-text))]"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export { SideNav };
export type { SideNavProps };
