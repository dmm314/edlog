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

  return [
    { href: "/logbook", label: "Home", icon: Home },
    { href: "/logbook/new", label: "New Entry", icon: Plus, highlight: true },
    { href: "/timetable", label: "Timetable", icon: Calendar },
    { href: "/history", label: "History", icon: Clock },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

function getRoleDotClass(role: string, isCoordinator?: boolean, activeMode?: PortalMode): string {
  if (role === "REGIONAL_ADMIN") return "role-dot role-dot-regional";
  if (role === "SCHOOL_ADMIN") return "role-dot role-dot-admin";
  if (isCoordinator && activeMode === "coordinator") return "role-dot role-dot-coordinator";
  return "role-dot role-dot-teacher";
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

  return (
    <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[264px] lg:flex-col lg:border-r lg:border-[hsl(var(--border-primary))] lg:bg-[hsl(var(--surface-elevated))]">
      <div className="flex h-full flex-col px-4 py-5">
        {/* Brand */}
        <div className="mb-5 flex items-center gap-2.5 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-extrabold text-white">
            E
          </div>
          <span className="font-display text-lg font-bold text-[hsl(var(--text-primary))]">Edlog</span>
        </div>

        {/* User info */}
        <div className="mb-4 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-tertiary))] font-mono text-sm font-bold text-[hsl(var(--text-primary))]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[hsl(var(--text-primary))]">{userName || "User"}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={getRoleDotClass(role, isCoordinator, activeMode)} />
                <span className="text-xs text-[hsl(var(--text-tertiary))]">{getRoleLabel()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        {isCoordinator && switchMode ? (
          <div className="mb-4 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-2">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => switchMode("teacher")}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  activeMode === "teacher"
                    ? "bg-accent text-white"
                    : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                Teacher
              </button>
              <button
                onClick={() => switchMode("coordinator")}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  activeMode === "coordinator"
                    ? "bg-accent text-white"
                    : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                VP
              </button>
            </div>
          </div>
        ) : null}

        {/* Nav links */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const prefix = tab.activePrefix || tab.href;
            const isActive = pathname === prefix || pathname.startsWith(prefix + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--accent-soft))] font-semibold text-[hsl(var(--accent-text))]"
                    : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary))] hover:text-[hsl(var(--text-primary))]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{tab.label}</span>
                {tab.highlight ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                    New
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="mt-4 border-t border-[hsl(var(--border-muted))] pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--text-secondary))] transition-colors hover:bg-[hsl(var(--surface-tertiary))] hover:text-[hsl(var(--text-primary))]"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

export { SideNav };
export type { SideNavProps };
