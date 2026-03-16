"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

function getActiveLiveSlots(slots: TimetableSlot[]): TimetableSlot[] {
  const now = new Date();
  const dow = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return slots.filter((s) => {
    if (s.dayOfWeek !== dow) return false;
    return nowMins >= parseTimeMins(s.startTime) && nowMins < parseTimeMins(s.endTime);
  });
}

function getNextSlots(slots: TimetableSlot[]): TimetableSlot[] {
  const now = new Date();
  const dow = now.getDay();
  if (dow < 1 || dow > 5) return [];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const upcoming = slots
    .filter((s) => s.dayOfWeek === dow && parseTimeMins(s.startTime) > nowMins)
    .sort((a, b) => parseTimeMins(a.startTime) - parseTimeMins(b.startTime));
  if (upcoming.length === 0) return [];
  const nextTime = parseTimeMins(upcoming[0].startTime);
  // Return all slots starting at the same "next" time
  return upcoming.filter((s) => parseTimeMins(s.startTime) === nextTime);
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
  const liveSlots = getActiveLiveSlots(timetableSlots);
  const nextSlots = liveSlots.length === 0 ? getNextSlots(timetableSlots) : [];

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="px-5 pt-10 pb-8 rounded-b-[2rem]"
          style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}>
          <div className="max-w-lg mx-auto">
            <div className="skeleton h-4 w-24 !bg-white/10 mb-2" />
            <div className="skeleton h-7 w-44 !bg-white/15 mb-5" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 rounded-[14px] p-3 bg-white/[0.04]">
                  <div className="skeleton h-7 w-12 mx-auto !bg-white/10 mb-1" />
                  <div className="skeleton h-2 w-16 mx-auto !bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-10 w-10 rounded-xl mb-3" />
                <div className="skeleton h-4 w-20 mb-1" />
                <div className="skeleton h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center px-5">
          <p className="font-semibold text-[var(--text-secondary)]">Coordinator record not found</p>
          <Link href="/logbook" className="text-sm font-semibold mt-3 inline-block" style={{ color: "var(--accent)" }}>Go to Teacher Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── HEADER — Purple gradient for coordinator ── */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        <div className="max-w-lg mx-auto relative">
          <div data-tour="coordinator-welcome" className="flex items-start justify-between animate-fade-in">
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "rgba(196,181,253,0.8)" }}>
                {coordinator.title}
              </p>
              <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: "white", lineHeight: 1.2 }}>
                {coordinator.schoolName || "Coordinator Portal"}
              </h1>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                Managing {levelSummary} classes
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* 3 stat pods */}
          <div data-tour="coordinator-stats" className="flex mt-5 animate-slide-up animation-delay-75" style={{ gap: "8px" }}>
            {[
              { value: stats?.totalTeachers ?? teachers.length, label: "Teachers", color: "#818CF8", hint: undefined },
              { value: stats?.totalEntries ?? 0, label: "This month", color: "#F59E0B", hint: undefined },
              { value: pendingCount, label: "To Review", color: pendingCount > 0 ? "#FBBF24" : "#4ADE80", hint: "Entries waiting for your review. Tap any entry to read it, leave a remark, and verify." },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 text-center relative"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px" }}>
                {stat.hint && (
                  <HelpHint text={stat.hint} position="bottom" createdAt={userCreatedAt} className="absolute -top-1 -right-1 z-10" />
                )}
                <p className="leading-none tabular-nums"
                  style={{ fontSize: "22px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4 desktop-content">
        {/* Mode switch banner for dual-role users */}
        {hasTeachingAssignments && (
          <div data-tour="coordinator-mode-switch" className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-fade-in"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
            <p className="flex-1 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              You&apos;re in Coordinator mode
            </p>
            <button onClick={() => switchMode("teacher")}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              Teacher mode →
            </button>
          </div>
        )}

        {/* ── LIVE NOW / NEXT UP ── */}
        {(liveSlots.length > 0 || nextSlots.length > 0) && (
          <div className="animate-slide-up animation-delay-100">
            {liveSlots.length > 0 ? (
              <div className="rounded-2xl overflow-hidden border"
                style={{ background: "rgba(22,163,74,0.07)", borderColor: "rgba(22,163,74,0.25)" }}>
                {/* Section header */}
                <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(22,163,74,0.2)" }}>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    Live Now · {liveSlots.length} class{liveSlots.length !== 1 ? "es" : ""} in progress
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(22,163,74,0.15)" }}>
                  {liveSlots.map((slot) => (
                    <div key={slot.id} className="px-4 py-3.5 flex items-center gap-3">
                      {/* Avatar */}
                      {slot.teacherPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={slot.teacherPhotoUrl} alt={slot.teacher}
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                          style={{ border: "1px solid rgba(22,163,74,0.25)" }} />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black text-white"
                          style={{ background: "#16A34A" }}>
                          {slot.teacher.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}

                      {/* Sentence description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                          In{" "}
                          <span className="font-bold">{slot.className}</span>
                          {", "}
                          <span className="font-bold">{slot.teacher}</span>
                          {" is teaching "}
                          <span className="font-bold">{slot.subject}</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {slot.periodLabel} · {fmtTime(slot.startTime)}–{fmtTime(slot.endTime)} · in session
                        </p>
                      </div>

                      {/* Contact buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {slot.teacherPhone && (
                          <a href={`tel:${slot.teacherPhone}`}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(22,163,74,0.15)", color: "var(--text-primary)" }}>
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        )}
                        <a href={`mailto:${slot.teacherEmail}`}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ background: "rgba(22,163,74,0.15)", color: "var(--text-primary)" }}>
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : nextSlots.length > 0 ? (
              <div className="rounded-2xl overflow-hidden border"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)" }}>
                <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                    Next Up · {fmtTime(nextSlots[0].startTime)}
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  {nextSlots.map((slot) => (
                    <div key={slot.id} className="px-4 py-3">
                      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                        In{" "}
                        <span className="font-bold">{slot.className}</span>
                        {", "}
                        <span className="font-bold">{slot.teacher}</span>
                        {" will be teaching "}
                        <span className="font-bold">{slot.subject}</span>
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {slot.periodLabel} · starts {fmtTime(slot.startTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── QUICK ACTIONS — 2×2 gradient grid ── */}
        <div className="animate-slide-up animation-delay-150">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 desktop-actions-row" style={{ gap: "8px" }}>
            {[
              {
                href: "/coordinator/entries",
                icon: CheckCircle2,
                label: "Verify Entries",
                count: `${pendingCount} pending`,
                gradient: "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(109,40,217,0.16))",
                iconColor: "#7C3AED",
              },
              {
                href: "/coordinator/timetable",
                icon: Calendar,
                label: "Timetable",
                count: "View schedule",
                gradient: "linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.15))",
                iconColor: "#16A34A",
              },
              {
                href: "/coordinator/reports",
                icon: BarChart3,
                label: "Reports",
                count: "Entries database",
                gradient: "linear-gradient(135deg, rgba(217,119,6,0.08), rgba(217,119,6,0.16))",
                iconColor: "#D97706",
              },
              {
                href: "/coordinator/teachers",
                icon: Users,
                label: "Teachers",
                count: `${stats?.totalTeachers ?? teachers.length} at your level`,
                gradient: "linear-gradient(135deg, rgba(225,29,72,0.06), rgba(225,29,72,0.13))",
                iconColor: "#E11D48",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}
                  className="p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{ background: action.gradient, borderRadius: "16px" }}>
                  <div className="mb-2.5" style={{ color: action.iconColor }}>
                    <Icon style={{ width: "18px", height: "18px" }} />
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{action.label}</p>
                  <p className="mt-0.5" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{action.count}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── SEND ANNOUNCEMENT ── */}
        <Link href="/coordinator/announcements"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{ background: "linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.12))", border: "1px solid rgba(217,119,6,0.25)", borderRadius: "16px" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Send Announcement</span>
              <span className="block" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Broadcast to {levelSummary} teachers
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── TEACHER ACTIVITY ── */}
        {topTeachers.length > 0 && (
          <div className="animate-slide-up animation-delay-225 border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Teacher Activity
              </h3>
              <Link href="/coordinator/teachers" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
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
          </div>
        )}

        {/* ── PENDING VERIFICATION ── */}
        {pendingEntries.length > 0 && (
          <div data-tour="coordinator-pending" className="animate-slide-up animation-delay-300 border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Pending Verification
              </h3>
              {pendingCount > 5 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(217,119,6,0.12)", color: "var(--text-secondary)" }}>
                  {pendingCount} total
                </span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
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
                        <p className={`text-sm truncate group-hover:underline ${!isSeen ? "font-bold text-[var(--text-primary)]" : "font-semibold text-[var(--text-secondary)]"}`}>
                          {teacherName}
                        </p>
                        {isSeen && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "rgba(109,40,217,0.12)", color: "var(--accent)" }}>
                            <Eye className="w-2.5 h-2.5" />
                            {seenByTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                        {subjectName} · {entry.class.name} · {timeAgo(entry.createdAt)}
                      </p>
                    </Link>
                    <button onClick={() => handleVerify(entry.id)} disabled={!!verifying}
                      className="flex items-center justify-center flex-shrink-0 ml-3 transition-all active:scale-90 disabled:opacity-50"
                      style={{ width: "36px", height: "36px", borderRadius: "12px", background: "rgba(22,163,74,0.15)", color: "#16A34A" }}
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
              className="block text-center text-xs font-semibold mt-3 pt-3"
              style={{ color: "var(--accent)", borderTop: "1px solid var(--border-secondary)" }}>
              View all pending →
            </Link>
          </div>
        )}

        {/* ── ALL CAUGHT UP ── */}
        {pendingEntries.length === 0 && !loading && (
          <div className="card p-6 text-center animate-slide-up">
            <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--accent)" }} />
            <p className="font-bold text-[var(--text-primary)] text-sm">All caught up!</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">No entries pending review at {levelSummary}</p>
            <Link href="/coordinator/reports"
              className="inline-block mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all active:scale-95"
              style={{ background: "var(--accent)" }}>
              Browse all entries
            </Link>
          </div>
        )}
      </div>
      <OnboardingTour steps={COORDINATOR_TOUR} tourKey="coordinator" />
    </div>
  );
}
