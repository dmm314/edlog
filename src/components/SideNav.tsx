"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Globe,
  Building2,
  BarChart3,
  Megaphone,
  Key,
  User,
  Settings,
} from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";
import {
  useNavConfig,
  getRoleDotClass,
  getRoleLabel,
  type NavItem,
} from "@/hooks/useNavConfig";
import { cn } from "@/lib/utils";

interface SideNavProps {
  role: string;
  userName?: string;
  isCoordinator?: boolean;
  activeMode?: PortalMode;
  switchMode?: (mode: PortalMode) => void;
}

/* ── Section label grouping for REGIONAL_ADMIN ── */
interface NavSection {
  label: string;
  items: NavItem[];
}

function groupRegionalNav(tabs: NavItem[], pathname: string): NavSection[] {
  const navigationHrefs = new Set(["/regional", "/regional/schools"]);
  const managementLabels = new Set(["Announcements", "Registration Codes"]);
  const accountLabels = new Set(["Profile", "Settings"]);

  /* Items from useNavConfig */
  const navItems = tabs.filter(
    (t) => navigationHrefs.has(t.href) || t.label === "Reports",
  );

  /* Extra items we inject ourselves */
  const announcementsActive =
    pathname === "/regional/announcements" ||
    pathname.startsWith("/regional/announcements/");
  const codesActive =
    pathname === "/regional/codes" ||
    pathname.startsWith("/regional/codes/");
  const settingsActive = pathname === "/profile/settings";

  const managementItems: NavItem[] = [
    {
      href: "/regional/announcements",
      label: "Announcements",
      icon: Megaphone,
      isActive: announcementsActive,
    },
    {
      href: "/regional/codes",
      label: "Registration Codes",
      icon: Key,
      isActive: codesActive,
    },
  ];

  const profileTab = tabs.find((t) => t.label === "Profile");
  const accountItems: NavItem[] = [
    profileTab ?? {
      href: "/profile",
      label: "Profile",
      icon: User,
      isActive: pathname === "/profile",
    },
    {
      href: "/profile",
      label: "Settings",
      icon: Settings,
      isActive: settingsActive,
    },
  ];

  return [
    { label: "NAVIGATION", items: navItems },
    { label: "MANAGEMENT", items: managementItems },
    { label: "ACCOUNT", items: accountItems },
  ];
}

/* ── Region display helper ── */
function getRegionSubtitle(role: string): string | null {
  if (role === "REGIONAL_ADMIN") return "Southwest Region";
  return null;
}

/* ══════════════════════════════════════════════════════════════════ */

function SideNav({
  role,
  userName,
  isCoordinator,
  activeMode,
  switchMode,
}: SideNavProps) {
  const tabs = useNavConfig(role, isCoordinator, activeMode);
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const isRegional = role === "REGIONAL_ADMIN";
  const sections = isRegional ? groupRegionalNav(tabs, pathname) : null;
  const regionSubtitle = getRegionSubtitle(role);

  return (
    <nav
      className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[288px] lg:flex-col lg:border-r lg:border-[hsl(var(--border-primary))]"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex h-full flex-col px-4 py-5">
        {/* ── Brand ── */}
        <div className="mb-6 flex items-center gap-3 px-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-md"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent-strong)) 100%)",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            E
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[hsl(var(--text-primary))]">
              Edlog
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--text-quaternary))]">
              Education Platform
            </span>
          </div>
        </div>

        {/* ── User info card ── */}
        <div
          className="mb-5 rounded-2xl border border-[hsl(var(--border-muted))] p-3.5"
          style={{
            background: "hsl(var(--surface-secondary))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full font-mono text-sm font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--gold)) 100%)",
                }}
              >
                {initials}
              </div>
              <div
                className="absolute -inset-[3px] -z-10 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--gold)) 100%)",
                  opacity: 0.35,
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[hsl(var(--text-primary))]">
                {userName || "User"}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={getRoleDotClass(role, isCoordinator, activeMode)}
                />
                <span className="text-xs text-[hsl(var(--text-tertiary))]">
                  {getRoleLabel(role, isCoordinator, activeMode)}
                </span>
              </div>
              {regionSubtitle && (
                <p className="mt-0.5 text-[11px] font-medium text-[hsl(var(--text-quaternary))]">
                  {regionSubtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Mode switcher (coordinators) ── */}
        {isCoordinator && switchMode ? (
          <div className="mb-5 rounded-2xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-2">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => switchMode("teacher")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  "duration-[var(--transition-base)]",
                  activeMode === "teacher"
                    ? "bg-accent text-white shadow-sm"
                    : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                Teacher
              </button>
              <button
                onClick={() => switchMode("coordinator")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  "duration-[var(--transition-base)]",
                  activeMode === "coordinator"
                    ? "bg-accent text-white shadow-sm"
                    : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary))]",
                )}
              >
                VP
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Nav links ── */}
        <div className="flex-1 overflow-y-auto">
          {sections
            ? /* ── Grouped nav for regional admin ── */
              sections.map((section, sIdx) => (
                <div key={section.label} className={sIdx > 0 ? "mt-4" : ""}>
                  {/* Section divider */}
                  {sIdx > 0 && (
                    <div className="mx-3 mb-2 border-t border-[hsl(var(--border-muted))]" />
                  )}
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--text-quaternary))]">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((tab) => (
                      <NavLink key={tab.href + tab.label} tab={tab} />
                    ))}
                  </div>
                </div>
              ))
            : /* ── Flat nav for other roles ── */
              <div className="space-y-0.5">
                {tabs.map((tab) => (
                  <NavLink key={tab.href} tab={tab} />
                ))}
              </div>}
        </div>

        {/* ── Sign out ── */}
        <div className="mt-3 border-t border-[hsl(var(--border-muted))] pt-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              "text-[hsl(var(--text-secondary))] transition-all duration-200",
              "hover:bg-[hsl(0_72%_51%/0.08)] hover:text-[hsl(var(--danger))]",
            )}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Individual nav link component ── */

function NavLink({ tab }: { tab: NavItem }) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      data-tour={tab.dataTour}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-[var(--ease-out-expo)]",
        tab.isActive
          ? "border-l-[3px] border-l-[hsl(var(--accent))] bg-accent pl-[9px] font-semibold text-white shadow-sm"
          : "text-[hsl(var(--text-secondary))] hover:scale-[1.01] hover:bg-[hsl(var(--surface-tertiary))] hover:text-[hsl(var(--text-primary))]",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors duration-200",
          tab.isActive
            ? "text-white"
            : "text-[hsl(var(--text-tertiary))] group-hover:text-[hsl(var(--text-primary))]",
        )}
      />
      <span className="flex-1 truncate">{tab.label}</span>

      {/* Highlight badge */}
      {tab.highlight && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--gold)) 100%)",
          }}
        >
          New
        </span>
      )}
    </Link>
  );
}

export { SideNav };
export type { SideNavProps };
