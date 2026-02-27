"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

interface SchoolReport {
  id: string;
  name: string;
  code: string;
  teacherCount: number;
  entryCount: number;
  complianceRate: number;
}

interface RegionalReportData {
  totalSchools: number;
  activeSchools: number;
  pendingSchools: number;
  totalTeachers: number;
  totalEntries: number;
  entriesThisMonth: number;
  complianceRate: number;
  schoolRankings: SchoolReport[];
}

export default function RegionalReportsPage() {
  const [data, setData] = useState<RegionalReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/regional/stats");
        if (res.ok) {
          setData(await res.json());
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
    if (!data) return;

    let csv = "Category,Item,Value\n";
    csv += `Overview,Total Schools,${data.totalSchools}\n`;
    csv += `Overview,Active Schools,${data.activeSchools}\n`;
    csv += `Overview,Pending Schools,${data.pendingSchools}\n`;
    csv += `Overview,Total Teachers,${data.totalTeachers}\n`;
    csv += `Overview,Total Entries,${data.totalEntries}\n`;
    csv += `Overview,Entries This Month,${data.entriesThisMonth}\n`;
    csv += `Overview,Compliance Rate,${data.complianceRate}%\n`;
    csv += "\n";
    csv += "School,Code,Teachers,Entries,Compliance\n";

    for (const s of data.schoolRankings) {
      csv += `"${s.name}",${s.code},${s.teacherCount},${s.entryCount},${s.complianceRate}%\n`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edlog-regional-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Regional Reports</h1>
            <button
              onClick={exportCSV}
              disabled={!data}
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
        ) : !data ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Failed to load report data</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Region Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{data.totalSchools}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Total Schools</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{data.activeSchools}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Active</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{data.totalTeachers}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Teachers</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{data.entriesThisMonth}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Entries (Month)</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Compliance Rate</span>
                  <span className="text-sm font-bold text-slate-900">{data.complianceRate}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.complianceRate >= 70
                        ? "bg-green-500"
                        : data.complianceRate >= 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${data.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* School Rankings */}
            {data.schoolRankings.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  School Performance Rankings
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 text-slate-400 font-medium text-xs uppercase">
                        School
                      </th>
                      <th className="text-right pb-2 text-slate-400 font-medium text-xs uppercase">
                        Teachers
                      </th>
                      <th className="text-right pb-2 text-slate-400 font-medium text-xs uppercase">
                        Entries
                      </th>
                      <th className="text-right pb-2 text-slate-400 font-medium text-xs uppercase">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schoolRankings.map((school, i) => (
                      <tr
                        key={school.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-4">
                              #{i + 1}
                            </span>
                            <div>
                              <p className="text-slate-700 font-medium text-xs">
                                {school.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {school.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {school.teacherCount}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
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

            {/* Compliance Distribution */}
            {data.schoolRankings.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Compliance Distribution
                </h3>
                <div className="space-y-2">
                  {data.schoolRankings.map((school) => {
                    const maxRate = Math.max(...data.schoolRankings.map((s) => s.complianceRate), 1);
                    const width = (school.complianceRate / maxRate) * 100;
                    return (
                      <div key={school.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 truncate mr-2">{school.name}</span>
                          <span className="text-slate-400 flex-shrink-0">{school.complianceRate}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              school.complianceRate >= 70
                                ? "bg-green-500"
                                : school.complianceRate >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(width, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
