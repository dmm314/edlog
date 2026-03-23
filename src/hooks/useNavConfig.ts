"use client";

import { usePathname } from "next/navigation";
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
  Bell,
} from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  activePrefix?: string;
  dataTour?: string;
  isActive?: boolean;
}

function getNavItems(
  role: string,
  isCoordinator?: boolean,
  activeMode?: PortalMode,
): NavItem[] {
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
      { href: "/admin/reports", label: "Reports", icon: BarChart3, activePrefix: "/admin/reports", dataTour: "nav-admin-reports" },
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

export function getRoleDotClass(
  role: string,
  isCoordinator?: boolean,
  activeMode?: PortalMode,
): string {
  if (role === "REGIONAL_ADMIN") return "role-dot role-dot-regional";
  if (role === "SCHOOL_ADMIN") return "role-dot role-dot-admin";
  if (isCoordinator && activeMode === "coordinator") return "role-dot role-dot-coordinator";
  return "role-dot role-dot-teacher";
}

export function getRoleLabel(
  role: string,
  isCoordinator?: boolean,
  activeMode?: PortalMode,
): string {
  if (role === "REGIONAL_ADMIN") return "Regional Admin";
  if (role === "SCHOOL_ADMIN") return "School Admin";
  if (isCoordinator && activeMode === "coordinator") return "VP / Coordinator";
  if (isCoordinator) return "Teacher · VP";
  return "Teacher";
}

export function useNavConfig(
  role: string,
  isCoordinator?: boolean,
  activeMode?: PortalMode,
): NavItem[] {
  const pathname = usePathname();
  const items = getNavItems(role, isCoordinator, activeMode);

  return items.map((item) => {
    const prefix = item.activePrefix || item.href;
    const isActive = pathname === prefix || pathname.startsWith(prefix + "/");
    return { ...item, isActive };
  });
}
