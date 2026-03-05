"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Users,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Layers,
  FileText,
  ArrowLeft,
} from "lucide-react";

interface HODStats {
  hodSubjects: {
    id: string;
    name: string;
    code: string;
    divisions?: { id: string; name: string }[];
  }[];
  teachersInDept: number;
  totalEntries: number;
  entriesThisMonth: number;
  entriesThisWeek: number;
  teacherRankings: {
    id: string;
    name: string;
    totalEntries: number;
    monthlyEntries: number;
    classes?: { className: string; subject: string; division: string | null }[];
  }[];
}

interface EntryItem {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  status: string;
  notes: string | null;
  moduleName: string | null;
  topicText: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string | null;
  };
  class: { id: string; name: string };
  topics: { id: string; name: string; subject: { name: string } }[];
  assignment?: { subject: { name: string }; division?: { name: string } | null } | null;
}

export default function HODDashboard() {
  const [stats, setStats] = useState<HODStats | null>(null);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "entries">("overview");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClassLevel, setFilterClassLevel] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [classLevels, setClassLevels] = useState<string[]>([]);
  const [deptClasses, setDeptClasses] = useState<{ id: string; name: string; level: string }[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/hod/stats");
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

  async function fetchEntries(p = 0) {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (filterTeacher) params.set("teacherId", filterTeacher);
      if (filterSubject) params.set("subjectId", filterSubject);
      if (filterClassLevel) params.set("classLevel", filterClassLevel);
      if (filterClass) params.set("classId", filterClass);
      params.set("limit", "20");
      params.set("offset", String(p * 20));

      const res = await fetch(`/api/hod/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setEntriesTotal(data.total);
        setPage(p);
        if (data.classLevels) setClassLevels(data.classLevels);
        if (data.classes) setDeptClasses(data.classes);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    if (activeTab === "entries") {
      fetchEntries(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterTeacher, filterSubject, filterClassLevel, filterClass]);

  function toggleEntry(id: string) {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalPages = Math.ceil(entriesTotal / 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 px-5 pt-10 pb-8 rounded-b-[2rem]">
          <div className="max-w-lg mx-auto">
            <div className="h-6 w-40 bg-white/15 rounded mb-2 animate-pulse" />
            <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-10 bg-slate-200 rounded mb-3" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">
            You are not assigned as HOD
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Contact your school admin to be designated
          </p>
          <Link
            href="/logbook"
            className="text-sm text-brand-600 font-semibold mt-3 inline-block"
          >
            Go to Logbook
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header — amber/gold theme for HOD */}
      <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />

        <div className="max-w-lg mx-auto relative">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Logbook
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-400" />
            <p className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider">
              Head of Department
            </p>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Department Dashboard
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.hodSubjects.map((s) => (
              <span
                key={s.id}
                className="text-[10px] font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg"
              >
                {s.name}
                {s.divisions && s.divisions.length > 0 && (
                  <span className="text-white/60 ml-1">
                    ({s.divisions.length} div.)
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.teachersInDept}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold">
              Teachers
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.totalEntries}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold">
              Total Entries
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.entriesThisMonth}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold">
              This Month
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.entriesThisWeek}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold">
              This Week
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveTab("entries")}
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
              activeTab === "entries"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Entries
          </button>
        </div>

        {activeTab === "overview" ? (
          /* Teacher Rankings */
          <div className="card overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Teacher Activity (This Month)
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.teacherRankings.map((t, i) => {
                const maxEntries = stats.teacherRankings[0]?.monthlyEntries || 1;
                const pct = Math.round((t.monthlyEntries / Math.max(maxEntries, 1)) * 100);
                return (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
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
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right flex-shrink-0">
                        <span className="text-xs text-slate-400">
                          {t.totalEntries} total
                        </span>
                        <span className="text-sm font-bold text-amber-700 tabular-nums">
                          {t.monthlyEntries}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-2 ml-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    {t.classes && t.classes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 ml-8">
                        {t.classes.map((c, ci) => (
                          <span
                            key={ci}
                            className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium"
                          >
                            {c.className}{c.division ? ` · ${c.division}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {stats.teacherRankings.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-400 text-sm">
                    No teachers assigned to your subjects yet
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Entries Tab */
          <>
            {/* Filters */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="input-field text-sm flex-1"
                >
                  <option value="">All teachers</option>
                  {stats.teacherRankings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {stats.hodSubjects.length > 1 && (
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="input-field text-sm flex-1"
                  >
                    <option value="">All subjects</option>
                    {stats.hodSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Class / Form Level Filter */}
              <div className="flex gap-2">
                {classLevels.length > 0 && (
                  <select
                    value={filterClassLevel}
                    onChange={(e) => { setFilterClassLevel(e.target.value); setFilterClass(""); }}
                    className="input-field text-sm flex-1"
                  >
                    <option value="">All forms</option>
                    {classLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                )}
                {deptClasses.length > 0 && (
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="input-field text-sm flex-1"
                  >
                    <option value="">All classes</option>
                    {deptClasses
                      .filter((c) => !filterClassLevel || c.level === filterClassLevel)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                )}
              </div>

              {/* Active filters indicator */}
              {(filterTeacher || filterSubject || filterClassLevel || filterClass) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-400">Active filters:</span>
                  {filterTeacher && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      Teacher
                      <button onClick={() => setFilterTeacher("")} className="ml-1 text-amber-400 hover:text-amber-600">&times;</button>
                    </span>
                  )}
                  {filterSubject && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      Subject
                      <button onClick={() => setFilterSubject("")} className="ml-1 text-blue-400 hover:text-blue-600">&times;</button>
                    </span>
                  )}
                  {filterClassLevel && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                      {filterClassLevel}
                      <button onClick={() => { setFilterClassLevel(""); setFilterClass(""); }} className="ml-1 text-purple-400 hover:text-purple-600">&times;</button>
                    </span>
                  )}
                  {filterClass && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      Class
                      <button onClick={() => setFilterClass("")} className="ml-1 text-emerald-400 hover:text-emerald-600">&times;</button>
                    </span>
                  )}
                  <button
                    onClick={() => { setFilterTeacher(""); setFilterSubject(""); setFilterClassLevel(""); setFilterClass(""); }}
                    className="text-[10px] text-red-500 font-semibold underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {loadingEntries ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No entries found</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Showing {entries.length} of {entriesTotal} entries
                </p>

                <div className="space-y-2">
                  {entries.map((entry) => {
                    const subjectName =
                      entry.assignment?.subject?.name ??
                      entry.topics?.[0]?.subject?.name ??
                      "—";
                    const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
                    const entryDate = new Date(entry.date).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    );
                    const isExpanded = expandedEntries.has(entry.id);

                    return (
                      <div key={entry.id} className="card overflow-hidden">
                        <button
                          onClick={() => toggleEntry(entry.id)}
                          className="w-full p-3 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                  {subjectName}
                                </span>
                                <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                                  {entry.class.name}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    entry.status === "VERIFIED"
                                      ? "bg-green-50 text-green-700"
                                      : entry.status === "FLAGGED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {entry.status.charAt(0) +
                                    entry.status.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-sm font-semibold text-brand-950 truncate">
                                  {teacherName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {entryDate}
                                </span>
                                {entry.period && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Period {entry.period}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-slate-100">
                            <div className="pt-3 space-y-3">
                              {entry.topics.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                      Topics
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {entry.topics
                                        .map((t) => t.name)
                                        .join(", ")}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {entry.moduleName && (
                                <div className="flex items-start gap-2">
                                  <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                      Module
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {entry.moduleName}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {entry.notes && (
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                      Notes
                                    </p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                      {entry.notes}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                                {entry.teacher.email} &middot; {entry.duration}
                                min
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => fetchEntries(page - 1)}
                      disabled={page === 0}
                      className="text-sm text-amber-600 font-medium disabled:text-slate-300 px-3 py-1.5"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-400">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchEntries(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="text-sm text-amber-600 font-medium disabled:text-slate-300 px-3 py-1.5"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
