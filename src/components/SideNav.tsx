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

interface SideNavProps {
  role: string;
  userName?: string;
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
      { href: "/admin/reports", label: "Reports", icon: BarChart3, activePrefix: "/admin/reports" },
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

function SideNav({ role, userName }: SideNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

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
            <p className="sidenav-user-role">
              {role === "REGIONAL_ADMIN" ? "Regional Admin" : role === "SCHOOL_ADMIN" ? "School Admin" : "Teacher"}
            </p>
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
