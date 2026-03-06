"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart3,
  Key,
  Layers,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { RegionalStats } from "@/types";

export default function RegionalDashboardPage() {
  const [stats, setStats] = useState<RegionalStats | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-white">Regional Dashboard</h1>
            <p className="text-brand-400 text-sm mt-0.5">Region overview</p>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Regional Dashboard</h1>
              <p className="text-brand-400 text-sm mt-0.5">
                Schools &amp; compliance overview
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Pending schools alert */}
        {stats && stats.pendingSchools > 0 && (
          <Link
            href="/regional/schools"
            className="animate-slide-up flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-pulse-subtle shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {stats.pendingSchools} school
                {stats.pendingSchools > 1 ? "s" : ""} pending approval
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="animate-slide-up animation-delay-75 grid grid-cols-2 gap-3">
          <div className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats?.totalSchools ?? 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Total Schools</p>
          </div>

          <div className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats?.activeSchools ?? 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Active Schools</p>
          </div>

          <div className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats?.totalTeachers ?? 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Total Teachers</p>
          </div>

          <div className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats?.entriesThisMonth ?? 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Entries This Month</p>
          </div>

          <div className="card p-4 col-span-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats?.complianceRate ?? 0}%
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Compliance Rate</p>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats?.complianceRate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* School Rankings */}
        {stats && stats.schoolRankings.length > 0 && (
          <div className="animate-slide-up animation-delay-150 card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                School Rankings
              </h3>
              <Link
                href="/regional/schools"
                className="text-xs text-brand-600 font-medium"
              >
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left pb-2 text-[var(--text-tertiary)] font-medium text-xs uppercase">
                    School
                  </th>
                  <th className="text-right pb-2 text-[var(--text-tertiary)] font-medium text-xs uppercase">
                    Teachers
                  </th>
                  <th className="text-right pb-2 text-[var(--text-tertiary)] font-medium text-xs uppercase">
                    Entries
                  </th>
                  <th className="text-right pb-2 text-[var(--text-tertiary)] font-medium text-xs uppercase">
                    Compliance
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.schoolRankings.slice(0, 10).map((school, i) => (
                  <tr
                    key={school.id}
                    className="border-b border-slate-50 last:border-0 even:bg-[var(--bg-tertiary)] hover:bg-brand-50/40 transition-colors duration-150"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-tertiary)] w-4">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="text-[var(--text-secondary)] font-medium text-xs">
                            {school.name}
                          </p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {school.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-secondary)]">
                      {school.teacherCount}
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-secondary)]">
                      {school.entryCount}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          school.complianceRate >= 70
                            ? "text-green-600"
                            : school.complianceRate >= 40
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {school.complianceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Links */}
        <div className="animate-slide-up animation-delay-225 space-y-2">
          <Link
            href="/regional/schools"
            className="card p-4 flex items-center justify-between border-l-2 border-l-transparent hover:border-l-brand-500 hover:bg-[var(--bg-tertiary)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[var(--text-tertiary)]" />
              <span className="font-medium text-[var(--text-primary)]">
                Manage Schools
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/regional/codes"
            className="card p-4 flex items-center justify-between border-l-2 border-l-transparent hover:border-l-brand-500 hover:bg-[var(--bg-tertiary)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-[var(--text-tertiary)]" />
              <span className="font-medium text-[var(--text-primary)]">
                Registration Codes
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/regional/reports"
            className="card p-4 flex items-center justify-between border-l-2 border-l-transparent hover:border-l-brand-500 hover:bg-[var(--bg-tertiary)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[var(--text-tertiary)]" />
              <span className="font-medium text-[var(--text-primary)]">
                View Reports
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/regional/analysis"
            className="card p-4 flex items-center justify-between border-l-2 border-l-transparent hover:border-l-brand-500 hover:bg-[var(--bg-tertiary)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[var(--text-tertiary)]" />
              <div>
                <span className="font-medium text-[var(--text-primary)] block">
                  Deep Analysis
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Modules, subjects, HODs
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
