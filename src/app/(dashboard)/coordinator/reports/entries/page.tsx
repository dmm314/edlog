"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  Flag,
  Clock,
  FileText,
  ChevronLeft,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Entry {
  id: string;
  date: string;
  period: number | null;
  status: string;
  teacher: { id: string; firstName: string; lastName: string };
  class: { id: string; name: string; level: string };
  topics: { id: string; name: string; subject: { id: string; name: string } }[];
  remarks: { id: string; content: string }[];
}

interface FilterOption {
  value: string;
  label: string;
}

interface Filters {
  teachers: FilterOption[];
  classes: FilterOption[];
  statuses: FilterOption[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "VERIFIED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))" }}>
        <CheckCircle className="w-2.5 h-2.5" /> Verified
      </span>
    );
  }
  if (status === "FLAGGED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--danger) / 0.1)", color: "hsl(var(--danger))" }}>
        <Flag className="w-2.5 h-2.5" /> Flagged
      </span>
    );
  }
  if (status === "SUBMITTED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--info) / 0.15)", color: "hsl(var(--info))" }}>
        <Clock className="w-2.5 h-2.5" /> Submitted
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
      {status}
    </span>
  );
}

const PAGE_SIZE = 20;

export default function CoordinatorReportEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        ...(search ? { search } : {}),
        ...(filterTeacher ? { "filter[teacher]": filterTeacher } : {}),
        ...(filterClass ? { "filter[class]": filterClass } : {}),
        ...(filterStatus ? { "filter[status]": filterStatus } : {}),
        ...(filterFrom ? { "filter[dateFrom]": filterFrom } : {}),
        ...(filterTo ? { "filter[dateTo]": filterTo } : {}),
        ...(filters ? {} : { includeFilters: "true" }),
      });

      const res = await fetch(`/api/coordinator/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.pagination?.total ?? data.total ?? 0);
        if (data.filters && !filters) setFilters(data.filters);
      }
    } finally {
      setLoading(false);
    }
  }, [offset, search, filterTeacher, filterClass, filterStatus, filterFrom, filterTo, filters]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function handleSearch() { setSearch(searchInput); setOffset(0); }
  function clearFilters() {
    setFilterTeacher(""); setFilterClass(""); setFilterStatus("");
    setFilterFrom(""); setFilterTo(""); setOffset(0);
  }

  const hasActiveFilters = filterTeacher || filterClass || filterStatus || filterFrom || filterTo;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-3">
      {total > 0 && (
        <p className="text-xs text-[var(--text-tertiary)]">{total} entries found</p>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search topics, teacher, class..."
            className="input-field pl-9 pr-4"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: "hsl(var(--accent))" }}
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative px-3 py-2.5 rounded-xl transition-all active:scale-95"
          style={{
            background: showFilters || hasActiveFilters ? "hsl(var(--accent-soft))" : "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            color: hasActiveFilters ? "hsl(var(--accent-text))" : "var(--text-secondary)",
          }}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-white flex items-center justify-center" style={{ background: "#7C3AED", fontSize: "8px" }}>●</span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && filters && (
        <div className="card p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--text-primary)]">Filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-semibold flex items-center gap-1" style={{ color: "#7C3AED" }}>
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1 block">Teacher</label>
              <select value={filterTeacher} onChange={(e) => { setFilterTeacher(e.target.value); setOffset(0); }} className="input-field text-sm">
                <option value="">All teachers</option>
                {filters.teachers.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1 block">Class</label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setOffset(0); }} className="input-field text-sm">
                <option value="">All classes</option>
                {filters.classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1 block">Status</label>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setOffset(0); }} className="input-field text-sm">
                <option value="">All statuses</option>
                {filters.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1 block">From</label>
              <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setOffset(0); }} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1 block">To</label>
            <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setOffset(0); }} className="input-field text-sm" />
          </div>
        </div>
      )}

      {/* Entry list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--skeleton-base)]" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-32 mb-2" />
                  <div className="skeleton h-2.5 w-48" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
          <p className="font-bold text-[var(--text-secondary)]">No entries found</p>
          {(search || hasActiveFilters) && (
            <button onClick={() => { setSearch(""); setSearchInput(""); clearFilters(); }} className="mt-3 text-sm font-semibold" style={{ color: "#7C3AED" }}>
              Clear search & filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const topicName = entry.topics?.[0]?.name || "No topic";
            const subjectName = entry.topics?.[0]?.subject?.name || "—";
            const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
            return (
              <Link
                key={entry.id}
                href={`/coordinator/entries/${entry.id}`}
                className="card p-4 flex items-start gap-3 active:scale-[0.98] transition-transform"
                style={{
                  borderLeft: entry.status === "SUBMITTED" ? "3px solid #7C3AED"
                    : entry.status === "VERIFIED" ? "3px solid #16A34A"
                    : entry.status === "FLAGGED" ? "3px solid #DC2626"
                    : "3px solid var(--border-secondary)",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
                  style={{ background: "linear-gradient(135deg, #6D28D9, #7C3AED)" }}>
                  {entry.teacher.firstName[0]}{entry.teacher.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{topicName}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {teacherName} · {entry.class.name} · {subjectName}
                      </p>
                      <p className="text-xs text-[var(--text-quaternary)] mt-0.5">
                        {formatDate(entry.date)}{entry.period ? ` · P${entry.period}` : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0"><StatusBadge status={entry.status} /></div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 self-center" style={{ color: "var(--text-quaternary)" }} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <p className="text-xs text-[var(--text-tertiary)]">Page {currentPage} of {totalPages}</p>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
