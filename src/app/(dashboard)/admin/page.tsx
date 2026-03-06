"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Calendar,
  GraduationCap,
  UserCheck,
  FileText,
  BarChart3,
  Zap,
  Layers,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { AdminStats } from "@/types";

function getSubjectBarColor(index: number): string {
  const colors = [
    "from-[var(--accent)] to-[var(--accent-hover)]",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-slate-500 to-slate-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
  ];
  return colors[index % colors.length];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          setError(data.error || "Failed to load stats");
        }
      } catch (e) {
        console.error("Stats fetch error:", e);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="page-header px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated">
          <div className="max-w-lg mx-auto relative">
            <div className="skeleton h-6 w-40 !bg-[var(--bg-elevated)]/15 mb-2" />
            <div className="skeleton h-4 w-28 !bg-[var(--bg-elevated)]/10" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-10 w-10 rounded-xl mb-3" />
                <div className="skeleton h-7 w-16 mb-1.5" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="card p-5">
            <div className="skeleton h-4 w-32 mb-3" />
            <div className="skeleton h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="page-header px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated">
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-start justify-between">
            <div className="animate-fade-in">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
                School Overview
              </p>
              <h1 className="text-2xl font-bold text-white">
                Admin Dashboard
              </h1>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Error message */}
        {error && (
          <div className="animate-slide-down bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Alert for pending teacher approvals */}
        {stats && (stats.pendingTeachers ?? 0) > 0 && (
          <Link
            href="/admin/teachers"
            className="animate-slide-up flex items-center gap-3.5 card p-4 border-l-4 border-l-amber-500 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {stats.pendingTeachers} teacher
                {(stats.pendingTeachers ?? 0) > 1 ? "s" : ""} awaiting approval
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Tap to review and approve</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="animate-slide-up animation-delay-75 grid grid-cols-2 gap-3">
          {[
            { href: "/admin/teachers", icon: Users, label: "Total Teachers", value: stats?.totalTeachers ?? 0 },
            { href: "/admin/entries", icon: BookOpen, label: "Total Entries", value: stats?.totalEntries ?? 0 },
            { href: "/admin/reports", icon: Zap, label: "This Month", value: stats?.entriesThisMonth ?? 0 },
            { href: "/admin/reports", icon: Calendar, label: "This Week", value: stats?.entriesThisWeek ?? 0 },
          ].map(({ href, icon: Icon, label, value }) => (
            <Link
              key={label}
              href={href}
              className="card p-4 hover:-translate-y-1 transition-all duration-200 active:scale-[0.97] group"
            >
              <div className="w-11 h-11 bg-[var(--accent-light)] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon className="w-5 h-5 text-[var(--accent-text)]" />
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
                {value}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-semibold mt-0.5">{label}</p>
            </Link>
          ))}
        </div>

        {/* Entries by Week Chart */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="animate-slide-up animation-delay-150 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Entries per Week
              </h3>
            </div>
            <div className="flex items-end gap-2.5 h-32">
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
                    <span className="text-[11px] text-[var(--text-secondary)] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 tabular-nums">
                      {w.count}
                    </span>
                    <div
                      className="w-full rounded-lg transition-all duration-500 shadow-sm"
                      style={{
                        height: `${Math.max(height, 8)}%`,
                        animationDelay: `${i * 80}ms`,
                        backgroundColor: "var(--accent)",
                        opacity: 0.7 + (height / 100) * 0.3,
                      }}
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)] font-semibold">
                      W{w.week.split("-W")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Entries by Subject */}
        {stats && stats.entriesBySubject.length > 0 && (
          <div className="animate-slide-up animation-delay-225 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Entries by Subject
              </h3>
            </div>
            <div className="space-y-3">
              {stats.entriesBySubject.map((s, i) => {
                const maxCount = stats.entriesBySubject[0].count;
                const width = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-primary)] font-semibold">{s.subject}</span>
                      <span className="text-[var(--text-tertiary)] font-bold tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                      <div
                        className={`h-full bg-gradient-to-r ${getSubjectBarColor(i)} rounded-full animate-progress-fill`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions — 2-column grid */}
        <div className="animate-slide-up animation-delay-300">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/entry-timetable", icon: FileText, label: "Entry Grid", desc: "Entries by class/week" },
              { href: "/admin/classes", icon: GraduationCap, label: "Classes", desc: "Subjects & divisions" },
              { href: "/admin/assignments", icon: UserCheck, label: "Assignments", desc: "Assign teachers" },
              { href: "/admin/entries", icon: Layers, label: "All Entries", desc: "Browse all entries" },
              { href: "/admin/hods", icon: UserCheck, label: "HODs", desc: "Dept. heads" },
              { href: "/admin/reports", icon: TrendingUp, label: "Reports", desc: "Analytics & export" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="card p-4 group hover:-translate-y-1 transition-all duration-200 active:scale-[0.97]"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent-light)] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[var(--accent-text)]" />
                </div>
                <p className="font-bold text-[var(--text-primary)] text-sm">{label}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
