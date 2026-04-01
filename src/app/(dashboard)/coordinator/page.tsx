"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  ChevronRight,
  Calendar,
  BarChart3,
  CheckCircle2,
  Check,
  Megaphone,
  ClipboardList,
  Loader2,
  Phone,
  Mail,
  Clock,
  Eye,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TeacherActivityRow } from "@/components/TeacherActivityRow";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HelpHint } from "@/components/HelpHint";
import { COORDINATOR_TOUR } from "@/lib/tour-steps";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";

interface CoordinatorInfo {
  id: string;
  title: string;
  levels: string[];
  canVerify: boolean;
  canRemark: boolean;
  schoolName: string;
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

function parseTimeMins(t: string): number {
  const parts = t.includes("T") ? t.split("T")[1].split(":") : t.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function fmtTime(t: string): string {
  const parts = t.includes("T") ? t.split("T")[1].split(":") : t.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

type SlotStatus = "live" | "upcoming" | "done";

function getSlotStatus(slot: TimetableSlot): SlotStatus {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeMins(slot.startTime);
  const end = parseTimeMins(slot.endTime);
  if (nowMins >= start && nowMins < end) return "live";
  if (nowMins < start) return "upcoming";
  return "done";
}

function getTodaySlots(slots: TimetableSlot[]): TimetableSlot[] {
  const dow = new Date().getDay();
  if (dow < 1 || dow > 5) return [];
  return slots
    .filter((s) => s.dayOfWeek === dow)
    .sort((a, b) => parseTimeMins(a.startTime) - parseTimeMins(b.startTime));
}

interface Stats {
  totalTeachers: number;
  totalEntries: number;
  pendingVerification: number;
  verifiedCount: number;
}

interface PendingEntry {
  id: string;
  date: string;
  period: number | null;
  status: string;
  teacher: { id: string; firstName: string; lastName: string };
  class: { id: string; name: string; level: string };
  topics: { id: string; name: string; subject: { id: string; name: string } }[];
  assignment?: { subject: { id: string; name: string } } | null;
  createdAt: string;
  views?: { viewerRole: string; viewerTitle: string | null }[];
}

interface TeacherRow {
  id: string;
  firstName: string;
  lastName: string;
  entryCountThisMonth: number;
  subjects: { id: string; name: string }[];
}

export default function CoordinatorDashboardPage() {
  const { hasTeachingAssignments, switchMode } = useCoordinatorMode();
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      // Load coordinator info + entries in parallel; dashboard is optional
      const [dashRes, entriesRes, teachersRes, ttRes] = await Promise.allSettled([
        fetch("/api/coordinator/dashboard"),
        fetch("/api/coordinator/entries?status=SUBMITTED&limit=5"),
        fetch("/api/coordinator/teachers"),
        fetch("/api/coordinator/timetable"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.ok) {
        const d = await dashRes.value.json();
        setCoordinator(d.coordinator);
        setStats(d.stats);
      } else {
        // Fallback to lighter check endpoint
        const checkRes = await fetch("/api/coordinator/check");
        if (checkRes.ok) {
          const c = await checkRes.json();
          setCoordinator({
            id: "", title: c.title || "Level Coordinator",
            levels: c.levels || [], canVerify: true, canRemark: true, schoolName: "",
          });
        }
      }

      if (entriesRes.status === "fulfilled" && entriesRes.value.ok) {
        const d = await entriesRes.value.json();
        setPendingEntries(d.entries || []);
      }

      if (teachersRes.status === "fulfilled" && teachersRes.value.ok) {
        const d = await teachersRes.value.json();
        setTeachers(Array.isArray(d.teachers) ? d.teachers : []);
      }

      if (ttRes.status === "fulfilled" && ttRes.value.ok) {
        const d = await ttRes.value.json();
        setTimetableSlots(d.slots || []);
      }

      setLoading(false);

      // Fetch createdAt for HelpHints
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          if (s?.user?.createdAt) setUserCreatedAt(s.user.createdAt as string);
        }
      } catch { /* silently fail */ }
    }
    fetchData();
  }, []);

