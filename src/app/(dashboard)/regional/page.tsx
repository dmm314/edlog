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
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Shield,
  Flag,
  ArrowUpRight,
  Activity,
  Zap,
  Target,
  MapPin,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { REGIONAL_TOUR } from "@/lib/tour-steps";
import type { RegionalStats } from "@/types";

function getComplianceColor(rate: number): string {
  if (rate >= 70) return "hsl(var(--success))";
  if (rate >= 40) return "hsl(var(--warning))";
  return "hsl(var(--danger))";
}

function getComplianceBg(rate: number): string {
  if (rate >= 70) return "hsl(var(--success) / 0.08)";
  if (rate >= 40) return "hsl(var(--warning) / 0.08)";
  return "hsl(var(--danger) / 0.08)";
}

export default function RegionalDashboardPage() {
  const [stats, setStats] = useState<RegionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [regionName, setRegionName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, sessionRes] = await Promise.all([
          fetch("/api/regional/stats"),
          fetch("/api/auth/session"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          if (s?.user) {
            setUserName(s.user.name || s.user.firstName || "");
            // Try to get region name from stats
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Get region name from stats if available
  useEffect(() => {
    if (stats && !regionName) {
      // Extract from school rankings or other data
      setRegionName(""); // Will be set from profile API
    }
  }, [stats, regionName]);

  // Fetch region name
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.regionName) setRegionName(data.regionName);
        if (data?.firstName) setUserName(`${data.firstName} ${data.lastName}`);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const sortedSchools = stats
    ? [...stats.schoolRankings].sort((a, b) => a.complianceRate - b.complianceRate)
    : [];

  const firstName = userName.split(" ")[0] || "Inspector";
  const greeting = getGreeting();

  return (
    <div className="min-h-screen pb-24" style={{ background: "hsl(var(--surface-canvas))" }}>
      {/* ── Hero Header ── */}
      <header
        className="relative overflow-hidden border-b"
        style={{
          background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)), hsl(152 50% 44%))",
          borderColor: "transparent",
        }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        <div className="page-shell relative z-10 pt-8 pb-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/70 mb-1">
                {greeting}
              </p>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {firstName}
              </h1>
              {regionName && (
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-sm text-white/70 font-medium">{regionName} Region</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <div className="page-shell space-y-5 pt-5">
        {/* ── Pending Alert ── */}
        {stats && stats.pendingSchools > 0 && (
          <Link
            href="/regional/schools"
            className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "hsl(var(--warning) / 0.06)",
              border: "1px solid hsl(var(--warning) / 0.15)",
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "hsl(var(--warning) / 0.12)" }}>
              <Clock className="w-5 h-5" style={{ color: "hsl(var(--warning))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                {stats.pendingSchools} school{stats.pendingSchools > 1 ? "s" : ""} awaiting approval
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-tertiary))" }}>
                Review and approve to activate
              </p>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: "hsl(var(--warning))" }} />
          </Link>
        )}

        {/* ── Key Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="regional-stats">
          <MetricCard
            icon={Building2}
            value={stats?.totalSchools ?? 0}
            label="Schools"
            color="hsl(var(--info))"
            delay={0}
          />
          <MetricCard
            icon={Users}
            value={stats?.totalTeachers ?? 0}
            label="Teachers"
            color="hsl(var(--accent))"
            delay={1}
          />
          <MetricCard
            icon={Target}
            value={`${stats?.complianceRate ?? 0}%`}
            label="Compliance"
            color={getComplianceColor(stats?.complianceRate ?? 0)}
            delay={2}
          />
          <MetricCard
            icon={Activity}
            value={stats?.entriesThisMonth ?? 0}
            label="This Month"
            color="hsl(var(--gold-text))"
            delay={3}
          />
        </div>

        {/* ── Performance Overview ── */}
        {stats?.performanceTiers && (
          <div
            className="rounded-2xl p-5 animate-fade-slide-in"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border-primary))",
              boxShadow: "var(--shadow-card)",
              animationDelay: "120ms",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                Performance Overview
              </h3>
              <Link
                href="/regional/reports/schools"
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: "hsl(var(--accent-text))" }}
              >
                Details <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <TierPill
                icon={Zap}
                count={stats.performanceTiers.excellent}
                label="Excellent"
                color="hsl(var(--success))"
                bg="hsl(var(--success) / 0.06)"
              />
              <TierPill
                icon={Shield}
                count={stats.performanceTiers.good}
                label="Good"
                color="hsl(var(--accent))"
                bg="hsl(var(--accent) / 0.06)"
              />
              <TierPill
                icon={Flag}
                count={stats.performanceTiers.needsAttention}
                label="Attention"
                color="hsl(var(--warning))"
                bg="hsl(var(--warning) / 0.06)"
              />
              <TierPill
                icon={AlertTriangle}
                count={stats.performanceTiers.critical}
                label="Critical"
                color="hsl(var(--danger))"
                bg="hsl(var(--danger) / 0.06)"
              />
            </div>
          </div>
        )}

        {/* ── Two Column: Rankings + Actions ── */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-5 space-y-5 lg:space-y-0">
          {/* School Rankings — wider column */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl animate-fade-slide-in overflow-hidden"
              style={{
                background: "hsl(var(--surface-elevated))",
                border: "1px solid hsl(var(--border-primary))",
                boxShadow: "var(--shadow-card)",
                animationDelay: "160ms",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-[15px] font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                  School Rankings
                </h3>
                <Link
                  href="/regional/schools"
                  className="text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: "hsl(var(--accent-text))" }}
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {sortedSchools.length === 0 ? (
                <div className="px-5 pb-5">
                  <p className="text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
                    No schools registered yet. Share registration codes to get started.
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border-muted))" }}>
                  {sortedSchools.slice(0, 8).map((school, i) => (
                    <Link
                      key={school.id}
                      href={`/regional/schools`}
                      className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04]"
                      style={{ animationDelay: `${(i + 4) * 60}ms` }}
                    >
                      {/* Rank badge */}
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                          background: getComplianceBg(school.complianceRate),
                          color: getComplianceColor(school.complianceRate),
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* School info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--text-primary))" }}>
                          {school.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--text-tertiary))" }}>
                            {school.teacherCount} teachers
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--text-tertiary))" }}>
                            {school.entryCount} entries
                          </span>
                        </div>
                      </div>

                      {/* Compliance */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className="text-sm font-bold font-mono tabular-nums"
                          style={{ color: getComplianceColor(school.complianceRate) }}
                        >
                          {school.complianceRate}%
                        </span>
                        <div className="w-16">
                          <ProgressBar
                            value={school.complianceRate}
                            color={school.complianceRate >= 70 ? "green" : school.complianceRate >= 40 ? "amber" : "red"}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions — narrower column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Data & Reports */}
            <ActionGroup
              title="Data & Reports"
              delay="200ms"
              links={[
                { href: "/regional/reports/schools", icon: Building2, label: "Explore Schools", desc: "Filter by metrics" },
                { href: "/regional/reports/comparison", icon: BarChart3, label: "Compare Schools", desc: "Side-by-side analysis" },
                { href: "/regional/reports/coverage", icon: BookOpen, label: "Curriculum Coverage", desc: "Syllabus tracking" },
                { href: "/regional/reports", icon: TrendingUp, label: "All Reports" },
              ]}
            />

            {/* Management */}
            <ActionGroup
              title="Management"
              delay="280ms"
              links={[
                { href: "/regional/announcements", icon: Megaphone, label: "Announcements", desc: "Broadcast to region" },
                { href: "/regional/schools", icon: Building2, label: "Manage Schools" },
                { href: "/regional/codes", icon: Key, label: "Registration Codes" },
              ]}
            />
          </div>
        </div>
      </div>
      <OnboardingTour steps={REGIONAL_TOUR} tourKey="regional" />
    </div>
  );
}

