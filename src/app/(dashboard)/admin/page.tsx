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
  Building2,
  GraduationCap,
  UserCheck,
  FileText,
  Sparkles,
  BarChart3,
  Zap,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { AdminStats } from "@/types";

function getSubjectBarColor(index: number): string {
  const colors = [
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-purple-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
          <div className="max-w-lg mx-auto relative">
            <div className="skeleton h-6 w-40 !bg-white/15 mb-2" />
            <div className="skeleton h-4 w-28 !bg-white/10" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/[0.05] rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

        <div className="max-w-lg mx-auto relative">
          <div className="flex items-start justify-between">
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <p className="text-brand-400/80 text-xs font-semibold uppercase tracking-wider">
                  School Overview
                </p>
              </div>
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

        {/* Alert for unverified teachers */}
        {stats && stats.unverifiedTeachers > 0 && (
          <Link
            href="/admin/teachers"
            className="animate-slide-up flex items-center gap-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                {stats.unverifiedTeachers} teacher
                {stats.unverifiedTeachers > 1 ? "s" : ""} awaiting verification
              </p>
              <p className="text-xs text-amber-600/80 mt-0.5">Tap to review and verify</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="animate-slide-up animation-delay-75 grid grid-cols-2 gap-3">
          {[
            { href: "/admin/teachers", icon: Users, label: "Total Teachers", value: stats?.totalTeachers ?? 0, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", iconColor: "text-blue-500" },
            { href: "/admin/entries", icon: BookOpen, label: "Total Entries", value: stats?.totalEntries ?? 0, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", iconColor: "text-emerald-500" },
            { href: "/admin/reports", icon: Zap, label: "This Month", value: stats?.entriesThisMonth ?? 0, color: "from-violet-500 to-purple-600", bg: "bg-violet-50", iconColor: "text-violet-500" },
            { href: "/admin/reports", icon: Calendar, label: "This Week", value: stats?.entriesThisWeek ?? 0, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", iconColor: "text-amber-500" },
          ].map(({ href, icon: Icon, label, value, bg, iconColor }) => (
            <Link
              key={label}
              href={href}
              className="card p-4 hover:-translate-y-1 transition-all duration-200 active:scale-[0.97] group"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                {value}
              </p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{label}</p>
            </Link>
          ))}
        </div>

        {/* Entries by Week Chart */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="animate-slide-up animation-delay-150 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900">
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
                    <span className="text-[11px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 tabular-nums">
                      {w.count}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-brand-700 to-brand-500 rounded-lg transition-all duration-500 hover:from-brand-600 hover:to-brand-400 shadow-sm"
                      style={{
                        height: `${Math.max(height, 8)}%`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">
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
              <GraduationCap className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900">
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
                      <span className="text-slate-700 font-semibold">{s.subject}</span>
                      <span className="text-slate-400 font-bold tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
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

        {/* Quick Links */}
        <div className="animate-slide-up animation-delay-300">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { href: "/admin/entry-timetable", icon: BarChart3, label: "Entry Timetable", desc: "View entries by class timetable", color: "text-cyan-600", bg: "bg-cyan-50" },
              { href: "/admin/entries", icon: FileText, label: "View Entries", desc: "Browse all logbook entries", color: "text-brand-600", bg: "bg-brand-50" },
              { href: "/admin/teachers", icon: Users, label: "Manage Teachers", desc: "Verify and manage teachers", color: "text-blue-500", bg: "bg-blue-50" },
              { href: "/admin/classes", icon: GraduationCap, label: "Manage Classes", desc: "Add or edit classes", color: "text-violet-500", bg: "bg-violet-50" },
              { href: "/admin/assignments", icon: UserCheck, label: "Assign Teachers", desc: "Assign subjects and classes", color: "text-emerald-500", bg: "bg-emerald-50" },
              { href: "/admin/timetable", icon: Calendar, label: "Manage Timetable", desc: "Set up timetable slots", color: "text-amber-500", bg: "bg-amber-50" },
              { href: "/admin/school", icon: Building2, label: "School Profile", desc: "Update school information", color: "text-slate-500", bg: "bg-slate-50" },
              { href: "/admin/reports", icon: TrendingUp, label: "View Reports", desc: "Analytics and insights", color: "text-orange-500", bg: "bg-orange-50" },
            ].map(({ href, icon: Icon, label, desc, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="card p-4 flex items-center gap-3.5 group hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 text-sm">{label}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