  async function handleVerify(entryId: string) {
    setVerifying(entryId);
    try {
      const res = await fetch("/api/coordinator/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, status: "VERIFIED", verifierName: coordinator?.title || "Coordinator", verifierTitle: coordinator?.title }),
      });
      if (res.ok) {
        setPendingEntries((prev) => prev.filter((e) => e.id !== entryId));
        setStats((prev) => prev ? { ...prev, pendingVerification: Math.max(0, prev.pendingVerification - 1), verifiedCount: prev.verifiedCount + 1 } : prev);
      }
    } catch { /* silently fail */ }
    finally { setVerifying(null); }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const topTeachers = [...teachers]
    .sort((a, b) => {
      const aExp = Math.max(a.subjects.length * 5, 5);
      const bExp = Math.max(b.subjects.length * 5, 5);
      return (a.entryCountThisMonth / aExp) - (b.entryCountThisMonth / bExp);
    })
    .slice(0, 6);

  const levelSummary = coordinator?.levels?.join(", ") || "";
  const pendingCount = stats?.pendingVerification ?? 0;
  const todaySlots = getTodaySlots(timetableSlots);
  const liveCount = todaySlots.filter((s) => getSlotStatus(s) === "live").length;

  if (loading) {
    return (
      <div className="page-shell space-y-4 pt-4 lg:space-y-5">
        <section className="section-card">
          <div className="skeleton h-4 w-24 mb-2" />
          <div className="skeleton h-7 w-44 mb-5" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3">
                <div className="skeleton h-7 w-12 mx-auto mb-1" />
                <div className="skeleton h-2 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-10 w-10 rounded-xl mb-3" />
              <div className="skeleton h-4 w-20 mb-1" />
              <div className="skeleton h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-semibold text-content-secondary">Coordinator record not found</p>
          <Link href="/logbook" className="text-sm font-semibold mt-3 inline-block text-[hsl(var(--accent))]">Go to Teacher Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-4 pt-4 lg:space-y-5">
      {/* ── HEADER — section-card with stats ── */}
      <section className="section-card" data-tour="coordinator-welcome">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="role-dot role-dot-coordinator" />
              <p className="text-xs font-medium text-content-tertiary">{coordinator.title}</p>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              {coordinator.schoolName || "Coordinator Portal"}
            </h1>
            <p className="text-xs text-content-tertiary mt-0.5">
              Managing {levelSummary} classes
            </p>
          </div>
          <NotificationBell />
        </div>

        {/* 3 stat pods */}
        <div data-tour="coordinator-stats" className="mt-4 flex gap-2">
          {[
            { value: stats?.totalTeachers ?? teachers.length, label: "Teachers", hint: undefined },
            { value: stats?.totalEntries ?? 0, label: "This month", hint: undefined },
            { value: pendingCount, label: "To Review", hint: "Entries waiting for your review. Tap any entry to read it, leave a remark, and verify." },
          ].map((stat) => (
            <div key={stat.label} className="relative flex-1 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-secondary))] p-3 text-center">
              {stat.hint && (
                <HelpHint text={stat.hint} position="bottom" createdAt={userCreatedAt} className="absolute -top-1 -right-1 z-10" />
              )}
              <p className="text-xl font-bold tabular-nums text-content-primary">{stat.value}</p>
              <p className="mt-1 text-[10px] font-medium text-content-tertiary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mode switch banner for dual-role users */}
      {hasTeachingAssignments && (
        <div data-tour="coordinator-mode-switch" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-elevated))] animate-fade-in">
          <p className="flex-1 text-xs font-medium text-content-tertiary">
            You&apos;re in Coordinator mode
          </p>
          <button onClick={() => switchMode("teacher")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-tertiary))] text-content-secondary transition-all active:scale-95">
            Teacher mode →
          </button>
        </div>
      )}

