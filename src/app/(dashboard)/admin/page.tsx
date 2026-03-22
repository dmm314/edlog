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
      <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
        {/* Admin header skeleton */}
        <div className="px-5 pt-8 pb-6 border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]">
          <div className="mx-auto w-full max-w-6xl relative">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-7 w-44 mb-5" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 rounded-[14px] p-3 bg-[hsl(var(--surface-secondary))] border border-[hsl(var(--border-muted))]">
                  <div className="skeleton h-7 w-12 mx-auto mb-1" />
                  <div className="skeleton h-2 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 w-full max-w-6xl px-5 space-y-4 desktop-content">
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
    <div className="min-h-screen pb-24 bg-[hsl(var(--surface-canvas))]">
      {/* ── HEADER — Clean functional bar ── */}
      <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] px-5 pt-8 pb-6">
        <div className="mx-auto w-full max-w-6xl">
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
              <h1 className="font-display text-xl font-bold text-content-primary tracking-tight">
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
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-6xl px-5 space-y-4 desktop-content">
        {/* Error */}
        {error && (
          <div className="animate-slide-down bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 font-medium"
            style={{ background: "var(--warning-light)", borderColor: "var(--warning)", color: "var(--warning)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Pending teacher approvals alert */}
        {stats && (stats.pendingTeachers ?? 0) > 0 && (
          <Link
            href="/admin/teachers"
            className="animate-slide-up flex items-center gap-3.5 card p-4 border-l-4 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
            style={{ borderLeftColor: "var(--accent)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-light)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {stats.pendingTeachers} teacher{(stats.pendingTeachers ?? 0) > 1 ? "s" : ""} awaiting approval
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Tap to review and approve</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* ── QUICK ACTIONS — 2×2 gradient grid ── */}
        <div data-tour="admin-quick-actions" className="animate-slide-up animation-delay-150">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 desktop-actions-row" style={{ gap: "8px" }}>
            {[
              {
                href: "/admin/entries",
                icon: CheckCircle2,
                label: "Entry Overview",
                count: "View all entries",
                gradient: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                iconColor: "#4F46E5",
              },
              {
                href: "/admin/timetable",
                icon: Calendar,
                label: "Timetable",
                count: "Manage schedule",
                gradient: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                iconColor: "#16A34A",
              },
              {
                href: "/admin/reports",
                icon: BarChart3,
                label: "Reports",
                count: "Analytics & export",
                gradient: "linear-gradient(135deg, hsl(var(--accent-soft)), hsl(var(--accent) / 0.2))",
                iconColor: "hsl(var(--accent-strong))",
              },
              {
                href: "/admin/teachers",
                icon: Users,
                label: "Teachers",
                count: `${stats?.totalTeachers ?? 0} active`,
                gradient: "linear-gradient(135deg, #FFF1F2, #FFE4E6)",
                iconColor: "#E11D48",
              },
              {
                href: "/admin/classes",
                icon: BookOpen,
                label: "Manage Classes",
                count: "Add & organise classes",
                gradient: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
                iconColor: "#0284C7",
              },
              {
                href: "/admin/subjects",
                icon: Layers,
                label: "Assign Subjects",
                count: "Subjects per class",
                gradient: "linear-gradient(135deg, #F7FEE7, #ECFCCB)",
                iconColor: "#65A30D",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
                  style={{ background: action.gradient, borderRadius: "16px" }}
                >
                  <div className="mb-2.5" style={{ color: action.iconColor }}>
                    <Icon style={{ width: "18px", height: "18px" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{action.label}</p>
                  <p className="mt-0.5" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{action.count}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── MANAGE VPs ── */}
        <Link
          href="/admin/coordinators"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200 relative"
          style={{
            background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
            border: "1px solid #DDD6FE",
            borderRadius: "16px",
          }}
        >
          <HelpHint text="Assign Vice Principals to manage entry verification for each class level." position="left" createdAt={userCreatedAt} className="absolute top-3 right-3 z-10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
              <Shield className="w-5 h-5" style={{ color: "#6D28D9" }} />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "#3B0764" }}>
                Manage VPs
              </span>
              <span className="block" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#5B21B6" }}>
                Level Coordinators — assign per class level
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: "#7C3AED" }} />
        </Link>

        {/* ── SEND ANNOUNCEMENT ── */}
        <Link
          href="/admin/announcements"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200 relative"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent-soft)), hsl(var(--accent-soft)))",
            border: "1px solid hsl(var(--accent) / 0.2)",
            borderRadius: "16px",
          }}
        >
          <HelpHint text="Send a message to all teachers at your school. They'll see it in their notifications." position="left" createdAt={userCreatedAt} className="absolute top-3 right-3 z-10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "hsl(var(--accent-text))" }}>
                Send Announcement
              </span>
              <span className="block" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "hsl(var(--accent-text))" }}>
                Broadcast to all teachers
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--accent-glow))] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── REPORTS LINK ── */}
        <Link
          href="/admin/reports/teachers"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[var(--accent-text)]" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              View detailed reports
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── TEACHER ACTIVITY ── */}
        {topTeachers.length > 0 && (
          <div
            data-tour="admin-teacher-activity"
            className="animate-slide-up animation-delay-225 border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Teacher Activity
                </h3>
                <HelpHint text="Teachers sorted by logging activity. Those logging least appear first so you can follow up." position="left" createdAt={userCreatedAt} />
              </div>
              <Link href="/admin/teachers" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-text)" }}>
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
          </div>
        )}

        {/* ── VERIFICATION STATUS ── */}
        <div
          className="animate-slide-up animation-delay-300 border"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Verification Status
            </h3>
            <Link href="/admin/entries" className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 lg:grid-cols-4">
            {[
              { label: "This month", value: entriesThisMonth, color: "#0F172A", bg: "#F8FAFC", hint: "All entries submitted this month." },
              { label: "Verified by VPs", value: `${verifiedThisMonth} (${verificationRate}%)`, color: "#16A34A", bg: "#F0FDF4", hint: "Entries already reviewed by level coordinators." },
              { label: "Pending review", value: pendingThisMonth, color: "#2563EB", bg: "#EFF6FF", hint: "Entries still waiting for VP review." },
              { label: "Flagged", value: flaggedThisMonth, color: "#DC2626", bg: "#FEF2F2", hint: "Entries VPs returned for correction." },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: s.bg }}>
                <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-[0.16em]" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{s.hint}</p>
              </div>
            ))}
          </div>

          {/* Per-VP breakdown */}
          {vpBreakdown.length > 0 ? (
            <div className="space-y-3" style={{ borderTop: "1px solid var(--border-secondary)", paddingTop: "12px" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                Level Coordinators (VPs)
              </p>
              {vpBreakdown.map((coord) => {
                const coordRate = coord.entriesThisMonth > 0
                  ? Math.round((coord.verifiedEntriesThisMonth / coord.entriesThisMonth) * 100)
                  : 0;

                return (
                  <div key={coord.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--border-secondary)", background: "var(--bg-primary)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {coord.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          {coord.title} · {coord.levels.join(", ")}
                        </p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#E0E7FF", color: "#4338CA" }}>
                        {coordRate}% reviewed
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: "Verified", value: coord.verifiedEntriesThisMonth, color: "#15803D", bg: "#F0FDF4" },
                        { label: "Pending", value: coord.pendingEntriesThisMonth, color: "#2563EB", bg: "#EFF6FF" },
                        { label: "Flagged", value: coord.flaggedEntriesThisMonth, color: "#B91C1C", bg: "#FEF2F2" },
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
            <div className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--accent) / 0.06)", border: "1px solid hsl(var(--accent) / 0.15)" }}>
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--accent-text))" }}>No VPs assigned yet</p>
              <Link href="/admin/coordinators" className="text-xs font-bold underline mt-1 block" style={{ color: "hsl(var(--accent-strong))" }}>
                Set up Level Coordinators →
              </Link>
            </div>
          )}
        </div>

        {/* ── ENTRIES BY WEEK CHART ── */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="animate-slide-up animation-delay-375 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
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
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 tabular-nums">
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
                    <span className="text-[10px] text-[var(--text-tertiary)] font-semibold font-mono">
                      W{w.week.split("-W")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      <OnboardingTour steps={ADMIN_TOUR} tourKey="admin" />
    </div>
  );
}
