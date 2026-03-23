"use client";

import { useState, useEffect, useMemo } from "react";
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
  GraduationCap,
  Megaphone,
  ChevronRight,
  Send,
  Loader2,
  MessageSquare,
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
  const [filterModule, setFilterModule] = useState("");
  const [classLevels, setClassLevels] = useState<string[]>([]);
  const [deptClasses, setDeptClasses] = useState<{ id: string; name: string; level: string }[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  // HOD remark state
  const [hodRemarkText, setHodRemarkText] = useState<Record<string, string>>({});
  const [hodRemarkSending, setHodRemarkSending] = useState<string | null>(null);
  const [hodRemarkSent, setHodRemarkSent] = useState<Set<string>>(new Set());

  // Overview: filter by class for teacher monitoring
  const [overviewClassFilter, setOverviewClassFilter] = useState("");

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
      if (filterModule) params.set("moduleName", filterModule);
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
        if (data.modules) setModules(data.modules);
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
  }, [activeTab, filterTeacher, filterSubject, filterClassLevel, filterClass, filterModule]);

  function toggleEntry(id: string) {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendHodRemark(entryId: string) {
    const content = hodRemarkText[entryId]?.trim();
    if (!content) return;
    setHodRemarkSending(entryId);
    try {
      const res = await fetch(`/api/entries/${entryId}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setHodRemarkSent((prev) => new Set(prev).add(entryId));
        setHodRemarkText((prev) => ({ ...prev, [entryId]: "" }));
      }
    } catch {
      // silently fail
    } finally {
      setHodRemarkSending(null);
    }
  }

  // Filter teacher rankings by class for overview tab
  const filteredRankings = useMemo(() => {
    if (!stats || !overviewClassFilter) return stats?.teacherRankings || [];
    return stats.teacherRankings.filter((t) =>
      t.classes?.some((c) => c.className === overviewClassFilter)
    );
  }, [stats, overviewClassFilter]);

  // Get all unique class names from teacher rankings for the overview filter
  const overviewClassOptions = useMemo(() => {
    if (!stats) return [];
    const classNames = new Set<string>();
    for (const t of stats.teacherRankings) {
      for (const c of t.classes || []) {
        classNames.add(c.className);
      }
    }
    return Array.from(classNames).sort();
  }, [stats]);

  const totalPages = Math.ceil(entriesTotal / 20);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem]">
          <div className="page-shell">
            <div className="h-6 w-40 bg-[hsl(var(--surface-elevated))]/15 rounded mb-2 animate-pulse" />
            <div className="h-4 w-28 bg-[hsl(var(--surface-elevated))]/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="page-shell px-5 mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-10 bg-[var(--skeleton-base)] rounded mb-3" />
              <div className="h-3 bg-[var(--skeleton-base)] rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="text-center">
          <Crown className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] font-semibold">
            You are not assigned as HOD
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Contact your school admin to be designated
          </p>
          <Link
            href="/logbook"
            className="text-sm text-[var(--accent-text)] font-semibold mt-3 inline-block"
          >
            Go to Logbook
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent-strong)/0.2)] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--accent-soft))]0/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />

        <div className="page-shell relative">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Logbook
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-[hsl(var(--accent-glow))]" />
            <p className="text-[hsl(var(--accent-glow))]/80 text-xs font-semibold uppercase tracking-wider">
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
                className="text-[10px] font-bold bg-[hsl(var(--surface-elevated))]/10 text-white px-2.5 py-1 rounded-lg"
              >
                {s.name}
                {s.divisions && s.divisions.length > 0 && (
                  <span className="text-white/70 ml-1">
                    ({s.divisions.length} div.)
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="page-shell px-5 mt-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
              {stats.teachersInDept}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] font-semibold">
              Teachers
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
              {stats.totalEntries}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] font-semibold">
              Total Entries
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
              {stats.entriesThisMonth}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] font-semibold">
              This Month
            </p>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
              {stats.entriesThisWeek}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] font-semibold">
              This Week
            </p>
          </div>
        </div>

        {/* Send Announcement */}
        <Link
          href="/hod/announcements"
          className="flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent-soft)), hsl(var(--accent-soft)))",
            border: "1px solid hsl(var(--accent) / 0.2)",
            borderRadius: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "hsl(var(--accent-text))" }}>
                Send Announcement
              </span>
              <span className="block" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "hsl(var(--accent-text))" }}>
                Message teachers in your department
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--accent-glow))] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Tab switcher */}
        <div className="flex bg-[hsl(var(--surface-elevated))] rounded-xl border border-[var(--border-primary)] p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-[hsl(var(--accent-strong))] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveTab("entries")}
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
              activeTab === "entries"
                ? "bg-[hsl(var(--accent-strong))] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Entries
          </button>
        </div>

        {activeTab === "overview" ? (
          /* Teacher Rankings with class filter */
          <div className="card overflow-hidden">
            <div className="p-4 pb-2 space-y-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Teacher Activity (This Month)
              </h3>
              {/* Class filter for overview */}
              {overviewClassOptions.length > 1 && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <select
                    value={overviewClassFilter}
                    onChange={(e) => setOverviewClassFilter(e.target.value)}
                    className="text-xs bg-[hsl(var(--surface-tertiary))] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 text-[var(--text-secondary)] flex-1"
                  >
                    <option value="">All classes</option>
                    {overviewClassOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {overviewClassFilter && (
                    <button
                      onClick={() => setOverviewClassFilter("")}
                      className="text-[10px] text-red-500 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              {filteredRankings.map((t, i) => {
                const maxEntries = filteredRankings[0]?.monthlyEntries || 1;
                const pct = Math.round((t.monthlyEntries / Math.max(maxEntries, 1)) * 100);
                // Filter classes shown based on overview class filter
                const displayClasses = overviewClassFilter
                  ? t.classes?.filter((c) => c.className === overviewClassFilter)
                  : t.classes;
                return (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            i === 0
                              ? "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]"
                              : i === 1
                              ? "bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)]"
                              : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right flex-shrink-0">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {t.totalEntries} total
                        </span>
                        <span className="text-sm font-bold text-[hsl(var(--accent-text))] tabular-nums">
                          {t.monthlyEntries}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[hsl(var(--surface-tertiary))] rounded-full mt-2 ml-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent-glow))] rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    {displayClasses && displayClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 ml-8">
                        {displayClasses.map((c, ci) => (
                          <span
                            key={ci}
                            className="text-[9px] bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded font-medium"
                          >
                            {c.className}{c.division ? ` · ${c.division}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredRankings.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[var(--text-tertiary)] text-sm">
                    {overviewClassFilter
                      ? "No teachers assigned to this class"
                      : "No teachers assigned to your subjects yet"}
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

              {/* Module filter */}
              {modules.length > 0 && (
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All modules</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              {/* Active filters indicator */}
              {(filterTeacher || filterSubject || filterClassLevel || filterClass || filterModule) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">Active filters:</span>
                  {filterTeacher && (
                    <span className="text-[10px] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] font-semibold px-2 py-0.5 rounded-full border border-[hsl(var(--accent)/0.2)]">
                      Teacher
                      <button onClick={() => setFilterTeacher("")} className="ml-1 text-[hsl(var(--accent-glow))] hover:text-[hsl(var(--accent-strong))]">&times;</button>
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
                  {filterModule && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                      Module
                      <button onClick={() => setFilterModule("")} className="ml-1 text-indigo-400 hover:text-indigo-600">&times;</button>
                    </span>
                  )}
                  <button
                    onClick={() => { setFilterTeacher(""); setFilterSubject(""); setFilterClassLevel(""); setFilterClass(""); setFilterModule(""); }}
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
                    <div className="h-3 bg-[var(--skeleton-base)] rounded w-2/3 mb-2" />
                    <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)] text-sm">No entries found</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Showing {entries.length} of {entriesTotal} entries
                </p>

                <div className="space-y-2">
                  {entries.map((entry) => {
                    const subjectName =
                      entry.assignment?.subject?.name ??
                      entry.topics?.[0]?.subject?.name ??
                      "—";
                    const divisionName = entry.assignment?.division?.name;
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
                                {divisionName && (
                                  <span className="text-[10px] font-medium bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] px-1.5 py-0.5 rounded">
                                    {divisionName}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                                  {entry.class.name}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    entry.status === "VERIFIED"
                                      ? "bg-green-50 text-green-700"
                                      : entry.status === "FLAGGED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-[hsl(var(--surface-tertiary))] text-[var(--text-tertiary)]"
                                  }`}
                                >
                                  {entry.status.charAt(0) +
                                    entry.status.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                <User className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                  {teacherName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
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
                                {entry.moduleName && (
                                  <span className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {entry.moduleName}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-[var(--border-secondary)]">
                            <div className="pt-3 space-y-3">
                              {entry.topics.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Layers className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                                      Topics
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                      {entry.topics
                                        .map((t) => t.name)
                                        .join(", ")}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {entry.topicText && (
                                <div className="flex items-start gap-2">
                                  <BookOpen className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                                      Topic Taught
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                      {entry.topicText}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {entry.moduleName && (
                                <div className="flex items-start gap-2">
                                  <BookOpen className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                                      Module
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                      {entry.moduleName}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {entry.notes && (
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                                      Notes
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                                      {entry.notes}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-[var(--border-secondary)] text-xs text-[var(--text-tertiary)]">
                                {entry.teacher.email} &middot; {entry.duration}
                                min
                              </div>

                              {/* HOD Remark */}
                              <div className="pt-3 border-t border-[var(--border-secondary)]">
                                {hodRemarkSent.has(entry.id) ? (
                                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                    <MessageSquare className="w-4 h-4" />
                                    HOD review sent
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--accent-strong))] flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      Leave HOD Review
                                    </label>
                                    <div className="flex gap-2">
                                      <textarea
                                        value={hodRemarkText[entry.id] || ""}
                                        onChange={(e) =>
                                          setHodRemarkText((prev) => ({
                                            ...prev,
                                            [entry.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="e.g., Consider using the PhET simulation for forces..."
                                        maxLength={1000}
                                        rows={2}
                                        className="flex-1 bg-[hsl(var(--surface-elevated))] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent resize-none"
                                      />
                                      <button
                                        onClick={() => sendHodRemark(entry.id)}
                                        disabled={
                                          !hodRemarkText[entry.id]?.trim() ||
                                          hodRemarkSending === entry.id
                                        }
                                        className="self-end w-10 h-10 bg-[hsl(var(--accent-strong))] text-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                      >
                                        {hodRemarkSending === entry.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Send className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] text-[var(--text-quaternary)]">
                                        {(hodRemarkText[entry.id] || "").length}/1000
                                      </p>
                                      <Link
                                        href={`/logbook/${entry.id}`}
                                        className="text-[10px] text-[hsl(var(--accent-strong))] font-semibold hover:underline"
                                      >
                                        View full entry &rarr;
                                      </Link>
                                    </div>
                                  </div>
                                )}
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
                      className="text-sm text-[hsl(var(--accent-strong))] font-medium disabled:text-[var(--text-quaternary)] px-3 py-1.5"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchEntries(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="text-sm text-[hsl(var(--accent-strong))] font-medium disabled:text-[var(--text-quaternary)] px-3 py-1.5"
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