      {/* ── QUICK ACTIONS — grid ── */}
      <div className="animate-slide-up animation-delay-150">
        <h3 className="text-xs font-bold uppercase tracking-widest text-content-tertiary mb-3 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            {
              href: "/coordinator/entries",
              icon: CheckCircle2,
              label: "Verify Entries",
              count: `${pendingCount} pending`,
              gradient: "linear-gradient(135deg, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.16))",
              iconColor: "hsl(var(--accent))",
            },
            {
              href: "/coordinator/timetable",
              icon: Calendar,
              label: "Timetable",
              count: "View schedule",
              gradient: "linear-gradient(135deg, hsl(var(--success) / 0.08), hsl(var(--success) / 0.15))",
              iconColor: "hsl(var(--success))",
            },
            {
              href: "/coordinator/reports",
              icon: BarChart3,
              label: "Reports",
              count: "Entries database",
              gradient: "linear-gradient(135deg, hsl(var(--warning) / 0.08), hsl(var(--warning) / 0.16))",
              iconColor: "hsl(var(--accent-strong))",
            },
            {
              href: "/coordinator/teachers",
              icon: Users,
              label: "Teachers",
              count: `${stats?.totalTeachers ?? teachers.length} at your level`,
              gradient: "linear-gradient(135deg, hsl(var(--danger) / 0.06), hsl(var(--danger) / 0.13))",
              iconColor: "hsl(var(--danger))",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}
                className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ background: action.gradient }}>
                <div className="mb-2.5" style={{ color: action.iconColor }}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <p className="text-sm font-bold text-content-primary">{action.label}</p>
                <p className="mt-0.5 text-xs text-content-secondary">{action.count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── SEND ANNOUNCEMENT ── */}
      <Link href="/coordinator/announcements"
        className="animate-slide-up animation-delay-175 flex items-center justify-between rounded-xl border border-[hsl(var(--warning)/0.25)] p-4 group active:scale-[0.98] transition-all duration-200"
        style={{ background: "linear-gradient(135deg, hsl(var(--warning) / 0.06), hsl(var(--warning) / 0.12))" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[hsl(var(--accent-strong))]" />
          </div>
          <div>
            <span className="text-sm font-bold text-content-primary">Send Announcement</span>
            <span className="block text-xs text-content-secondary">
              Broadcast to {levelSummary} teachers
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--accent-glow))] group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ── Two-column layout for schedule + pending ── */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">
        {/* ── TODAY'S SCHEDULE ── */}
        {todaySlots.length > 0 && (
          <section className={`section-card !p-0 animate-slide-up animation-delay-100 overflow-hidden ${liveCount > 0 ? "border-[hsl(var(--success)/0.35)]" : ""}`}>
            {/* Header */}
            <div className={`px-4 pt-3.5 pb-2.5 flex items-center gap-2 border-b ${liveCount > 0 ? "border-[hsl(var(--success)/0.2)]" : "border-[hsl(var(--border-muted))]"}`}>
              {liveCount > 0
                ? <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse flex-shrink-0" />
                : <Clock className="w-3.5 h-3.5 flex-shrink-0 text-content-tertiary" />}
              <p className="text-xs font-bold uppercase tracking-widest flex-1 text-content-tertiary">
                {levelSummary} — Today&apos;s Classes
              </p>
              {liveCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]">
                  {liveCount} in session
                </span>
              )}
            </div>

            {/* Slot rows */}
            <div className="divide-y divide-[hsl(var(--border-muted))]">
              {todaySlots.map((slot) => {
                const status = getSlotStatus(slot);
                const isLive = status === "live";
                const isDone = status === "done";
                return (
                  <div key={slot.id}
                    className={`px-4 py-3 flex items-center gap-3 ${isDone ? "opacity-50" : ""}`}>
                    {/* Avatar */}
                    {slot.teacherPhotoUrl ? (
                      <Image src={slot.teacherPhotoUrl} alt={slot.teacher}
                        width={32} height={32}
                        className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-black ${isLive ? "bg-[hsl(var(--success))] text-white" : isDone ? "bg-[hsl(var(--surface-tertiary))] text-content-tertiary" : "bg-[hsl(var(--accent))] text-white"}`}>
                        <span>
                          {slot.teacher.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug text-content-primary">
                        In{" "}
                        <span className="font-bold">{slot.className}</span>
                        {", "}
                        <span className="font-bold">{slot.teacher}</span>
                        {isLive ? " is teaching " : isDone ? " taught " : " will be teaching "}
                        <span className="font-bold">{slot.subject}</span>
                      </p>
                      <p className="text-xs mt-0.5 text-content-secondary">
                        {slot.periodLabel} · {fmtTime(slot.startTime)}–{fmtTime(slot.endTime)}
                        {isLive && <span className="ml-1.5 font-semibold text-[hsl(var(--success))]">· in session</span>}
                        {!isLive && !isDone && <span className="ml-1.5 text-content-tertiary">· upcoming</span>}
                      </p>
                    </div>

                    {/* Contact — only for live slots */}
                    {isLive && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {slot.teacherPhone && (
                          <a href={`tel:${slot.teacherPhone}`}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-[hsl(var(--success)/0.15)] text-content-primary">
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        )}
                        <a href={`mailto:${slot.teacherEmail}`}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-[hsl(var(--success)/0.15)] text-content-primary">
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── PENDING VERIFICATION ── */}
        {pendingEntries.length > 0 && (
          <section data-tour="coordinator-pending" className="section-card animate-slide-up animation-delay-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-content-primary">
                Pending Verification
              </h3>
              {pendingCount > 5 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--warning)/0.12)] text-content-secondary">
                  {pendingCount} total
                </span>
              )}
            </div>
            <div className="divide-y divide-[hsl(var(--border-muted))]">
              {pendingEntries.map((entry) => {
                const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
                const subjectName = entry.assignment?.subject?.name || entry.topics?.[0]?.subject?.name || "Unknown";
                const isVerifying = verifying === entry.id;
                const isSeen = entry.views && entry.views.length > 0;
                const seenByTitle = isSeen ? (entry.views![0].viewerTitle || "VP") : null;
                return (
                  <div key={entry.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    style={!isSeen ? { borderLeft: "3px solid var(--accent)", paddingLeft: "10px", marginLeft: "-2px" } : {}}>
                    <Link href={`/coordinator/entries/${entry.id}`} className="min-w-0 flex-1 group">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm truncate group-hover:underline ${!isSeen ? "font-bold text-content-primary" : "font-semibold text-content-secondary"}`}>
                          {teacherName}
                        </p>
                        {isSeen && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]">
                            <Eye className="w-2.5 h-2.5" />
                            {seenByTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-tertiary mt-0.5 truncate">
                        {subjectName} · {entry.class.name} · {timeAgo(entry.createdAt)}
                      </p>
                    </Link>
                    <button onClick={() => handleVerify(entry.id)} disabled={!!verifying}
                      className="flex items-center justify-center flex-shrink-0 ml-3 w-9 h-9 rounded-xl bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] transition-all active:scale-90 disabled:opacity-50"
                      aria-label="Quick verify">
                      {isVerifying
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <Link href="/coordinator/entries"
              className="block text-center text-xs font-semibold mt-3 pt-3 text-[hsl(var(--accent))] border-t border-[hsl(var(--border-muted))]">
              View all pending →
            </Link>
          </section>
        )}

        {/* ── ALL CAUGHT UP ── */}
        {pendingEntries.length === 0 && !loading && (
          <section className="section-card text-center animate-slide-up">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--accent))]" />
            <p className="font-bold text-content-primary text-sm">All caught up!</p>
            <p className="text-xs text-content-tertiary mt-1">No entries pending review at {levelSummary}</p>
            <Link href="/coordinator/reports"
              className="inline-block mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white bg-[hsl(var(--accent))] transition-all active:scale-95">
              Browse all entries
            </Link>
          </section>
        )}
      </div>

      {/* ── TEACHER ACTIVITY ── */}
      {topTeachers.length > 0 && (
        <section className="section-card animate-slide-up animation-delay-225">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-content-primary">
              Teacher Activity
            </h3>
            <Link href="/coordinator/teachers" className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {topTeachers.map((t) => {
              const expectedPerWeek = Math.max(t.subjects.length * 5, 5);
              return (
                <TeacherActivityRow
                  key={t.id}
                  name={`${t.firstName} ${t.lastName}`}
                  initials={`${t.firstName[0]}${t.lastName[0]}`}
                  entriesLogged={t.entryCountThisMonth}
                  entriesExpected={expectedPerWeek}
                />
              );
            })}
          </div>
        </section>
      )}

      <OnboardingTour steps={COORDINATOR_TOUR} tourKey="coordinator" />
    </div>
  );
}
