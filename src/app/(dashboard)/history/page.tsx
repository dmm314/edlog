"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { formatDate, formatTime, truncate } from "@/lib/utils";
import type { EntryWithRelations, SubjectWithTopics, ClassOption } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700",
    VERIFIED: "bg-green-50 text-green-700",
    FLAGGED: "bg-red-50 text-red-700",
    DRAFT: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.DRAFT}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Fetch filter options
  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then((r) => r.ok ? r.json() : []),
      fetch("/api/classes").then((r) => r.ok ? r.json() : []),
    ]).then(([s, c]) => {
      setSubjects(s);
      setClasses(c);
    });
  }, []);

  // Fetch entries
  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const params = new URLSearchParams({ limit: "20", offset: "0" });
      if (search) params.set("search", search);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (classFilter) params.set("classId", classFilter);

      try {
        const res = await fetch(`/api/entries?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries);
          setTotal(data.total);
          setOffset(20);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(fetchEntries, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [search, subjectFilter, classFilter]);

  async function loadMore() {
    setLoadingMore(true);
    const params = new URLSearchParams({
      limit: "20",
      offset: String(offset),
    });
    if (search) params.set("search", search);
    if (subjectFilter) params.set("subjectId", subjectFilter);
    if (classFilter) params.set("classId", classFilter);

    try {
      const res = await fetch(`/api/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => [...prev, ...data.entries]);
        setOffset((prev) => prev + 20);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Entry History</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, topic, or notes..."
              className="w-full bg-white/10 text-white placeholder:text-white/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-500 mb-3"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {(subjectFilter || classFilter) && (
            <span className="bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {(subjectFilter ? 1 : 0) + (classFilter ? 1 : 0)}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="card p-4 mb-4 space-y-3">
            <div>
              <label className="label-field">Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Class</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {(subjectFilter || classFilter) && (
              <button
                onClick={() => {
                  setSubjectFilter("");
                  setClassFilter("");
                }}
                className="text-sm text-brand-700 font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <p className="text-sm text-slate-400 mb-3">
          {total} {total === 1 ? "entry" : "entries"} found
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No entries found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search
                ? "Try a different search term"
                : "Start by creating your first entry"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="card p-4 cursor-pointer"
                onClick={() =>
                  setExpandedEntry(
                    expandedEntry === entry.id ? null : entry.id
                  )
                }
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-brand-950">
                    {entry.topics?.[0]?.subject?.name ?? "—"}
                  </h4>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="text-sm text-slate-600">
                  {entry.topics?.[0]?.moduleName
                    ? `${entry.topics[0].moduleName}: `
                    : ""}
                  {entry.topics?.[0]?.name ?? "—"}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>{entry.class.name}</span>
                  <span>&middot;</span>
                  <span>{formatDate(entry.date)}</span>
                  <span>&middot;</span>
                  <span>{formatTime(entry.createdAt)}</span>
                  {entry.period && (
                    <>
                      <span>&middot;</span>
                      <span>Period {entry.period}</span>
                    </>
                  )}
                </div>

                {/* Expanded details */}
                {expandedEntry === entry.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {entry.notes && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-slate-600">
                          {entry.notes}
                        </p>
                      </div>
                    )}
                    {entry.objectives && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                          Objectives
                        </p>
                        <p className="text-sm text-slate-600">
                          {entry.objectives}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Duration: {entry.duration} min</span>
                    </div>
                    {entry.signatureData && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                          Signature
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.signatureData}
                          alt="Signature"
                          className="h-12 border rounded"
                        />
                      </div>
                    )}
                  </div>
                )}

                {!expandedEntry || expandedEntry !== entry.id ? (
                  entry.notes ? (
                    <p className="text-sm text-slate-500 mt-2">
                      {truncate(entry.notes, 80)}
                    </p>
                  ) : null
                ) : null}
              </div>
            ))}

            {entries.length < total && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : null}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
