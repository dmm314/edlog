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
        <div className="px-5 mt-4 max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-10 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Alert for unverified teachers */}
        {stats && stats.unverifiedTeachers > 0 && (
          <Link
            href="/admin/teachers"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {stats.unverifiedTeachers} teacher
                {stats.unverifiedTeachers > 1 ? "s" : ""} awaiting verification
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/teachers" className="card p-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.totalTeachers ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Teachers</p>
          </Link>

          <Link href="/admin/reports" className="card p-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.totalEntries ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Entries</p>
          </Link>

          <Link href="/admin/reports" className="card p-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.entriesThisMonth ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">This Month</p>
          </Link>

          <Link href="/admin/reports" className="card p-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.entriesThisWeek ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">This Week</p>
          </Link>
        </div>

        {/* Entries by Week Chart (simple bar) */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Entries per Week
            </h3>
            <div className="flex items-end gap-2 h-24">
              {stats.entriesByWeek.map((w) => {
                const maxCount = Math.max(
                  ...stats.entriesByWeek.map((x) => x.count)
                );
                const height = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={w.week}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs text-slate-500 font-medium">
                      {w.count}
                    </span>
                    <div
                      className="w-full bg-brand-600 rounded-t"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-400">
                      {w.week.split("-W")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Entries by Subject */}
        {stats && stats.entriesBySubject.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Entries by Subject
            </h3>
            <div className="space-y-2">
              {stats.entriesBySubject.map((s) => {
                const maxCount = stats.entriesBySubject[0].count;
                const width = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{s.subject}</span>
                      <span className="text-slate-400">{s.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
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
        <div className="space-y-2">
          <Link
            href="/admin/entries"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                View Entries
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/teachers"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                Manage Teachers
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/classes"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                Manage Classes
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/assignments"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                Assign Teachers
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/timetable"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                Manage Timetable
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/school"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                School Profile
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/reports"
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-900">
                View Reports
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
