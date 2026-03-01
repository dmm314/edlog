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
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { AdminStats } from "@/types";

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
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-brand-400 text-sm mt-0.5">School overview</p>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-10 w-10 rounded-xl mb-3" />
                <div className="skeleton h-7 w-16 mb-1.5" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="card p-4">
            <div className="skeleton h-4 w-32 mb-3" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl shadow-elevated">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-brand-400 text-sm mt-0.5">
                School overview
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Error message */}
        {error && (
          <div className="animate-slide-down bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Alert for unverified teachers */}
        {stats && stats.unverifiedTeachers > 0 && (
          <Link
            href="/admin/teachers"
            className="animate-slide-up flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-amber-glow hover:bg-amber-100 active:scale-[0.98] transition-all duration-200"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {stats.unverifiedTeachers} teacher
                {stats.unverifiedTeachers > 1 ? "s" : ""} awaiting verification
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Tap to review</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="animate-slide-up animation-delay-75 grid grid-cols-2 gap-3">
          <Link href="/admin/teachers" className="card p-4 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.totalTeachers ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Teachers</p>
          </Link>

          <Link href="/admin/entries" className="card p-4 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.totalEntries ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Entries</p>
          </Link>

          <Link href="/admin/reports" className="card p-4 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.entriesThisMonth ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">This Month</p>
          </Link>

          <Link href="/admin/reports" className="card p-4 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.entriesThisWeek ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">This Week</p>
          </Link>
        </div>

        {/* Entries by Week Chart */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="animate-slide-up animation-delay-150 card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Entries per Week
            </h3>
            <div className="flex items-end gap-2 h-28">
              {stats.entriesByWeek.map((w, i) => {
                const maxCount = Math.max(
                  ...stats.entriesByWeek.map((x) => x.count)
                );
                const height = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={w.week}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <span className="text-xs text-slate-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {w.count}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-brand-800 to-brand-500 rounded-t-md transition-all duration-500 hover:from-brand-700 hover:to-brand-400"
                      style={{
                        height: `${Math.max(height, 6)}%`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
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
          <div className="animate-slide-up animation-delay-225 card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Entries by Subject
            </h3>
            <div className="space-y-2.5">
              {stats.entriesBySubject.map((s) => {
                const maxCount = stats.entriesBySubject[0].count;
                const width = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">{s.subject}</span>
                      <span className="text-slate-400 font-semibold">{s.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-700 to-brand-500 rounded-full animate-progress-fill"
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
        <div className="animate-slide-up animation-delay-300 space-y-2">
          {[
            { href: "/admin/entries", icon: FileText, label: "View Entries", color: "text-brand-600" },
            { href: "/admin/teachers", icon: Users, label: "Manage Teachers", color: "text-blue-500" },
            { href: "/admin/classes", icon: GraduationCap, label: "Manage Classes", color: "text-purple-500" },
            { href: "/admin/assignments", icon: UserCheck, label: "Assign Teachers", color: "text-emerald-500" },
            { href: "/admin/timetable", icon: Calendar, label: "Manage Timetable", color: "text-amber-500" },
            { href: "/admin/school", icon: Building2, label: "School Profile", color: "text-slate-500" },
            { href: "/admin/reports", icon: TrendingUp, label: "View Reports", color: "text-orange-500" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center justify-between group border-l-2 border-l-transparent hover:border-l-brand-500 hover:bg-slate-50/80 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <span className="font-medium text-slate-900">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
