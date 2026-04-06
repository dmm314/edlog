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
  AlertTriangle,
  CheckCircle,
  Shield,
  Flag,
  MapPin,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HelpHint } from "@/components/HelpHint";
import { REGIONAL_TOUR } from "@/lib/tour-steps";
import type { RegionalStats } from "@/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
        <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]">
          <div className="page-shell pt-8 pb-6">
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-24 rounded bg-[var(--skeleton-base)]" />
              <div className="h-8 w-56 rounded bg-[var(--skeleton-base)]" />
              <div className="h-3 w-40 rounded bg-[var(--skeleton-base)]" />
            </div>
          </div>
        </div>
        <div className="page-shell pt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-10 bg-[var(--skeleton-base)] rounded-xl mb-3" />
                <div className="h-8 w-16 bg-[var(--skeleton-base)] rounded mb-2" />
                <div className="h-3 w-20 bg-[var(--skeleton-base)] rounded" />
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
    { href: "/regional/reports/schools", icon: Building2, label: "Explore school data", sub: "Filter and sort schools by metrics" },
    { href: "/regional/reports/comparison", icon: BarChart3, label: "Compare schools", sub: "Side-by-side cross-school comparison" },
    { href: "/regional/reports/coverage", icon: BookOpen, label: "Curriculum coverage", sub: "Regional syllabus tracking" },
    { href: "/regional/reports", icon: Layers, label: "All Reports" },
    { href: "/regional/analysis", icon: Layers, label: "Deep Analysis", sub: "Modules, subjects, HODs" },
  ];

  const managementLinks = [
    { href: "/regional/announcements", icon: Megaphone, label: "Send Announcement", sub: "Broadcast to all teachers in region" },
    { href: "/regional/schools", icon: Building2, label: "Manage Schools" },
    { href: "/regional/codes", icon: Key, label: "Registration Codes" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
      {/* Header — Personalized greeting */}
      <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]">
        <div className="page-shell pt-8 pb-6">
          <div data-tour="regional-welcome" className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-tertiary mb-1">
                Regional Inspector
              </p>
              <h1 className="font-display text-[26px] font-bold text-content-primary leading-tight tracking-tight">
                {getGreeting()}{stats?.userName ? `, ${stats.userName}` : ""}
              </h1>
              {stats?.regionName && (
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-content-tertiary" />
                  <p className="text-sm text-content-secondary">
                    {stats.regionName} Region{stats.regionCapital ? ` \u00b7 ${stats.regionCapital}` : ""}
                  </p>
                </div>
              )}
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="page-shell space-y-5 pt-5 lg:space-y-6">
        {/* Pending schools alert */}
        {stats && stats.pendingSchools > 0 && (
          <Link
            href="/regional/schools"
            className="animate-fade-slide-in card flex items-center gap-3 rounded-xl border border-[hsl(var(--border-muted))] p-4 active:scale-[0.98] transition-all duration-[80ms]"
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

        {/* Stat pods — 2x2 on mobile, 4-col on desktop */}
        <div data-tour="regional-stats" className="animate-fade-slide-in grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ animationDelay: "80ms" }}>
          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-5">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <p className="font-display text-[28px] font-bold text-content-primary leading-none">
              {stats?.totalSchools ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-1.5">
              Total Schools
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-5">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <p className="font-display text-[28px] font-bold text-content-primary leading-none">
              {stats?.totalTeachers ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-1.5">
              Total Teachers
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-5 relative">
            <HelpHint
              text="Average logging compliance across all schools in your region. Based on entries submitted vs. expected."
              position="bottom"
              createdAt={userCreatedAt}
              className="absolute -top-1 -right-1 z-10"
            />
            <div className="w-10 h-10 bg-[hsl(var(--success)/0.1)] rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--success))]" />
            </div>
            <p className="font-display text-[28px] font-bold text-content-primary leading-none">
              {stats?.complianceRate ?? 0}<span className="text-lg">%</span>
            </p>
            <p className="text-xs text-content-tertiary mt-1.5">
              Avg Compliance
            </p>
          </div>

          <div className="card rounded-xl border border-[hsl(var(--border-muted))] p-5">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <p className="font-display text-[28px] font-bold text-content-primary leading-none">
              {stats?.entriesThisMonth ?? 0}
            </p>
            <p className="text-xs text-content-tertiary mt-1.5">
              Entries This Month
            </p>
          </div>
        </div>

        {/* Performance Tiers */}
        {stats?.performanceTiers && (
          <section className="section-card animate-fade-slide-in" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display text-base font-bold text-content-primary">School Performance</h3>
              <HelpHint
                text="Schools grouped by compliance rate: Excellent (80%+), Good (50-79%), Needs Attention (20-49%), Critical (<20%)"
                position="right"
                createdAt={userCreatedAt}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl p-3.5 text-center" style={{ background: "hsl(var(--success) / 0.08)" }}>
                <CheckCircle className="w-4 h-4 mx-auto mb-1.5" style={{ color: "hsl(var(--success))" }} />
                <p className="font-display text-xl font-bold" style={{ color: "hsl(var(--success))" }}>{stats.performanceTiers.excellent}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-content-tertiary mt-0.5">Excellent</p>
              </div>
              <div className="rounded-xl p-3.5 text-center" style={{ background: "hsl(var(--accent) / 0.08)" }}>
                <Shield className="w-4 h-4 mx-auto mb-1.5" style={{ color: "hsl(var(--accent))" }} />
                <p className="font-display text-xl font-bold" style={{ color: "hsl(var(--accent))" }}>{stats.performanceTiers.good}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-content-tertiary mt-0.5">Good</p>
              </div>
              <div className="rounded-xl p-3.5 text-center" style={{ background: "hsl(var(--warning) / 0.1)" }}>
                <Flag className="w-4 h-4 mx-auto mb-1.5" style={{ color: "hsl(var(--warning))" }} />
                <p className="font-display text-xl font-bold" style={{ color: "hsl(var(--warning))" }}>{stats.performanceTiers.needsAttention}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-content-tertiary mt-0.5">Attention</p>
              </div>
              <div className="rounded-xl p-3.5 text-center" style={{ background: "hsl(var(--danger) / 0.08)" }}>
                <AlertTriangle className="w-4 h-4 mx-auto mb-1.5" style={{ color: "hsl(var(--danger))" }} />
                <p className="font-display text-xl font-bold" style={{ color: "hsl(var(--danger))" }}>{stats.performanceTiers.critical}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-content-tertiary mt-0.5">Critical</p>
              </div>
            </div>
          </section>
        )}

        {/* Two-column layout: School Rankings + Quick Links */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">
          {/* School Rankings */}
          {sortedSchools.length > 0 && (
            <section className="section-card animate-fade-slide-in" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-content-primary">
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
                  className="text-xs text-accent-text font-semibold"
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
                          <p className="text-sm font-semibold text-content-primary truncate">
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
                          {school.verificationRate > 0 && (
                            <span className="text-[10px] text-content-tertiary">
                              <span className="font-mono">{school.verificationRate}%</span> verified
                            </span>
                          )}
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
              <h3 className="font-display text-base font-bold text-content-primary mb-3">Data &amp; Reports</h3>
              <div className="space-y-0.5">
                {dataReportsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl p-3 group active:scale-[0.98] transition-all duration-[80ms] hover:bg-[hsl(var(--surface-canvas))]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--surface-tertiary))] flex items-center justify-center flex-shrink-0">
                        <link.icon className="w-4 h-4 text-content-secondary" />
                      </div>
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
                    <ChevronRight className="w-4 h-4 text-content-tertiary" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Management */}
            <section className="section-card animate-fade-slide-in" style={{ animationDelay: "320ms" }}>
              <h3 className="font-display text-base font-bold text-content-primary mb-3">Management</h3>
              <div className="space-y-0.5">
                {managementLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl p-3 group active:scale-[0.98] transition-all duration-[80ms] hover:bg-[hsl(var(--surface-canvas))]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--surface-tertiary))] flex items-center justify-center flex-shrink-0">
                        <link.icon className="w-4 h-4 text-content-secondary" />
                      </div>
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
                    <ChevronRight className="w-4 h-4 text-content-tertiary" />
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
