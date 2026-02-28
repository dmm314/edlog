"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Layers,
  FileText,
  GraduationCap,
  Calendar,
  PenTool,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import type { EntryWithRelations, SubjectWithTopics, ClassOption } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    SUBMITTED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    VERIFIED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    FLAGGED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    DRAFT: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  };
  const s = styles[status] || styles.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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

  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/classes").then((r) => (r.ok ? r.json() : [])),
    ]).then(([s, c]) => {
      setSubjects(s);
      setClasses(c);
    });
  }, []);

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
    const params = new URLSearchParams({ limit: "20", offset: String(offset) });
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

  function getSubjectName(entry: EntryWithRelations): string {
    return entry.assignment?.subject?.name ?? entry.topics?.[0]?.subject?.name ?? "—";
  }

  function getTopicDisplay(entry: EntryWithRelations): string {
    if (entry.topicText) return entry.topicText;
    if (entry.topics?.[0]?.name) {
      return entry.topics[0].moduleName
        ? `${entry.topics[0].moduleName}: ${entry.topics[0].name}`
        : entry.topics[0].name;
    }
    return "—";
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Entry History</h1>
          </div>
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
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-500 mb-3"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-field">
                <option value="">All Subjects</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label className="label-field">Class</label>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input-field">
                <option value="">All Classes</option>
                {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            {(subjectFilter || classFilter) && (
              <button onClick={() => { setSubjectFilter(""); setClassFilter(""); }} className="text-sm text-brand-700 font-semibold">
                Clear filters
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-slate-400 mb-3">{total} {total === 1 ? "entry" : "entries"} found</p>

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
              {search ? "Try a different search term" : "Start by creating your first entry"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isExpanded = expandedEntry === entry.id;
              const subjectName = getSubjectName(entry);
              const topicDisplay = getTopicDisplay(entry);

              return (
                <div
                  key={entry.id}
                  className={`card overflow-hidden transition-all ${isExpanded ? "ring-2 ring-brand-200" : ""}`}
                >
                  {/* Collapsed card */}
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}>
                    <div className="flex items-start justify-between mb-1.5">
                      <h4 className="font-bold text-brand-950 text-[15px]">{subjectName}</h4>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">{topicDisplay}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">{entry.class.name}</span>
                      <span>&middot;</span>
                      <span>{formatDate(entry.date)}</span>
                      {entry.timetableSlot && (
                        <>
                          <span>&middot;</span>
                          <span>{entry.timetableSlot.periodLabel}</span>
                        </>
                      )}
                      {!entry.timetableSlot && entry.period && (
                        <>
                          <span>&middot;</span>
                          <span>Period {entry.period}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5">
                        <p className="text-white font-bold text-sm">{subjectName}</p>
                        <p className="text-white/70 text-[11px]">
                          {entry.class.name} &middot; {formatDate(entry.date)} &middot; {formatTime(entry.createdAt)}
                        </p>
                      </div>

                      <div className="p-5 space-y-0 divide-y divide-slate-100">
                        {/* Module & Topic */}
                        <div className="pb-3.5">
                          {(entry.moduleName || entry.topics?.[0]?.moduleName) && (
                            <div className="flex items-start gap-3 mb-2.5">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Layers className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Module</p>
                                <p className="text-sm font-medium text-slate-800">
                                  {entry.moduleName || entry.topics?.[0]?.moduleName || "—"}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <PenTool className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Topic Covered</p>
                              <p className="text-sm font-medium text-slate-800">{topicDisplay}</p>
                            </div>
                          </div>
                        </div>

                        {/* Period, Time, Duration */}
                        <div className="py-3.5">
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                              <p className="text-[9px] text-slate-400 font-medium uppercase">Period</p>
                              <p className="text-xs font-bold text-slate-800">
                                {entry.timetableSlot?.periodLabel || (entry.period ? `P${entry.period}` : "—")}
                              </p>
                            </div>
                            <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                              <p className="text-[9px] text-slate-400 font-medium uppercase">Time</p>
                              <p className="text-xs font-bold text-slate-800">
                                {entry.timetableSlot ? `${entry.timetableSlot.startTime}-${entry.timetableSlot.endTime}` : "—"}
                              </p>
                            </div>
                            <div className="text-center bg-slate-50 rounded-xl py-2.5 px-2">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                              <p className="text-[9px] text-slate-400 font-medium uppercase">Duration</p>
                              <p className="text-xs font-bold text-slate-800">{entry.duration} min</p>
                            </div>
                          </div>
                        </div>

                        {entry.objectives && (
                          <div className="py-3.5">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Objectives</p>
                                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{entry.objectives}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {entry.notes && (
                          <div className="py-3.5">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Notes</p>
                                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{entry.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {entry.signatureData && (
                          <div className="pt-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Digital Signature</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={entry.signatureData} alt="Signature" className="h-14 border border-slate-200 rounded-lg bg-white p-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {entries.length < total && (
              <button onClick={loadMore} disabled={loadingMore} className="btn-secondary w-full flex items-center justify-center gap-2">
                {loadingMore && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
