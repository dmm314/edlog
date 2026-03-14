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

  return (
    <nav className="sidenav">
      {/* Logo */}
      <div className="sidenav-logo">
        <div className="sidenav-logo-icon">
          <span style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>E</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Edlog
        </span>
      </div>

      {/* Mode switcher for dual-role users */}
      {isCoordinator && switchMode && (
        <div className="px-3 mb-2">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <button
              onClick={() => switchMode("teacher")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeMode === "teacher" ? "var(--bg-elevated)" : "transparent",
                color: activeMode === "teacher" ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: activeMode === "teacher" ? "var(--shadow-card)" : "none",
              }}
            >
              Teacher
            </button>
            <button
              onClick={() => switchMode("coordinator")}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeMode === "coordinator" ? "#7C3AED" : "transparent",
                color: activeMode === "coordinator" ? "white" : "var(--text-tertiary)",
              }}
            >
              VP
            </button>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div className="sidenav-items">
        {tabs.map((tab) => {
          const prefix = tab.activePrefix || tab.href;
          const isActive = pathname === prefix || pathname.startsWith(prefix + "/");
          const Icon = tab.icon;

          return (
            <Link key={tab.href} href={tab.href} className={`sidenav-item ${isActive ? "sidenav-item-active" : ""}`}>
              <Icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="sidenav-user">
        <div className="sidenav-user-info">
          <div className="sidenav-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="sidenav-user-name">{userName || "User"}</p>
            <p className="sidenav-user-role">{getRoleLabel()}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidenav-signout" aria-label="Sign out">
          <LogOut style={{ width: "16px", height: "16px" }} />
        </button>
      </div>
    </nav>
  );
}

export { SideNav };
export type { SideNavProps };
