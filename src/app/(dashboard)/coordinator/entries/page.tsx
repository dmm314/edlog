"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  Flag,
  Clock,
  FileText,
  ChevronLeft,
  X,
  Calendar,
  Phone,
  Mail,
  Eye,
  AlignJustify,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Entry {
  id: string;
  date: string;
  period: number | null;
  status: string;
  teacher: { id: string; firstName: string; lastName: string; email: string; phone?: string | null; photoUrl?: string | null };
  class: { id: string; name: string; level: string };
  topics: { id: string; name: string; subject: { id: string; name: string } }[];
  assignment?: { subject: { id: string; name: string } } | null;
  remarks: { id: string; content: string }[];
  views?: { viewerRole: string; viewerTitle: string | null }[];
}

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  teacher: string;
  teacherId: string;
  teacherEmail: string;
  teacherPhone: string | null;
  teacherPhotoUrl?: string | null;
  className: string;
  classId: string;
  level: string;
  subject: string;
}

function TeacherAvatar({ photoUrl, firstName, lastName, size = "sm" }: { photoUrl?: string | null; firstName: string; lastName: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-9 h-9" : "w-6 h-6";
  const textSize = size === "md" ? "text-xs" : "text-[9px]";
  const radius = size === "md" ? "rounded-xl" : "rounded-lg";
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt={`${firstName} ${lastName}`}
        className={`${dim} ${radius} object-cover flex-shrink-0`}
        style={{ border: "1px solid var(--border-secondary)" }} />
    );
  }
  return (
    <div className={`${dim} ${radius} flex items-center justify-center flex-shrink-0 font-black text-white ${textSize}`}
      style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}>
      {firstName[0]}{lastName[0]}
    </div>
  );
}

interface FilterOption { value: string; label: string }
interface Filters {
  teachers: FilterOption[];
  classes: FilterOption[];
  statuses: FilterOption[];
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PAGE_SIZE = 20;

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function StatusBadge({ status, views }: { status: string; views?: { viewerRole: string }[] }) {
  const isSeen = (views?.length ?? 0) > 0;
  if (status === "VERIFIED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))" }}>
        <CheckCircle className="w-2.5 h-2.5" /> Verified
      </span>
    );
  }
  if (status === "FLAGGED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--danger) / 0.1)", color: "hsl(var(--danger))" }}>
        <Flag className="w-2.5 h-2.5" /> Flagged
      </span>
    );
  }
  if (status === "SUBMITTED" && isSeen) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
        <Eye className="w-2.5 h-2.5" /> Reviewed
      </span>
    );
  }
  if (status === "SUBMITTED") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
        <Clock className="w-2.5 h-2.5" /> Pending
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-tertiary)" }}>
      {status}
    </span>
  );
}

