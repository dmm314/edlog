"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import type { AdminStats } from "@/types";

interface TeacherReport {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  entryCount: number;
  lastEntry: string | null;
  subjects: string[];
  classes: string[];
  subjectClasses: { subject: string; classes: string[] }[];
}

function getBarColor(index: number): string {
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

export default function ReportsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teachers, setTeachers] = useState<TeacherReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExport, setActiveExport] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, teachersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/teachers"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (teachersRes.ok) {
          setTeachers(await teachersRes.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function downloadCSV(filename: string, csvContent: string) {
    // Add BOM for Excel compatibility
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCSV(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportTeacherReport() {
    setActiveExport("teachers");
    const date = new Date().toISOString().split("T")[0];
    const headers = [
      "Teacher Name",
      "Email",
      "Phone",
      "Verified",
      "Subjects",
      "Classes",
      "Total Entries",
      "Last Entry Date",
    ];

    const rows = teachers
      .sort((a, b) => b.entryCount - a.entryCount)
      .map((t) => [
        escapeCSV(`${t.firstName} ${t.lastName}`),
        escapeCSV(t.email),
        escapeCSV(t.phone),
        t.isVerified ? "Yes" : "No",
        escapeCSV(t.subjects.join("; ")),
        escapeCSV(t.classes.join("; ")),
        t.entryCount,
        t.lastEntry ? new Date(t.lastEntry).toLocaleDateString("en-GB") : "Never",
      ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`teacher-report-${date}.csv`, csv);
    setTimeout(() => setActiveExport(null), 1500);
  }

  function exportSubjectReport() {
    setActiveExport("subjects");
    const date = new Date().toISOString().split("T")[0];
    const headers = ["Subject", "Entry Count", "Teachers Teaching"];

    // Build subject -> teacher count
    const subjectTeachers = new Map<string, Set<string>>();
    teachers.forEach((t) => {
      t.subjects.forEach((s) => {
        if (!subjectTeachers.has(s)) subjectTeachers.set(s, new Set());
        subjectTeachers.get(s)!.add(t.id);
      });
    });

    const rows = (stats?.entriesBySubject ?? []).map((s) => [
      escapeCSV(s.subject),
      s.count,
      subjectTeachers.get(s.subject)?.size ?? 0,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`subject-report-${date}.csv`, csv);
    setTimeout(() => setActiveExport(null), 1500);
  }

  function exportDetailedReport() {
    setActiveExport("detailed");
    const date = new Date().toISOString().split("T")[0];
    const headers = [
      "Teacher Name",
      "Email",
      "Subject",
      "Classes for Subject",
      "Entries",
      "Verified",
    ];

    const rows: string[][] = [];
    teachers.forEach((t) => {
      if (t.subjectClasses.length === 0) {
        rows.push([
          escapeCSV(`${t.firstName} ${t.lastName}`),
          escapeCSV(t.email),
          "No assignments",
          "",
          String(t.entryCount),
          t.isVerified ? "Yes" : "No",
        ]);
      } else {
        t.subjectClasses.forEach((sc) => {
          rows.push([
            escapeCSV(`${t.firstName} ${t.lastName}`),
            escapeCSV(t.email),
            escapeCSV(sc.subject),
            escapeCSV(sc.classes.join("; ")),
            String(t.entryCount),
            t.isVerified ? "Yes" : "No",
          ]);
        });
      }
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`detailed-report-${date}.csv`, csv);
    setTimeout(() => setActiveExport(null), 1500);
  }

  function exportWeeklyReport() {
    setActiveExport("weekly");
    const date = new Date().toISOString().split("T")[0];
    const headers = ["Week", "Entry Count"];

    const rows = (stats?.entriesByWeek ?? []).map((w) => [
      escapeCSV(w.week),
      w.count,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`weekly-trend-${date}.csv`, csv);
    setTimeout(() => setActiveExport(null), 1500);
  }

  const sortedTeachers = [...teachers].sort(
    (a, b) => b.entryCount - a.entryCount
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-400" />
                School Reports
              </h1>
              <p className="text-brand-400/70 text-sm mt-0.5">
                Analytics & CSV exports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-20 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Export Buttons */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Download Reports
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { fn: exportTeacherReport, label: "Teachers", icon: Users, key: "teachers", desc: "Name, email, subjects, entries" },
                  { fn: exportSubjectReport, label: "Subjects", icon: GraduationCap, key: "subjects", desc: "Subject entry counts" },
                  { fn: exportDetailedReport, label: "Detailed", icon: BookOpen, key: "detailed", desc: "Teacher × subject × class" },
                  { fn: exportWeeklyReport, label: "Weekly", icon: BarChart3, key: "weekly", desc: "Entries per week" },
                ].map(({ fn, label, icon: Icon, key, desc }) => (
                  <button
                    key={key}
                    onClick={fn}
                    disabled={activeExport === key}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-brand-200 hover:bg-brand-50/50 transition-all active:scale-[0.97] text-left"
                  >
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {activeExport === key ? (
                        <Download className="w-4 h-4 text-emerald-500 animate-bounce" />
                      ) : (
                        <Icon className="w-4 h-4 text-brand-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-3 text-center">
                <p className="text-xl font-black text-slate-900 tabular-nums">
                  {stats?.totalTeachers ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                  Teachers
                </p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-black text-slate-900 tabular-nums">
                  {stats?.totalEntries ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                  Total Entries
                </p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-black text-slate-900 tabular-nums">
                  {stats?.entriesThisMonth ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                  This Month
                </p>
              </div>
            </div>

            {/* Entries by Subject */}
            {stats && stats.entriesBySubject.length > 0 && (
              <div className="card p-4">
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
                          <span className="text-slate-700 font-semibold">
                            {s.subject}
                          </span>
                          <span className="text-slate-400 font-bold tabular-nums">
                            {s.count}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full bg-gradient-to-r ${getBarColor(i)} rounded-full animate-progress-fill`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Teachers */}
            {sortedTeachers.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Teachers by Entry Count
                  </h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {sortedTeachers.slice(0, 15).map((t, i) => {
                    const maxCount = sortedTeachers[0]?.entryCount || 1;
                    const pct = Math.round(
                      (t.entryCount / Math.max(maxCount, 1)) * 100
                    );
                    return (
                      <div key={t.id} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                i === 0
                                  ? "bg-amber-100 text-amber-700"
                                  : i === 1
                                  ? "bg-slate-200 text-slate-600"
                                  : i === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-slate-800 truncate block">
                                {t.firstName} {t.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {t.subjects.join(", ") || "No subjects"}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-brand-700 tabular-nums flex-shrink-0 ml-2">
                            {t.entryCount}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 ml-8 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weekly Trend */}
            {stats && stats.entriesByWeek.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-brand-500" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Weekly Trend
                  </h3>
                </div>
                <div className="overflow-x-auto -mx-1 px-1">
                  <div
                    className="flex items-end gap-2 min-w-0"
                    style={{
                      height: "140px",
                      minWidth: `${Math.max(stats.entriesByWeek.length * 44, 200)}px`,
                    }}
                  >
                    {stats.entriesByWeek.map((w) => {
                      const maxCount = Math.max(
                        ...stats.entriesByWeek.map((x) => x.count)
                      );
                      const height =
                        maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={w.week}
                          className="flex-1 flex flex-col items-center gap-1 min-w-[36px] group"
                        >
                          <span className="text-xs text-slate-600 font-semibold tabular-nums">
                            {w.count}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-brand-800 to-brand-600 rounded-t min-h-[4px] group-hover:from-brand-600 group-hover:to-brand-400 transition-colors"
                            style={{ height: `${Math.max(height, 8)}%` }}
                          />
                          <span className="text-[9px] text-slate-400 whitespace-nowrap">
                            W{w.week.split("-W")[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