/* ── Sub-components ── */

function MetricCard({ icon: Icon, value, label, color, delay }: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-2xl p-4 animate-fade-slide-in transition-all duration-200"
      style={{
        background: "hsl(var(--surface-elevated))",
        border: "1px solid hsl(var(--border-primary))",
        boxShadow: "var(--shadow-card)",
        animationDelay: `${delay * 60}ms`,
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl mb-3"
        style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
      </div>
      <p className="text-2xl font-bold font-mono tabular-nums tracking-tight" style={{ color: "hsl(var(--text-primary))" }}>
        {value}
      </p>
      <p className="text-xs font-medium mt-0.5" style={{ color: "hsl(var(--text-tertiary))" }}>
        {label}
      </p>
    </div>
  );
}

function TierPill({ icon: Icon, count, label, color, bg }: {
  icon: React.ElementType;
  count: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl p-3 text-center transition-all duration-150" style={{ background: bg }}>
      <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
      <p className="text-lg font-bold font-mono tabular-nums" style={{ color }}>
        {count}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "hsl(var(--text-tertiary))" }}>
        {label}
      </p>
    </div>
  );
}

function ActionGroup({ title, delay, links }: {
  title: string;
  delay: string;
  links: Array<{ href: string; icon: React.ElementType; label: string; desc?: string }>;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-slide-in"
      style={{
        background: "hsl(var(--surface-elevated))",
        border: "1px solid hsl(var(--border-primary))",
        boxShadow: "var(--shadow-card)",
        animationDelay: delay,
      }}
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--text-tertiary))" }}>
          {title}
        </h3>
      </div>
      <div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] group"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
                style={{ background: "hsl(var(--surface-tertiary))" }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: "hsl(var(--text-secondary))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                  {link.label}
                </p>
                {link.desc && (
                  <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--text-tertiary))" }}>
                    {link.desc}
                  </p>
                )}
              </div>
              <ChevronRight
                className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                style={{ color: "hsl(var(--text-quaternary))" }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "hsl(var(--surface-canvas))" }}>
      {/* Hero skeleton */}
      <div className="h-36" style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}>
        <div className="page-shell pt-8">
          <div className="h-4 w-24 rounded bg-white/20 mb-2" />
          <div className="h-7 w-40 rounded bg-white/20" />
        </div>
      </div>
      <div className="page-shell pt-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border-primary))" }}>
              <div className="h-9 w-9 rounded-xl mb-3" style={{ background: "var(--skeleton-base)" }} />
              <div className="h-7 w-12 rounded mb-1" style={{ background: "var(--skeleton-base)" }} />
              <div className="h-3 w-16 rounded" style={{ background: "var(--skeleton-base)" }} />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-5 animate-pulse" style={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border-primary))" }}>
          <div className="h-5 w-40 rounded mb-4" style={{ background: "var(--skeleton-base)" }} />
          <div className="grid grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl p-3 h-20" style={{ background: "var(--skeleton-base)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
