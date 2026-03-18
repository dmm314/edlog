"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Search,
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
  Users,
  Bell,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import type { EntryWithRelations } from "@/types";

const PAGE_SIZE = 20;

function EntryTeacherAvatar({
  teacher,
  size = "sm",
}: {
  teacher: { firstName: string; lastName: string; photoUrl?: string | null };
  size?: "sm" | "md";
}) {
  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toUpperCase();
  const dims = size === "md" ? "w-9 h-9" : "w-7 h-7";
  const imgDim = size === "md" ? 36 : 28;
  const textSize = size === "md" ? "text-xs" : "text-[10px]";

  if (teacher.photoUrl) {
    return (
      <Image
        src={teacher.photoUrl}
        alt={`${teacher.firstName} ${teacher.lastName}`}
        width={imgDim}
        height={imgDim}
        className={`${dims} rounded-xl object-cover ring-1 ring-white shadow-sm flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${dims} rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center ring-1 ring-white shadow-sm flex-shrink-0`}>
      <span className={`${textSize} font-bold text-white`}>{initials}</span>
    </div>
  );
}

export default function AdminEntriesPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Whether this school has active VPs (null = loading)
  const [hasVPs, setHasVPs] = useState<boolean | null>(null);

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

  // Remark modal (admin observation — no status change)
  const [remarkModal, setRemarkModal] = useState<{ entryId: string } | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [remarkSubmitting, setRemarkSubmitting] = useState(false);

  // Notify VP state
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notifyResult, setNotifyResult] = useState<Record<string, "sent" | "no-vp">>({});

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if school has active VPs
  useEffect(() => {
    async function checkVPs() {
      try {
        const res = await fetch("/api/admin/coordinators");
        if (res.ok) {
          const coordinatorsData = await res.json();
          const coordinators = Array.isArray(coordinatorsData) ? coordinatorsData : (coordinatorsData.coordinators || []);
          setHasVPs(coordinators.some((c: { isActive: boolean }) => c.isActive));
        } else {
          setHasVPs(false);
        }
      } catch {
        setHasVPs(false);
      }
    }
    checkVPs();
  }, []);

  const buildQueryString = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterTeacher) params.set("teacherId", filterTeacher);
      if (filterSubject) params.set("subjectName", filterSubject);
      if (filterClass) params.set("className", filterClass);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      return params.toString();
    },
    [debouncedSearch, filterTeacher, filterSubject, filterClass, filterFrom, filterTo]
  );

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
          setError(data.detail ? `${data.error}: ${data.detail}` : (data.error || "Failed to load entries"));
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
      const res = await fetch(`/api/entries?${buildQueryString(entries.length)}`);
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

  async function submitRemark() {
    if (!remarkModal || !remarkText.trim()) return;
    setRemarkSubmitting(true);
    try {
      await fetch(`/api/entries/${remarkModal.entryId}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: remarkText.trim() }),
      });
    } catch {
      // silently fail
    } finally {
      setRemarkSubmitting(false);
      setRemarkModal(null);
      setRemarkText("");
    }
  }

  async function notifyVP(entryId: string) {
    setNotifyingId(entryId);
    try {
      const res = await fetch(`/api/admin/entries/${entryId}/notify-vp`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setNotifyResult((prev) => ({ ...prev, [entryId]: "sent" }));
      } else if (res.status === 404) {
        setNotifyResult((prev) => ({ ...prev, [entryId]: "no-vp" }));
      } else {
        setNotifyResult((prev) => ({ ...prev, [entryId]: "no-vp" }));
        console.error(data.error);
      }
    } catch {
      setNotifyResult((prev) => ({ ...prev, [entryId]: "no-vp" }));
    } finally {
      setNotifyingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Fetch filter options
  const [allTeachers, setAllTeachers] = useState<{ id: string; name: string; photoUrl?: string | null }[]>([]);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string }[]>([]);
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const res = await fetch("/api/admin/teachers");
        if (res.ok) {
          const teachers = await res.json();
          setAllTeachers(
            teachers.map((t: { id: string; firstName: string; lastName: string; photoUrl?: string | null }) => ({
              id: t.id,
              name: `${t.firstName} ${t.lastName}`,
              photoUrl: t.photoUrl,
            }))
          );
          const classMap = new Map<string, string>();
          for (const t of teachers) {
            for (const sc of t.subjectClasses || []) {
              for (const c of sc.classes) {
                classMap.set(c, c);
              }
            }
          }
          const statsRes = await fetch("/api/admin/stats");
          if (statsRes.ok) {
            const stats = await statsRes.json();
            if (stats.entriesBySubject) {
              setAllSubjects(stats.entriesBySubject.map((s: { subject: string }) => ({
                id: s.subject,
                name: s.subject,
              })));
            }
          }
          setAllClasses(Array.from(classMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
        // silently fail
      }
    }
    fetchFilterOptions();
  }, []);

  const hasActiveFilters = filterTeacher || filterSubject || filterClass || filterFrom || filterTo;

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
    if (entry.topics?.length > 0 && entry.topics[0].subject) return entry.topics[0].subject.name;
    return "N/A";
  }

  function getTopicNames(entry: EntryWithRelations): string {
    if (entry.topics?.length > 0) return entry.topics.map((t) => t.name).join(", ");
    if (entry.topicText) return entry.topicText;
    return "N/A";
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
            <Check className="w-3 h-3" />
            Verified by VP
          </span>
        );
      case "FLAGGED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
            <Flag className="w-3 h-3" />
            Flagged by VP
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
            Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
            Pending
          </span>
        );
    }
  }

  const activeFilterCount = [filterTeacher, filterSubject, filterClass, filterFrom, filterTo].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--header-from)] via-[var(--header-via)] to-[var(--header-to)] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[rgba(245,158,11,0.08)] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />

        <div className="mx-auto w-full max-w-6xl relative">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--header-text-muted)]" />
              Entry Overview
            </h1>
            <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
              {total} entr{total !== 1 ? "ies" : "y"} across your school
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-6xl px-5 space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
            {error}
          </div>
        )}

        {/* Verification policy banner */}
        <div className="flex flex-wrap items-start gap-3 rounded-2xl px-4 py-3 text-sm" style={{
          background: "rgba(79,70,229,0.06)",
          border: "1px solid rgba(79,70,229,0.14)"
        }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <p style={{ color: "#3730A3" }}>
              Entry verification is managed by Level Coordinators (VPs). Contact the VP for this level if there&apos;s an issue.
            </p>
            {hasVPs === false ? (
              <p className="mt-1" style={{ color: "#5B21B6" }}>
                No active VP is assigned yet for this school. Set up coordinators so entries can move through review properly.
              </p>
            ) : null}
          </div>
          <Link href="/admin/coordinators" className="text-sm font-semibold underline" style={{ color: "#4338CA" }}>
            Manage VPs
          </Link>
        </div>

        {/* No VPs setup banner */}
        {hasVPs === false && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm" style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)"
          }}>
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p style={{ color: "#92400E" }}>
              Entries will stay pending until a VP is assigned.{" "}
              <Link href="/admin/coordinators" className="font-semibold underline">Set up VPs</Link>{" "}
              to activate level-based review.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent shadow-sm transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 shadow-sm ${
              hasActiveFilters
                ? "border-[var(--accent)] text-[var(--accent-text)]"
                : "bg-[var(--bg-elevated)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
            style={hasActiveFilters ? { background: "var(--accent-light)" } : undefined}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-[var(--accent)] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="animate-slide-down card p-5 space-y-3 border-[var(--border-secondary)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-secondary)]">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[var(--accent-text)] font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div>
              <label className="label-field">Teacher</label>
              <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="input-field">
                <option value="">All teachers</option>
                {allTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Subject</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="input-field">
                <option value="">All subjects</option>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Class</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input-field">
                <option value="">All classes</option>
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">From</label>
                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">To</label>
                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="input-field" />
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {(searchQuery || hasActiveFilters) && !loading && (
          <p className="text-xs text-[var(--text-tertiary)] font-medium px-1">
            Showing {entries.length} of {total} entr{total !== 1 ? "ies" : "y"}
          </p>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/3" />
                  <div className="h-4 bg-[var(--skeleton-base)] rounded w-16" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 bg-[var(--skeleton-base)] rounded-xl" />
                  <div className="h-4 bg-[var(--skeleton-base)] rounded w-24" />
                </div>
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BookOpen className="w-8 h-8 text-[var(--text-quaternary)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-semibold">No entries found</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
              {hasActiveFilters || searchQuery
                ? "Try adjusting your filters or search query"
                : "No entries have been submitted yet"}
            </p>
            {(hasActiveFilters || searchQuery) && (
              <button onClick={clearFilters} className="text-sm text-[var(--accent-text)] font-semibold mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map((entry) => {
                const isExpanded = expandedIds.has(entry.id);
                const subjectName = getSubjectName(entry);
                const topicNames = getTopicNames(entry);
                const teacherName = entry.teacher
                  ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
                  : "Unknown";
                const vpResult = notifyResult[entry.id];

                return (
                  <div key={entry.id} className="card overflow-hidden hover:shadow-card-hover transition-all duration-200">
                    {/* Collapsed header */}
                    <button onClick={() => toggleExpand(entry.id)} className="w-full p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                              {subjectName}
                            </span>
                            <span className="text-[10px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-secondary)]">
                              {entry.class?.name || "N/A"}
                            </span>
                            {getStatusBadge(entry.status)}
                          </div>
                          <div className="flex items-center gap-2.5">
                            {entry.teacher && <EntryTeacherAvatar teacher={entry.teacher} size="md" />}
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-[var(--text-primary)] truncate block">{teacherName}</span>
                              <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-tertiary)]">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(entry.date)}
                                </span>
                                {entry.period && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    P{entry.period}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-1 w-6 h-6 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[var(--border-secondary)]">
                        <div className="pt-4 space-y-3.5">
                          {/* Topic */}
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Layers className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Topic</p>
                              <p className="text-sm text-[var(--text-secondary)] font-medium">{topicNames}</p>
                            </div>
                          </div>

                          {/* Module */}
                          {(entry.moduleName || entry.topics?.some((t) => t.moduleName)) && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <GraduationCap className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Module</p>
                                <p className="text-sm text-[var(--text-secondary)] font-medium">
                                  {entry.moduleName || entry.topics?.map((t) => t.moduleName).filter(Boolean).join(", ") || "N/A"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Duration */}
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Duration</p>
                              <p className="text-sm text-[var(--text-secondary)] font-medium">
                                {entry.duration} min
                                {entry.timetableSlot && (
                                  <span className="text-[var(--text-tertiary)] ml-2">
                                    ({entry.timetableSlot.startTime} - {entry.timetableSlot.endTime})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Notes */}
                          {entry.notes && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Notes</p>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{entry.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Objectives */}
                          {entry.objectives && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <PenTool className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Objectives</p>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                                  {Array.isArray(entry.objectives) ? entry.objectives.map((o: { text: string }) => o.text).join(", ") : entry.objectives}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Attendance & Engagement */}
                          {(entry.studentAttendance !== null || entry.engagementLevel) && (
                            <div className="flex gap-3">
                              {entry.studentAttendance !== null && (
                                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Attendance</p>
                                  <p className="text-sm font-bold text-[var(--text-secondary)] mt-0.5">
                                    <Users className="w-3.5 h-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                                    {entry.studentAttendance} students
                                  </p>
                                </div>
                              )}
                              {entry.engagementLevel && (
                                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border-secondary)]">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Engagement</p>
                                  <p className={`text-sm font-bold mt-0.5 ${
                                    entry.engagementLevel === "HIGH" ? "text-emerald-600" :
                                    entry.engagementLevel === "MEDIUM" ? "text-amber-600" : "text-red-500"
                                  }`}>
                                    {entry.engagementLevel}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-secondary)]">
                            <Link
                              href={`/logbook/${entry.id}`}
                              className="flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 transition-all border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98]"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </Link>

                            {/* Admin remark button (always visible) */}
                            <button
                              onClick={() => { setRemarkModal({ entryId: entry.id }); setRemarkText(""); }}
                              className="flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 transition-all border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98]"
                            >
                              <PenTool className="w-4 h-4" />
                              Observe
                            </button>

                            {/* With VPs: Notify VP button */}
                            {hasVPs && (
                              vpResult === "sent" ? (
                                <span className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <Check className="w-4 h-4" />
                                  VP Notified
                                </span>
                              ) : vpResult === "no-vp" ? (
                                <span className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 text-center">
                                  No VP for this level
                                </span>
                              ) : (
                                <button
                                  onClick={() => notifyVP(entry.id)}
                                  disabled={notifyingId === entry.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 transition-all border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
                                >
                                  {notifyingId === entry.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Bell className="w-4 h-4" />
                                  )}
                                  Notify VP
                                </button>
                              )
                            )}

                            {/* Without VPs: prompt admin to assign a coordinator */}
                            {hasVPs === false && (
                              <Link
                                href="/admin/coordinators"
                                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2.5 transition-all border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.98]"
                              >
                                <Users className="w-4 h-4" />
                                Assign VP
                              </Link>
                            )}
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
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold rounded-xl flex items-center justify-center gap-2 py-3.5 shadow-sm hover:shadow-md hover:bg-[var(--bg-tertiary)] transition-all active:scale-[0.98]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More ({entries.length} of {total})</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Remark Modal (observation only — no status change) */}
      {remarkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
          <div className="bg-[var(--bg-elevated)] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 animate-slide-up shadow-elevated">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Admin Observation</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Your remark is visible to the teacher and their VP. It does not change the entry status.
              </p>
            </div>
            <div>
              <label className="label-field">Observation <span className="text-red-500">*</span></label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="e.g., Please ensure topics are aligned with the term plan..."
                maxLength={1000}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRemarkModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-[var(--text-tertiary)] rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitRemark}
                disabled={remarkSubmitting || !remarkText.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {remarkSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Observation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