export default function CoordinatorEntriesPage() {
  const [viewMode, setViewMode] = useState<"list" | "timetable">("list");

  // ── List view state ──
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

  // ── Timetable view state ──
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [weekEntries, setWeekEntries] = useState<Entry[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : 1;
  });
  const [ttLoading, setTtLoading] = useState(false);

  // ── List fetch ──
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

  useEffect(() => {
    if (viewMode === "list") fetchEntries();
  }, [fetchEntries, viewMode]);

  // ── Timetable fetch ──
  useEffect(() => {
    if (viewMode !== "timetable") return;
    async function fetchTT() {
      setTtLoading(true);
      try {
        const friday = new Date(weekStart);
        friday.setDate(friday.getDate() + 4);
        const [ttRes, eRes] = await Promise.all([
          fetch("/api/coordinator/timetable"),
          fetch(`/api/coordinator/entries?limit=200&filter[dateFrom]=${toDateStr(weekStart)}&filter[dateTo]=${toDateStr(friday)}`),
        ]);
        if (ttRes.ok) setTimetableSlots((await ttRes.json()).slots || []);
        if (eRes.ok) setWeekEntries((await eRes.json()).entries || []);
      } finally {
        setTtLoading(false);
      }
    }
    fetchTT();
  }, [viewMode, weekStart]);

  function handleSearch() { setSearch(searchInput); setOffset(0); }
  function clearFilters() { setFilterTeacher(""); setFilterClass(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); setOffset(0); }

  const hasActiveFilters = filterTeacher || filterClass || filterStatus || filterFrom || filterTo;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  // Timetable helpers
  const today = new Date();
  const todayStr = toDateStr(today);
  const isCurrentWeek = toDateStr(weekStart) === toDateStr(getMonday(today));
  const selectedDayDate = new Date(weekStart);
  selectedDayDate.setDate(weekStart.getDate() + (selectedDay - 1));
  const selectedDateStr = toDateStr(selectedDayDate);
  const daySlots = timetableSlots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function getEntryForSlot(slot: TimetableSlot): Entry | null {
    const periodMatch = slot.periodLabel.match(/\d+/);
    const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
    return weekEntries.find((e) => {
      if (new Date(e.date).toISOString().split("T")[0] !== selectedDateStr) return false;
      if (periodNum !== null && e.period === periodNum) return true;
      return false;
    }) ?? null;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-canvas))" }}>
      {/* ── Header ── */}
      <div className="px-5 pt-10 pb-6 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="page-shell relative">
          <Link href="/coordinator" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Entry Database</h1>
          <p className="text-white/70 text-sm mt-0.5">Browse, filter and verify entries</p>
          {viewMode === "list" && total > 0 && (
            <p className="text-white/70 text-xs mt-1">{total} entries found</p>
          )}
          {/* View mode toggle */}
          <div className="flex mt-3 gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.1)", width: "fit-content" }}>
            <button onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: viewMode === "list" ? "rgba(255,255,255,0.25)" : "transparent", color: viewMode === "list" ? "white" : "rgba(255,255,255,0.7)" }}>
              <AlignJustify className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode("timetable")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: viewMode === "timetable" ? "rgba(255,255,255,0.25)" : "transparent", color: viewMode === "timetable" ? "white" : "rgba(255,255,255,0.7)" }}>
              <Calendar className="w-3.5 h-3.5" /> Timetable
            </button>
          </div>
        </div>
      </div>

      <div className="page-shell px-5 mt-4 space-y-3">

        {/* ════════════════════ LIST VIEW ════════════════════ */}
        {viewMode === "list" && (
          <>
            {/* Search + filter bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                <input type="text" value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search topics, teacher, class..."
                  className="input-field pl-9 pr-4" />
              </div>
              <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95" style={{ background: "hsl(var(--accent))" }}>
                Search
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className="relative px-3 py-2.5 rounded-xl active:scale-95 transition-all"
                style={{ background: showFilters || hasActiveFilters ? "hsl(var(--accent-soft))" : "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)", color: hasActiveFilters ? "hsl(var(--accent-text))" : "var(--text-secondary)" }}>
                <Filter className="w-4 h-4" />
                {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-white flex items-center justify-center" style={{ background: "hsl(var(--accent))", fontSize: "8px" }}>●</span>}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && filters && (
              <div className="card p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[var(--text-primary)]">Filters</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--accent))" }}>
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

            {/* Entry cards */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
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
                  <button onClick={() => { setSearch(""); setSearchInput(""); clearFilters(); }} className="mt-3 text-sm font-semibold" style={{ color: "hsl(var(--accent))" }}>
                    Clear search & filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const topicName = entry.topics?.[0]?.name || "No topic";
                  const subjectName = entry.topics?.[0]?.subject?.name || entry.assignment?.subject?.name || "—";
                  const isSeen = (entry.views?.length ?? 0) > 0;
                  const isUnseen = entry.status === "SUBMITTED" && !isSeen;
                  return (
                    <Link key={entry.id} href={`/coordinator/entries/${entry.id}`}
                      className="card block active:scale-[0.98] transition-transform"
                      style={{ borderLeft: isUnseen ? "3px solid hsl(var(--accent))" : entry.status === "VERIFIED" ? "3px solid hsl(var(--success))" : entry.status === "FLAGGED" ? "3px solid hsl(var(--danger))" : "3px solid var(--border-secondary)" }}>
                      <div className="p-4">
                        {/* Topic + status */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm truncate ${isUnseen ? "font-bold" : "font-semibold"} text-[var(--text-primary)]`}>
                              {topicName}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {entry.class.name} · {subjectName} · {formatDate(entry.date)}{entry.period ? ` · P${entry.period}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={entry.status} views={entry.views} />
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
                          </div>
                        </div>
                        {/* Teacher row */}
                        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <TeacherAvatar photoUrl={entry.teacher.photoUrl} firstName={entry.teacher.firstName} lastName={entry.teacher.lastName} />
                            <p className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                              {entry.teacher.firstName} {entry.teacher.lastName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {entry.teacher.phone && (
                              <a href={`tel:${entry.teacher.phone}`} onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg active:scale-95"
                                style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
                                <Phone className="w-2.5 h-2.5" /> Call
                              </a>
                            )}
                            <Link
                              href={`/coordinator/announcements?teacherId=${entry.teacher.id}&teacherName=${encodeURIComponent(`${entry.teacher.firstName} ${entry.teacher.lastName}`)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg active:scale-95"
                              style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
                              <Mail className="w-2.5 h-2.5" /> Mail
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-2">
                <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-40"
                  style={{ background: "hsl(var(--surface-elevated))", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <p className="text-xs text-[var(--text-tertiary)]">Page {currentPage} of {totalPages}</p>
                <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-40"
                  style={{ background: "hsl(var(--surface-elevated))", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ════════════════════ TIMETABLE VIEW ════════════════════ */}
        {viewMode === "timetable" && (
          <>
            {/* Week navigator */}
            <div className="flex items-center justify-between">
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
                className="p-2.5 rounded-xl active:scale-90 transition-all"
                style={{ background: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}>
                <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {fmtShort(weekStart)} — {fmtShort(new Date(weekStart.getTime() + 4 * 86400000))}
                </p>
                {isCurrentWeek && <p className="text-[10px] text-[var(--text-tertiary)]">This week</p>}
              </div>
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
                className="p-2.5 rounded-xl active:scale-90 transition-all"
                style={{ background: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Day pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[1, 2, 3, 4, 5].map((dow) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + (dow - 1));
                const dayDateStr = toDateStr(dayDate);
                const isToday = dayDateStr === todayStr;
                const slotCount = timetableSlots.filter((s) => s.dayOfWeek === dow).length;
                const entryCount = weekEntries.filter((e) => new Date(e.date).toISOString().split("T")[0] === dayDateStr).length;
                const allFilled = slotCount > 0 && entryCount >= slotCount;
                const someFilled = entryCount > 0 && !allFilled;
                return (
                  <button key={dow} onClick={() => setSelectedDay(dow)}
                    className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl transition-all"
                    style={{
                      background: selectedDay === dow ? "hsl(var(--accent))" : "hsl(var(--surface-elevated))",
                      border: `1px solid ${selectedDay === dow ? "hsl(var(--accent))" : isToday ? "hsl(var(--accent) / 0.6)" : "var(--border-primary)"}`,
                      minWidth: "60px",
                    }}>
                    <span className="text-[10px] font-bold" style={{ color: selectedDay === dow ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
                      {DAY_NAMES[dow - 1]}
                    </span>
                    <span className="text-lg font-black leading-tight" style={{ color: selectedDay === dow ? "white" : "var(--text-primary)" }}>
                      {dayDate.getDate()}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ background: allFilled ? "hsl(var(--success) / 0.7)" : someFilled ? "hsl(var(--accent-glow))" : "transparent" }} />
                  </button>
                );
              })}
            </div>

            {/* Day label */}
            <p className="text-xs font-bold text-[var(--text-secondary)] px-1">
              {DAY_FULL[selectedDay - 1]} · {selectedDayDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Slot list */}
            {ttLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="skeleton h-4 w-20 mb-2" />
                    <div className="skeleton h-3 w-40" />
                  </div>
                ))}
              </div>
            ) : daySlots.length === 0 ? (
              <div className="card p-8 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-quaternary)" }} />
                <p className="text-sm font-bold text-[var(--text-secondary)]">No classes scheduled</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{DAY_FULL[selectedDay - 1]} is free</p>
              </div>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot) => {
                  const entry = getEntryForSlot(slot);
                  const isSeen = entry ? (entry.views?.length ?? 0) > 0 : false;
                  const now = new Date();
                  const [eh, em] = slot.endTime.split(":").map(Number);
                  const slotEndMins = eh * 60 + em;
                  const nowMins = now.getHours() * 60 + now.getMinutes();
                  const isPast = selectedDateStr < todayStr || (selectedDateStr === todayStr && nowMins > slotEndMins);

                  const leftBorder = !entry
                    ? (isPast ? "hsl(var(--danger))" : "var(--border-primary)")
                    : entry.status === "VERIFIED" ? "hsl(var(--success))"
                    : entry.status === "FLAGGED" ? "hsl(var(--danger))"
                    : isSeen ? "hsl(var(--accent))"
                    : "hsl(var(--accent))";

                  const slotCard = (
                    <div className="card p-4" style={{ borderLeft: `3px solid ${leftBorder}` }}>
                      <div className="flex items-start gap-3">
                        {/* Time column */}
                        <div className="flex-shrink-0 text-center" style={{ minWidth: "44px" }}>
                          <p className="text-[10px] font-bold text-[var(--text-tertiary)]">{slot.periodLabel}</p>
                          <p className="text-[10px] text-[var(--text-quaternary)] font-mono mt-0.5">{slot.startTime}</p>
                          <p className="text-[10px] text-[var(--text-quaternary)] font-mono">{slot.endTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Topic/subject + status */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                {entry ? (entry.topics?.[0]?.name || slot.subject) : slot.subject}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{slot.className}</p>
                            </div>
                            {entry ? (
                              <StatusBadge status={entry.status} views={entry.views} />
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: isPast ? "hsl(var(--danger) / 0.1)" : "hsl(var(--surface-tertiary))", color: isPast ? "hsl(var(--danger))" : "var(--text-quaternary)" }}>
                                {isPast ? "No entry" : "Upcoming"}
                              </span>
                            )}
                          </div>
                          {/* Teacher contact */}
                          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <TeacherAvatar photoUrl={slot.teacherPhotoUrl} firstName={slot.teacher.split(" ")[0] || "?"} lastName={slot.teacher.split(" ").slice(1).join(" ") || "?"} />
                              <p className="text-xs text-[var(--text-secondary)] truncate">{slot.teacher}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {slot.teacherPhone && (
                                <a href={`tel:${slot.teacherPhone}`}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.location.href = `tel:${slot.teacherPhone!}`; }}
                                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                                  style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
                                  <Phone className="w-2.5 h-2.5" /> Call
                                </a>
                              )}
                              <Link
                                href={`/coordinator/announcements?teacherId=${slot.teacherId}&teacherName=${encodeURIComponent(slot.teacher)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                                style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
                                <Mail className="w-2.5 h-2.5" /> Mail
                              </Link>
                            </div>
                          </div>
                        </div>
                        {entry && <ChevronRight className="w-4 h-4 flex-shrink-0 self-center" style={{ color: "var(--text-quaternary)" }} />}
                      </div>
                    </div>
                  );

                  return entry ? (
                    <Link key={slot.id} href={`/coordinator/entries/${entry.id}`} className="block active:scale-[0.98] transition-transform">
                      {slotCard}
                    </Link>
                  ) : (
                    <div key={slot.id}>{slotCard}</div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
