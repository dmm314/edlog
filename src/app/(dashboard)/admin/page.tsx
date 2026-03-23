"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Calendar,
  BarChart3,
  CheckCircle2,
  Megaphone,
  Shield,
  BookOpen,
  Layers,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TeacherActivityRow } from "@/components/TeacherActivityRow";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HelpHint } from "@/components/HelpHint";
import { ADMIN_TOUR } from "@/lib/tour-steps";
import type { AdminStats, TeacherWithStats } from "@/types";


interface SchoolInfo {
  name: string;
  code: string;
  status: string;
  region: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, schoolRes, teachersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/school"),
          fetch("/api/admin/teachers"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        } else {
          setError("Failed to load stats");
        }

        if (schoolRes.ok) {
          setSchool(await schoolRes.json());
        }

        if (teachersRes.ok) {
          const t = await teachersRes.json();
          setTeachers(Array.isArray(t) ? t : []);
        }
        // Fetch createdAt for HelpHints
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const s = await sessionRes.json();
            if (s?.user?.createdAt) setUserCreatedAt(s.user.createdAt as string);
          }
        } catch { /* silently fail */ }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Sort teachers by compliance ascending (lowest first — admin sees who's behind)
  const topTeachers = teachers
    .filter((t) => t.membershipStatus === "ACTIVE")
    .sort((a, b) => {
      const aExpected = a.periodsPerWeek || Math.max(a.subjects.length * 3, 5);
      const bExpected = b.periodsPerWeek || Math.max(b.subjects.length * 3, 5);
      const aRate = a.entriesThisWeek / aExpected;
      const bRate = b.entriesThisWeek / bExpected;
      return aRate - bRate;
    })
    .slice(0, 6);

  // Loading skeleton
  if (loading) {
    return (
      <div className="page-shell space-y-4 pt-4 lg:space-y-5">
        {/* Admin header skeleton */}
        <section className="section-card">
          <div className="skeleton h-4 w-24 mb-2" />
          <div className="skeleton h-7 w-44 mb-5" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 rounded-xl p-3 bg-[hsl(var(--surface-secondary))] border border-[hsl(var(--border-muted))]">
                <div className="skeleton h-7 w-12 mx-auto mb-1" />
                <div className="skeleton h-2 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-10 w-10 rounded-xl mb-3" />
              <div className="skeleton h-4 w-20 mb-1" />
              <div className="skeleton h-3 w-14" />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <div className="skeleton h-4 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-3 w-24 mb-2" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const complianceRate = stats?.complianceRate ?? 0;
  const entriesThisMonth = stats?.entriesThisMonth ?? 0;
  const verifiedThisMonth = stats?.verifiedEntriesThisMonth ?? 0;
  const flaggedThisMonth = stats?.flaggedEntriesThisMonth ?? 0;
  const pendingThisMonth = stats?.pendingEntriesThisMonth ?? 0;
  const verificationRate = entriesThisMonth > 0 ? Math.round((verifiedThisMonth / entriesThisMonth) * 100) : 0;
  const vpBreakdown = stats?.vpBreakdown ?? [];

  return (
    <div className="page-shell space-y-4 pt-4 lg:space-y-5">
      {/* ── HEADER — section-card ── */}
      <section className="section-card">
        <div data-tour="admin-welcome" className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="role-dot role-dot-admin" />
              <p className="text-xs font-medium text-content-tertiary">School Admin</p>
              {school && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${school.status === "ACTIVE" ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]" : "bg-[hsl(var(--surface-tertiary))] text-content-tertiary"}`}>
                  {school.status === "ACTIVE" ? "Active" : school.status}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-content-primary tracking-tight">
              {school?.name || "Admin Dashboard"}
            </h1>
          </div>
          <NotificationBell />
        </div>

        {/* 3 stat pods */}
        <div data-tour="admin-stats" className="mt-4 flex gap-2">
          {[
            { value: stats?.totalTeachers ?? 0, label: "Teachers" },
            { value: stats?.entriesThisWeek ?? 0, label: "This week" },
            { value: `${complianceRate}%`, label: "Compliance", hint: "The percentage of expected entries submitted across your school this month." },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative flex-1 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3 text-center"
            >
              {stat.hint && (
                <HelpHint text={stat.hint} position="bottom" createdAt={userCreatedAt} className="absolute -top-1 -right-1 z-10" />
              )}
              <p className="text-xl font-bold tabular-nums text-content-primary">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-medium text-content-tertiary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="animate-slide-down rounded-xl border border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.06)] px-4 py-3 flex items-center gap-2 text-sm font-medium text-[hsl(var(--danger))]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Pending teacher approvals alert */}
      {stats && (stats.pendingTeachers ?? 0) > 0 && (
        <Link
          href="/admin/teachers"
          className="animate-slide-up flex items-center gap-3.5 card p-4 border-l-4 border-l-[hsl(var(--accent))] hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[hsl(var(--accent-soft))]">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--accent))]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-content-primary">
              {stats.pendingTeachers} teacher{(stats.pendingTeachers ?? 0) > 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-xs text-content-tertiary mt-0.5">Tap to review and approve</p>
          </div>
          <ChevronRight className="w-4 h-4 text-content-tertiary group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* ── QUICK ACTIONS — 2×3 grid ── */}
      <div data-tour="admin-quick-actions" className="animate-slide-up animation-delay-150">
        <h3 className="text-xs font-bold uppercase tracking-widest text-content-tertiary mb-3 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            {
              href: "/admin/entries",
              icon: CheckCircle2,
              label: "Entry Overview",
              count: "View all entries",
              gradient: "hsl(var(--accent-soft))",
              iconColor: "hsl(var(--accent-strong))",
            },
            {
              href: "/admin/timetable",
              icon: Calendar,
              label: "Timetable",
              count: "Manage schedule",
              gradient: "hsl(var(--success) / 0.1)",
              iconColor: "hsl(var(--success))",
            },
            {
              href: "/admin/reports",
              icon: BarChart3,
              label: "Reports",
              count: "Analytics & export",
              gradient: "hsl(var(--accent-soft))",
              iconColor: "hsl(var(--accent-strong))",
            },
            {
              href: "/admin/teachers",
              icon: Users,
              label: "Teachers",
              count: `${stats?.totalTeachers ?? 0} active`,
              gradient: "hsl(var(--danger) / 0.08)",
              iconColor: "hsl(var(--danger))",
            },
            {
              href: "/admin/classes",
              icon: BookOpen,
              label: "Manage Classes",
              count: "Add & organise classes",
              gradient: "hsl(var(--accent-soft))",
              iconColor: "hsl(var(--accent))",
            },
            {
              href: "/admin/subjects",
              icon: Layers,
              label: "Assign Subjects",
              count: "Subjects per class",
              gradient: "hsl(var(--success) / 0.08)",
              iconColor: "hsl(var(--success))",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
                style={{ background: action.gradient }}
              >
                <div className="mb-2.5" style={{ color: action.iconColor }}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <p className="text-sm font-bold text-content-primary">{action.label}</p>
                <p className="mt-0.5 text-xs text-content-secondary">{action.count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── MANAGE VPs ── */}
      <Link
        href="/admin/coordinators"
        className="animate-slide-up animation-delay-175 flex items-center justify-between card p-4 border border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] group active:scale-[0.98] transition-all duration-200 relative"
      >
        <HelpHint text="Assign Vice Principals to manage entry verification for each class level." position="left" createdAt={userCreatedAt} className="absolute top-3 right-3 z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--accent)/0.12)]">
            <Shield className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
          </div>
          <div>
            <span className="text-sm font-bold text-[hsl(var(--accent-text))]">
              Manage VPs
            </span>
            <span className="block text-xs text-[hsl(var(--accent-strong))]">
              Level Coordinators — assign per class level
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--accent))] group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ── SEND ANNOUNCEMENT ── */}
      <Link
        href="/admin/announcements"
        className="animate-slide-up animation-delay-175 flex items-center justify-between card p-4 border border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent-soft))] group active:scale-[0.98] transition-all duration-200 relative"
      >
        <HelpHint text="Send a message to all teachers at your school. They'll see it in their notifications." position="left" createdAt={userCreatedAt} className="absolute top-3 right-3 z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
          </div>
          <div>
            <span className="text-sm font-bold text-[hsl(var(--accent-text))]">
              Send Announcement
            </span>
            <span className="block text-xs text-[hsl(var(--accent-text))]">
              Broadcast to all teachers
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--accent-glow))] group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ── REPORTS LINK ── */}
      <Link
        href="/admin/reports/teachers"
        className="animate-slide-up animation-delay-175 flex items-center justify-between card p-4 group active:scale-[0.98] transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[hsl(var(--accent-text))]" />
          <span className="text-sm font-semibold text-content-primary">
            View detailed reports
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-content-tertiary group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ── TWO-COLUMN: Verification Status + Teacher Activity ── */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">
        {/* ── VERIFICATION STATUS ── */}
        <section
          className="section-card animate-slide-up animation-delay-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-content-primary">
              Verification Status
            </h3>
            <Link href="/admin/entries" className="text-xs font-semibold text-[hsl(var(--accent-text))]">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 lg:grid-cols-2">
            {[
              { label: "This month", value: entriesThisMonth, color: "hsl(var(--text-primary))", bg: "hsl(var(--surface-secondary))", hint: "All entries submitted this month." },
              { label: "Verified by VPs", value: `${verifiedThisMonth} (${verificationRate}%)`, color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)", hint: "Entries already reviewed by level coordinators." },
              { label: "Pending review", value: pendingThisMonth, color: "hsl(var(--accent))", bg: "hsl(var(--accent-soft))", hint: "Entries still waiting for VP review." },
              { label: "Flagged", value: flaggedThisMonth, color: "hsl(var(--danger))", bg: "hsl(var(--danger) / 0.08)", hint: "Entries VPs returned for correction." },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: s.bg }}>
                <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-[0.16em]" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
                <p className="mt-1 text-[11px] text-content-tertiary">{s.hint}</p>
              </div>
            ))}
          </div>

          {/* Per-VP breakdown */}
          {vpBreakdown.length > 0 ? (
            <div className="space-y-3 border-t border-[hsl(var(--border-secondary))] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
                Level Coordinators (VPs)
              </p>
              {vpBreakdown.map((coord) => {
                const coordRate = coord.entriesThisMonth > 0
                  ? Math.round((coord.verifiedEntriesThisMonth / coord.entriesThisMonth) * 100)
                  : 0;

                return (
                  <div key={coord.id} className="rounded-2xl border border-[hsl(var(--border-secondary))] bg-[hsl(var(--surface-canvas))] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-content-primary">
                          {coord.name}
                        </p>
                        <p className="text-[11px] text-content-tertiary">
                          {coord.title} · {coord.levels.join(", ")}
                        </p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-strong))]">
                        {coordRate}% reviewed
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: "Verified", value: coord.verifiedEntriesThisMonth, color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)" },
                        { label: "Pending", value: coord.pendingEntriesThisMonth, color: "hsl(var(--accent))", bg: "hsl(var(--accent-soft))" },
                        { label: "Flagged", value: coord.flaggedEntriesThisMonth, color: "hsl(var(--danger))", bg: "hsl(var(--danger) / 0.08)" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl px-3 py-2 text-center" style={{ background: item.bg }}>
                          <p className="text-sm font-bold tabular-nums" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-[10px] font-semibold" style={{ color: item.color, opacity: 0.75 }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl p-3 text-center bg-[hsl(var(--accent)/0.06)] border border-[hsl(var(--accent)/0.15)]">
              <p className="text-xs font-semibold text-[hsl(var(--accent-text))]">No VPs assigned yet</p>
              <Link href="/admin/coordinators" className="text-xs font-bold underline mt-1 block text-[hsl(var(--accent-strong))]">
                Set up Level Coordinators →
              </Link>
            </div>
          )}
        </section>

        {/* ── TEACHER ACTIVITY ── */}
        {topTeachers.length > 0 && (
          <section
            data-tour="admin-teacher-activity"
            className="section-card animate-slide-up animation-delay-225"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-content-primary">
                  Teacher Activity
                </h3>
                <HelpHint text="Teachers sorted by logging activity. Those logging least appear first so you can follow up." position="left" createdAt={userCreatedAt} />
              </div>
              <Link href="/admin/teachers" className="text-xs font-semibold text-[hsl(var(--accent-text))] hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {topTeachers.map((t) => {
                const name = `${t.firstName} ${t.lastName}`;
                const expectedPerWeek = t.periodsPerWeek || Math.max(t.subjects.length * 3, 5);
                return (
                  <TeacherActivityRow
                    key={t.id}
                    name={name}
                    initials={`${t.firstName[0]}${t.lastName[0]}`}
                    entriesLogged={t.entriesThisWeek}
                    entriesExpected={expectedPerWeek}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── ENTRIES BY WEEK CHART ── */}
      {stats && stats.entriesByWeek.length > 0 && (
        <section className="section-card animate-slide-up animation-delay-375">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[hsl(var(--accent-text))]" />
            <h3 className="text-sm font-bold text-content-primary">
              Entries per Week
            </h3>
          </div>
          <div className="flex items-end gap-2.5 h-28">
            {stats.entriesByWeek.map((w, i) => {
              const maxCount = Math.max(
                ...stats.entriesByWeek.map((x) => x.count)
              );
              const height = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
              return (
                <div
                  key={w.week}
                  className="flex-1 flex flex-col items-center gap-1.5 group"
                >
                  <span className="text-[11px] font-mono text-content-secondary font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 tabular-nums">
                    {w.count}
                  </span>
                  <div
                    className="w-full rounded-lg transition-all duration-700 animate-progress-fill"
                    style={{
                      height: `${Math.max(height, 8)}%`,
                      animationDelay: `${i * 100}ms`,
                      background: `linear-gradient(180deg, var(--accent), var(--accent-hover))`,
                      opacity: 0.7 + (height / 100) * 0.3,
                    }}
                  />
                  <span className="text-[10px] text-content-tertiary font-semibold font-mono">
                    W{w.week.split("-W")[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <OnboardingTour steps={ADMIN_TOUR} tourKey="admin" />
    </div>
  );
}
