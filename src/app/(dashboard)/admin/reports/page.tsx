"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import type { AdminStats } from "@/types";

interface TeacherRanking {
  id: string;
  firstName: string;
  lastName: string;
  entryCount: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teachers, setTeachers] = useState<TeacherRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, teachersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/teachers"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setTeachers(
            data
              .sort(
                (a: TeacherRanking, b: TeacherRanking) =>
                  b.entryCount - a.entryCount
              )
              .slice(0, 10)
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function exportCSV() {
    if (!stats) return;

    let csv = "Category,Item,Count\n";

    for (const s of stats.entriesBySubject) {
      csv += `Subject,${s.subject},${s.count}\n`;
    }

    for (const w of stats.entriesByWeek) {
      csv += `Week,${w.week},${w.count}\n`;
    }

    for (const t of teachers) {
      csv += `Teacher,${t.firstName} ${t.lastName},${t.entryCount}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edlog-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">School Reports</h1>
            <button
              onClick={exportCSV}
              disabled={!stats}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
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
            {/* Entries by Subject */}
            {stats && stats.entriesBySubject.length > 0 && (
              <div className="card p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Entries by Subject
                </h3>
                <table className="w-full text-sm min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 text-slate-400 font-medium text-xs uppercase">
                        Subject
                      </th>
                      <th className="text-right pb-2 text-slate-400 font-medium text-xs uppercase">
                        Entries
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.entriesBySubject.map((s) => {
                      const maxCount = Math.max(...stats.entriesBySubject.map((x) => x.count));
                      const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                      return (
                        <tr
                          key={s.subject}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-2.5 text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{s.subject}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900 tabular-nums pl-3">
                            {s.count}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Teachers Ranked */}
            {teachers.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Top Teachers by Entry Count
                </h3>
                <div className="space-y-1">
                  {teachers.map((t, i) => {
                    const maxCount = teachers.length > 0 ? teachers[0].entryCount : 1;
                    const pct = maxCount > 0 ? (t.entryCount / maxCount) * 100 : 0;
                    return (
                      <div key={t.id} className="py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              i === 0 ? "bg-amber-100 text-amber-700" :
                              i === 1 ? "bg-slate-200 text-slate-600" :
                              i === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-slate-100 text-slate-400"
                            }`}>
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-700 truncate">
                              {t.firstName} {t.lastName}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 tabular-nums flex-shrink-0 ml-2">
                            {t.entryCount}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 ml-8 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Entries by Week */}
            {stats && stats.entriesByWeek.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Weekly Trend
                </h3>
                <div className="overflow-x-auto -mx-1 px-1">
                  <div className="flex items-end gap-2 min-w-0" style={{ height: "140px", minWidth: `${Math.max(stats.entriesByWeek.length * 44, 200)}px` }}>
                    {stats.entriesByWeek.map((w) => {
                      const maxCount = Math.max(
                        ...stats.entriesByWeek.map((x) => x.count)
                      );
                      const height =
                        maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={w.week}
                          className="flex-1 flex flex-col items-center gap-1 min-w-[36px]"
                        >
                          <span className="text-xs text-slate-600 font-semibold tabular-nums">
                            {w.count}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-brand-800 to-brand-600 rounded-t min-h-[4px]"
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
