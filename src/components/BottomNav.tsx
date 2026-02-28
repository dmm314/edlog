"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Clock, User, Shield, Globe, BarChart3, Users, Calendar, UserCheck } from "lucide-react";

interface BottomNavProps {
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
}

function getNavTabs(role: string): NavItem[] {
  if (role === "REGIONAL_ADMIN") {
    return [
      { href: "/regional", label: "Overview", icon: Globe },
      { href: "/regional/schools", label: "Schools", icon: Home },
      { href: "/regional/reports", label: "Reports", icon: BarChart3 },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  if (role === "SCHOOL_ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Shield },
      { href: "/admin/teachers", label: "Teachers", icon: Users },
      { href: "/admin/assignments", label: "Assign", icon: UserCheck },
      { href: "/admin/timetable", label: "Timetable", icon: Calendar },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  // TEACHER (default)
  return [
    { href: "/logbook", label: "Home", icon: Home },
    { href: "/logbook/new", label: "New Entry", icon: PlusCircle, highlight: true },
    { href: "/timetable", label: "Timetable", icon: Calendar },
    { href: "/history", label: "History", icon: Clock },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const tabs = getNavTabs(role);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-brand-600">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-brand-700" : "text-slate-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
