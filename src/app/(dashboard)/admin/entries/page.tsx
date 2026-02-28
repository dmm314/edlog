"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Search,
  User,
  Filter,
  X,
  Check,
  Flag,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  FileText,
  GraduationCap,
  Layers,
  PenTool,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { EntryWithRelations } from "@/types";

const PAGE_SIZE = 20;

export default function AdminEntriesPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expand state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Action state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildQueryString = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterSubject) params.set("subjectId", filterSubject);
      if (filterClass) params.set("classId", filterClass);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      return params.toString();
    },
    [debouncedSearch, filterSubject, filterClass, filterFrom, filterTo]
  );

  // Fetch entries on filter/search change
  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/entries?${buildQueryString(0)}`);
        const data = await res.json();
        if (res.ok) {
          setEntries(data.entries);
          setTotal(data.total);
        } else {
          setError(data.error || "Failed to load entries");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, [buildQueryString]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/entries?${buildQueryString(entries.length)}`
      );
      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => [...prev, ...data.entries]);
        setTotal(data.total);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }

  async function updateEntryStatus(
    entryId: string,
    status: "VERIFIED" | "FLAGGED"
  ) {
    setUpdatingId(entryId);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, status: updated.status } : e
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Extract unique teachers, subjects, and classes from loaded entries
  const allTeachers = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.teacher) {
        map.set(e.teacher.id, `${e.teacher.firstName} ${e.teacher.lastName}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const allSubjects = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.assignment?.subject) {
        map.set(e.assignment.subject.id, e.assignment.subject.name);
      }
      e.topics?.forEach((t) => {
        if (t.subject) {
          map.set(t.subject.id, t.subject.name);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const allClasses = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.class) {
        map.set(e.class.id, e.class.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  // Client-side teacher filter (API doesn't support teacherId filter)
  const filteredEntries = useMemo(() => {
    if (!filterTeacher) return entries;
    return entries.filter((e) => e.teacher?.id === filterTeacher);
  }, [entries, filterTeacher]);

  const hasActiveFilters =
    filterTeacher || filterSubject || filterClass || filterFrom || filterTo;

  function clearFilters() {
    setFilterTeacher("");
    setFilterSubject("");
    setFilterClass("");
    setFilterFrom("");
    setFilterTo("");
    setSearchQuery("");
  }

  function getSubjectName(entry: EntryWithRelations): string {
    if (entry.assignment?.subject) return entry.assignment.subject.name;
    if (entry.topics?.length > 0 && entry.topics[0].subject) {
      return entry.topics[0].subject.name;
    }
    return "N/A";
  }

  function getTopicNames(entry: EntryWithRelations): string {
    if (entry.topics?.length > 0) {
      return entry.topics.map((t) => t.name).join(", ");
    }
    if (entry.topicText) return entry.topicText;
    return "N/A";
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            Verified
          </span>
        );
      case "FLAGGED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
            <Flag className="w-3 h-3" />
            Flagged
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            Submitted
          </span>
        );
    }
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
            <div>
              <h1 className="text-xl font-bold text-white">All Entries</h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {total} entr{total !== 1 ? "ies" : "y"} across your school
              </p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
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

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              hasActiveFilters
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 bg-brand-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div>
              <label className="label-field">Teacher</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="input-field"
              >
                <option value="">All teachers</option>
                {allTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="input-field"
              >
                <option value="">All subjects</option>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="input-field"
              >
                <option value="">All classes</option>
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">From</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">To</label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {(searchQuery || hasActiveFilters) && !loading && (
          <p className="text-xs text-slate-400">
            Showing {filteredEntries.length} of {total} entr
            {total !== 1 ? "ies" : "y"}
          </p>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-1.5" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No entries found</p>
            <p className="text-sm text-slate-400 mt-1">
              {hasActiveFilters || searchQuery
                ? "Try adjusting your filters or search query"
                : "No entries have been submitted yet"}
            </p>
            {(hasActiveFilters || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-600 font-medium mt-3"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Entries List */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const isExpanded = expandedIds.has(entry.id);
                const subjectName = getSubjectName(entry);
                const topicNames = getTopicNames(entry);
                const teacherName = entry.teacher
                  ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
                  : "Unknown";

                return (
                  <div key={entry.id} className="card overflow-hidden">
                    {/* Collapsed header - always visible */}
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              {subjectName}
                            </span>
                            <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                              {entry.class?.name || "N/A"}
                            </span>
                            {getStatusBadge(entry.status)}
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
                              {formatDate(entry.date)}
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

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-100">
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

                          {/* Duration & Timetable */}
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

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() =>
                                updateEntryStatus(entry.id, "VERIFIED")
                              }
                              disabled={
                                updatingId === entry.id ||
                                entry.status === "VERIFIED"
                              }
                              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl px-3 py-2 transition-colors ${
                                entry.status === "VERIFIED"
                                  ? "bg-green-50 text-green-700 cursor-default"
                                  : "btn-primary"
                              }`}
                            >
                              {updatingId === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              {entry.status === "VERIFIED"
                                ? "Verified"
                                : "Verify"}
                            </button>
                            <button
                              onClick={() =>
                                updateEntryStatus(entry.id, "FLAGGED")
                              }
                              disabled={
                                updatingId === entry.id ||
                                entry.status === "FLAGGED"
                              }
                              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl px-3 py-2 transition-colors ${
                                entry.status === "FLAGGED"
                                  ? "bg-red-50 text-red-700 cursor-default"
                                  : "btn-secondary"
                              }`}
                            >
                              {updatingId === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Flag className="w-4 h-4" />
                              )}
                              {entry.status === "FLAGGED" ? "Flagged" : "Flag"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {entries.length < total && (
              <div className="pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More ({entries.length} of {total})
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
