"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Download,
  Filter,
  BookOpen,
  Users,
  School,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Clock,
  FileText,
  Layers,
  GraduationCap,
  PenTool,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface SchoolReport {
  id: string;
  name: string;
  code: string;
  teacherCount: number;
  entryCount: number;
  complianceRate: number;
}

interface FilterOptions {
  subjects: { id: string; name: string; code: string }[];
  classes: { id: string; name: string; level: string; schoolName: string }[];
  schools: { id: string; name: string; code: string }[];
  modules: string[];
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
  filterOptions: FilterOptions;
}

interface EntryItem {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  status: string;
  notes: string | null;
  objectives: string | null;
  moduleName: string | null;
  studentAttendance: number | null;
  engagementLevel: string | null;
  createdAt: string;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  class: { id: string; name: string; level: string };
  topics: { id: string; name: string; moduleName?: string | null; subject: { id: string; name: string; code: string } }[];
  assignment?: { subject: { name: string } } | null;
  timetableSlot?: { periodLabel: string; startTime: string; endTime: string } | null;
}

export default function RegionalReportsPage() {
  const [data, setData] = useState<RegionalReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Entries
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesPage, setEntriesPage] = useState(0);
  const ENTRIES_PER_PAGE = 20;

  // View state
  const [activeTab, setActiveTab] = useState<"overview" | "entries">("overview");
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

  function toggleEntryExpand(id: string) {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  // Fetch entries when filters change or tab switches
  const fetchEntries = useCallback(async (page = 0) => {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.set("subjectId", filterSubject);
      if (filterClass) params.set("classId", filterClass);
      if (filterModule) params.set("moduleName", filterModule);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", String(ENTRIES_PER_PAGE));
      params.set("offset", String(page * ENTRIES_PER_PAGE));

      const res = await fetch(`/api/entries?${params}`);
      if (res.ok) {
        const result = await res.json();
        setEntries(result.entries);
        setEntriesTotal(result.total);
        setEntriesPage(page);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingEntries(false);
    }
  }, [filterSubject, filterClass, filterModule, filterFrom, filterTo, searchQuery]);

  useEffect(() => {
    if (activeTab === "entries") {
      fetchEntries(0);
    }
  }, [activeTab, fetchEntries]);

  // Filter school rankings
  const filteredRankings = useMemo(() => {
    if (!data) return [];
    let rankings = data.schoolRankings;
    if (filterSchool) {
      rankings = rankings.filter((s) => s.id === filterSchool);
    }
    return rankings;
  }, [data, filterSchool]);

  const hasActiveFilters = filterSchool || filterSubject || filterClass || filterModule || filterFrom || filterTo || searchQuery;

  function clearFilters() {
    setFilterSchool("");
    setFilterSubject("");
    setFilterClass("");
    setFilterModule("");
    setFilterFrom("");
    setFilterTo("");
    setSearchQuery("");
  }

  function escapeCSV(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCSV() {
    if (!data) return;

    const bom = "\uFEFF";
    const date = new Date().toISOString().split("T")[0];

    // Summary section
    let csv = "REGIONAL REPORT\n";
    csv += `Generated,${date}\n`;
    csv += `Total Schools,${data.totalSchools}\n`;
    csv += `Active Schools,${data.activeSchools}\n`;
    csv += `Pending Schools,${data.pendingSchools}\n`;
    csv += `Total Teachers,${data.totalTeachers}\n`;
    csv += `Total Entries,${data.totalEntries}\n`;
    csv += `Entries This Month,${data.entriesThisMonth}\n`;
    csv += `Compliance Rate,${data.complianceRate}%\n`;
    csv += "\n";

    // School rankings
    csv += "SCHOOL RANKINGS\n";
    csv += "Rank,School Name,School Code,Teachers,Total Entries,Compliance Rate\n";
    data.schoolRankings.forEach((s, i) => {
      csv += `${i + 1},${escapeCSV(s.name)},${s.code},${s.teacherCount},${s.entryCount},${s.complianceRate}%\n`;
    });

    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regional-report-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(entriesTotal / ENTRIES_PER_PAGE);

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
        {/* Tab switcher */}
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors ${
              activeTab === "overview"
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("entries")}
            className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors ${
              activeTab === "entries"
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Entries
          </button>
        </div>

        {/* Filters */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                Filters
              </span>
              {hasActiveFilters && (
                <span className="text-[10px] bg-brand-100 text-brand-700 font-semibold px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showFilters && (
            <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
              {/* School filter */}
              {data?.filterOptions?.schools && data.filterOptions.schools.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500">School</label>
                  <select
                    value={filterSchool}
                    onChange={(e) => setFilterSchool(e.target.value)}
                    className="input-field mt-1 text-sm"
                  >
                    <option value="">All schools</option>
                    {data.filterOptions.schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject filter */}
              {data?.filterOptions?.subjects && data.filterOptions.subjects.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500">Subject</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="input-field mt-1 text-sm"
                  >
                    <option value="">All subjects</option>
                    {data.filterOptions.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class filter */}
              {data?.filterOptions?.classes && data.filterOptions.classes.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="input-field mt-1 text-sm"
                  >
                    <option value="">All classes</option>
                    {data.filterOptions.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.schoolName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Module filter */}
              {data?.filterOptions?.modules && data.filterOptions.modules.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500">Module</label>
                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="input-field mt-1 text-sm"
                  >
                    <option value="">All modules</option>
                    {data.filterOptions.modules.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-500">From</label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="input-field mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">To</label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="input-field mt-1 text-sm"
                  />
                </div>
              </div>

              {/* Search (entries tab) */}
              {activeTab === "entries" && (
                <div>
                  <label className="text-xs font-medium text-slate-500">Search</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search notes, topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-9 text-sm"
                    />
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-600 font-medium hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

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
        ) : activeTab === "overview" ? (
          <>
            {/* Overview Stats */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Region Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <School className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{data.totalSchools}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Total Schools</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <School className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{data.activeSchools}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Active</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{data.totalTeachers}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Teachers</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <BookOpen className="w-5 h-5 text-purple-500 mx-auto mb-1" />
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

            {/* School Rankings — clickable */}
            {filteredRankings.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    School Performance
                  </h3>
                </div>
                <div>
                  {filteredRankings.map((school, i) => (
                    <div key={school.id}>
                      <button
                        onClick={() =>
                          setExpandedSchool(
                            expandedSchool === school.id ? null : school.id
                          )
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-t border-slate-50"
                      >
                        <span className="text-xs text-slate-400 w-5 text-center font-medium">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {school.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{school.code}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            school.complianceRate >= 70
                              ? "bg-green-50 text-green-700"
                              : school.complianceRate >= 40
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {school.complianceRate}%
                        </span>
                        {expandedSchool === school.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {expandedSchool === school.id && (
                        <div className="px-4 pb-3 bg-slate-50 border-t border-slate-100">
                          <div className="grid grid-cols-3 gap-2 py-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-900">
                                {school.teacherCount}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase">
                                Teachers
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-900">
                                {school.entryCount}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase">
                                Entries
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-900">
                                {school.complianceRate}%
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase">
                                Compliance
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                school.complianceRate >= 70
                                  ? "bg-green-500"
                                  : school.complianceRate >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max(school.complianceRate, 3)}%` }}
                            />
                          </div>
                          <Link
                            href={`/regional/schools/${school.id}`}
                            className="block mt-3 text-center text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            View School Details
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ENTRIES TAB */
          <>
            {loadingEntries ? (
              <div className="space-y-3">
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
                <p className="text-slate-500">No entries found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-brand-600 font-medium mt-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Showing {entries.length} of {entriesTotal} entries
                </p>

                {/* Entry cards - expandable */}
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const subjectName =
                      entry.assignment?.subject?.name ??
                      entry.topics?.[0]?.subject?.name ??
                      "—";
                    const topicNames =
                      entry.topics?.length > 0
                        ? entry.topics.map((t) => t.name).join(", ")
                        : "—";
                    const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
                    const entryDate = new Date(entry.date).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    );
                    const isExpanded = expandedEntryIds.has(entry.id);

                    return (
                      <div key={entry.id} className="card overflow-hidden">
                        <button
                          onClick={() => toggleEntryExpand(entry.id)}
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
                                  {entry.status.charAt(0) + entry.status.slice(1).toLowerCase()}
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
                            <div className="flex-shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-slate-100">
                            <div className="pt-3 space-y-3">
                              {/* Topic */}
                              <div className="flex items-start gap-2">
                                <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    Topic
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {topicNames}
                                  </p>
                                </div>
                              </div>

                              {/* Module */}
                              {(entry.moduleName ||
                                entry.topics?.some((t) => t.moduleName)) && (
                                <div className="flex items-start gap-2">
                                  <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                      Module
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {entry.moduleName ||
                                        entry.topics
                                          ?.map((t) => t.moduleName)
                                          .filter(Boolean)
                                          .join(", ") ||
                                        "N/A"}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Duration */}
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    Duration
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {entry.duration} min
                                    {entry.timetableSlot && (
                                      <span className="text-slate-400 ml-2">
                                        ({entry.timetableSlot.startTime} -{" "}
                                        {entry.timetableSlot.endTime})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Notes */}
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

                              {/* Objectives */}
                              {entry.objectives && (
                                <div className="flex items-start gap-2">
                                  <PenTool className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                      Objectives
                                    </p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                      {entry.objectives}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Attendance & Engagement */}
                              {(entry.studentAttendance !== null ||
                                entry.engagementLevel) && (
                                <div className="flex gap-4">
                                  {entry.studentAttendance !== null && (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Attendance
                                      </p>
                                      <p className="text-sm font-medium text-slate-700">
                                        {entry.studentAttendance} students
                                      </p>
                                    </div>
                                  )}
                                  {entry.engagementLevel && (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Engagement
                                      </p>
                                      <p className="text-sm font-medium text-slate-700">
                                        {entry.engagementLevel}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Teacher info */}
                              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                                <span>{entry.teacher.email}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => fetchEntries(entriesPage - 1)}
                      disabled={entriesPage === 0}
                      className="text-sm text-brand-600 font-medium disabled:text-slate-300 px-3 py-1.5"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-400">
                      Page {entriesPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchEntries(entriesPage + 1)}
                      disabled={entriesPage >= totalPages - 1}
                      className="text-sm text-brand-600 font-medium disabled:text-slate-300 px-3 py-1.5"
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
