"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart3,
  Key,
  Layers,
  Megaphone,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HelpHint } from "@/components/HelpHint";
import { REGIONAL_TOUR } from "@/lib/tour-steps";
import type { RegionalStats } from "@/types";

function getRankColor(rank: number, total: number): string {
  const quartile = total > 0 ? rank / total : 1;
  if (quartile <= 0.25) return "text-[hsl(var(--success))]";
  if (quartile <= 0.75) return "text-[hsl(var(--accent-strong))]";
  return "text-[hsl(var(--danger))]";
}

export default function RegionalDashboardPage() {
  const [stats, setStats] = useState<RegionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/regional/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();

    // Fetch createdAt for HelpHints
    fetch("/api/auth/session").then(r => r.ok ? r.json() : null).then(s => {
      if (s?.user?.createdAt) setUserCreatedAt(s.user.createdAt as string);
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
        <div className="page-shell pt-8 pb-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="role-dot role-dot-regional" />
            <p className="text-xs font-medium text-content-tertiary">Regional Inspector</p>
          </div>
          <h1 className="text-xl font-bold text-content-primary tracking-tight">
            Regional Dashboard
          </h1>
        </div>
        <div className="page-shell mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-10 bg-[var(--skeleton-base)] rounded mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sort schools by compliance (lowest first)
  const sortedSchools = stats
    ? [...stats.schoolRankings].sort((a, b) => a.complianceRate - b.complianceRate)
    : [];

  const dataReportsLinks = [
    { href: "/regional/reports/schools", icon: Building2, label: "Explore school data", sub: "Compare schools across your region" },
    { href: "/regional/reports/coverage", icon: BookOpen, label: "Curriculum coverage", sub: "Regional syllabus tracking" },
    { href: "/regional/reports", icon: BarChart3, label: "View Reports" },
    { href: "/regional/analysis", icon: Layers, label: "Deep Analysis", sub: "Modules, subjects, HODs" },
  ];

  const managementLinks = [
    { href: "/regional/announcements", icon: Megaphone, label: "Send Announcement", sub: "Broadcast to all teachers in region" },
    { href: "/regional/schools", icon: Building2, label: "Manage Schools" },
    { href: "/regional/codes", icon: Key, label: "Registration Codes" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]">
        <div className="page-shell pt-8 pb-6">
          <div data-tour="regional-welcome" className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="role-dot role-dot-regional" />
                <p className="text-xs font-medium text-content-tertiary">Regional Inspector</p>
              </div>
              <h1 className="text-xl font-bold text-content-primary tracking-tight">
                {stats ? "Region Overview" : "Regional Dashboard"}
              </h1>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="page-shell space-y-4 pt-4 lg:space-y-5">
        {/* Pending schools alert */}
        {stats && stats.pendingSchools > 0 && (
          <Link
            href="/regional/schools"
            className="animate-fade-slide-in card flex items-center gap-3 rounded-xl border border-[hsl(var(--border-muted))] p-4 animate-pulse-subtle active:scale-[0.98] transition-all duration-[80ms]"
          >
            <Clock className="w-5 h-5 text-[hsl(var(--accent-strong))] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-content-primary">
                <span className="font-mono">{stats.pendingSchools}</span> school{stats.pendingSchools > 1 ? "s" : ""} pending approval
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-content-tertiary" />
          </Link>
        )}

        {/* Stat pods — 2×2 on mobile, 4-col on desktop */}
        <div data-tour="regional-stats" className="animate-fade-slide-in grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ animationDelay: "80ms" }}>
          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-4 active:scale-[0.97] transition-all duration-[80ms]">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <p className="text-2xl font-bold text-content-primary font-mono">
              {stats?.totalSchools ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">
              Total Schools
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-4 active:scale-[0.97] transition-all duration-[80ms]">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-accent-text" />
            </div>
            <p className="text-2xl font-bold text-content-primary font-mono">
              {stats?.totalTeachers ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">
              Total Teachers
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-4 active:scale-[0.97] transition-all duration-[80ms] relative">
            <HelpHint
              text="Average logging compliance across all schools in your region. Based on entries submitted vs. expected."
              position="bottom"
              createdAt={userCreatedAt}
              className="absolute -top-1 -right-1 z-10"
            />
            <div className="w-10 h-10 bg-[hsl(var(--success)/0.1)] rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--success))]" />
            </div>
            <p className="text-2xl font-bold text-content-primary font-mono">
              {stats?.complianceRate ?? 0}%
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">
              Avg Compliance
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-4 active:scale-[0.97] transition-all duration-[80ms]">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-accent-text" />
            </div>
            <p className="text-2xl font-bold text-content-primary font-mono">
              {stats?.entriesThisMonth ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">
              Entries This Month
            </p>
          </div>
        </div>

        {/* Two-column layout: School Rankings + Quick Links */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">
          {/* School Rankings */}
          {sortedSchools.length > 0 && (
            <section className="section-card animate-fade-slide-in" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-content-primary">
                    School Rankings
                  </h3>
                  <HelpHint
                    text="Schools sorted by compliance — lowest first. This helps you identify which schools need attention."
                    position="right"
                    createdAt={userCreatedAt}
                  />
                </div>
                <Link
                  href="/regional/schools"
                  className="text-xs text-accent-text font-medium"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {sortedSchools.slice(0, 10).map((school, i) => {
                  const progressColor = school.complianceRate >= 70 ? "green" : school.complianceRate >= 40 ? "amber" : "red";
                  return (
                    <div
                      key={school.id}
                      className="flex items-center gap-3 animate-fade-slide-in"
                      style={{ animationDelay: `${(i + 3) * 80}ms` }}
                    >
                      {/* Rank number */}
                      <span
                        className={`text-sm font-bold w-6 text-center flex-shrink-0 font-mono ${getRankColor(i + 1, sortedSchools.length)}`}
                      >
                        {i + 1}
                      </span>

                      {/* School info + progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-content-primary truncate">
                            {school.name}
                          </p>
                          <span
                            className={`text-xs font-bold ml-2 flex-shrink-0 font-mono ${
                              school.complianceRate >= 70 ? "text-[hsl(var(--success))]" : school.complianceRate >= 40 ? "text-[hsl(var(--accent-strong))]" : "text-[hsl(var(--danger))]"
                            }`}
                          >
                            {school.complianceRate}%
                          </span>
                        </div>
                        <ProgressBar value={school.complianceRate} color={progressColor} />
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-content-tertiary">
                            <span className="font-mono">{school.teacherCount}</span> teachers
                          </span>
                          <span className="text-[10px] text-content-tertiary">
                            <span className="font-mono">{school.entryCount}</span> entries
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Quick Links — grouped into two section-cards */}
          <div className="space-y-4 lg:space-y-5">
            {/* Data & Reports */}
            <section className="section-card animate-fade-slide-in" style={{ animationDelay: "240ms" }}>
              <h3 className="text-sm font-semibold text-content-primary mb-3">Data &amp; Reports</h3>
              <div className="space-y-1">
                {dataReportsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl p-3 group active:scale-[0.98] transition-all duration-[80ms] hover:bg-[hsl(var(--surface-canvas))]"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-5 h-5 text-content-tertiary" />
                      <div>
                        <span className="text-sm font-medium text-content-primary">
                          {link.label}
                        </span>
                        {link.sub && (
                          <span className="block text-[11px] text-content-tertiary">
                            {link.sub}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-tertiary group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Management */}
            <section className="section-card animate-fade-slide-in" style={{ animationDelay: "320ms" }}>
              <h3 className="text-sm font-semibold text-content-primary mb-3">Management</h3>
              <div className="space-y-1">
                {managementLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl p-3 group active:scale-[0.98] transition-all duration-[80ms] hover:bg-[hsl(var(--surface-canvas))]"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-5 h-5 text-content-tertiary" />
                      <div>
                        <span className="text-sm font-medium text-content-primary">
                          {link.label}
                        </span>
                        {link.sub && (
                          <span className="block text-[11px] text-content-tertiary">
                            {link.sub}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-tertiary group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      <OnboardingTour steps={REGIONAL_TOUR} tourKey="regional" />
    </div>
  );
}
