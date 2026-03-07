"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Calendar,
  GraduationCap,
  UserCheck,
  FileText,
  BarChart3,
  CheckCircle2,
  Shield,
  Check,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TeacherActivityRow } from "@/components/TeacherActivityRow";
import type { AdminStats, TeacherWithStats } from "@/types";

// Deterministic avatar colors from teacher name
function getAvatarColor(name: string): string {
  const colors = [
    "#818CF8", "#F59E0B", "#10B981", "#F472B6",
    "#06B6D4", "#8B5CF6", "#EC4899", "#14B8A6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface SchoolInfo {
  name: string;
  code: string;
  status: string;
  region: string;
}

interface PendingEntry {
  id: string;
  teacher: { firstName: string; lastName: string };
  topics: { subject?: { name: string } }[];
  class: { name: string };
  assignment?: { subject: { name: string } } | null;
  createdAt: string;
  date: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, schoolRes, teachersRes, entriesRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/school"),
          fetch("/api/admin/teachers"),
          fetch("/api/admin/entries?status=SUBMITTED&limit=5"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        } else {
          setError("Failed to load stats");
        }

        if (schoolRes.ok) {
          setSchool(await schoolRes.json());
        }

        if (teachersRes.ok) {
          const t = await teachersRes.json();
          setTeachers(Array.isArray(t) ? t : []);
        }

        if (entriesRes.ok) {
          const data = await entriesRes.json();
          setPendingEntries(data.entries || []);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  async function handleVerify(entryId: string) {
    setVerifying(entryId);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VERIFIED" }),
      });
      if (res.ok) {
        setPendingEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch {
      // silently fail
    } finally {
      setVerifying(null);
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Sort teachers by entries, top performers first
  const topTeachers = teachers
    .filter((t) => t.membershipStatus === "ACTIVE")
    .sort((a, b) => b.entryCount - a.entryCount)
    .slice(0, 5);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Admin header skeleton — uses cool slate gradient */}
        <div className="px-5 pt-10 pb-8 rounded-b-[2rem]" style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
        }}>
          <div className="max-w-lg mx-auto relative">
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
          <div className="card p-5">
            <div className="skeleton h-4 w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-24 mb-2" />
                  <div className="skeleton h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const complianceRate = stats?.complianceRate ?? 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── HEADER — Cool slate gradient for admin ── */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[2rem] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
        }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="max-w-lg mx-auto relative">
          {/* Top row: label + notification */}
          <div className="flex items-start justify-between animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  School Admin
                </p>
                {school && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    school.status === "ACTIVE"
                      ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/10 border border-amber-500/15 text-amber-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      school.status === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400"
                    }`} />
                    {school.status === "ACTIVE" ? "Active" : school.status}
                  </span>
                )}
              </div>
              <h1 className="font-display text-[22px] font-bold text-slate-50 tracking-tight">
                {school?.name || "Admin Dashboard"}
              </h1>
            </div>
            <NotificationBell />
          </div>

          {/* 3 stat pods */}
          <div className="flex gap-2.5 mt-5 animate-slide-up animation-delay-75">
            {[
              { value: stats?.totalTeachers ?? 0, label: "Teachers", color: "#818CF8" },
              { value: stats?.entriesThisWeek ?? 0, label: "This week", color: "#F59E0B" },
              { value: `${complianceRate}%`, label: "Compliance", color: complianceRate >= 80 ? "#4ADE80" : complianceRate >= 50 ? "#FBBF24" : "#FB7185" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-[14px] p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-mono text-xl font-extrabold leading-none tabular-nums"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5 font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Error */}
        {error && (
          <div className="animate-slide-down bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 font-medium"
            style={{ background: "var(--warning-light)", borderColor: "var(--warning)", color: "var(--warning)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Pending teacher approvals alert */}
        {stats && (stats.pendingTeachers ?? 0) > 0 && (
          <Link
            href="/admin/teachers"
            className="animate-slide-up flex items-center gap-3.5 card p-4 border-l-4 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
            style={{ borderLeftColor: "var(--accent)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-light)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {stats.pendingTeachers} teacher{(stats.pendingTeachers ?? 0) > 1 ? "s" : ""} awaiting approval
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Tap to review and approve</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* ── QUICK ACTIONS — 2×2 gradient grid ── */}
        <div className="animate-slide-up animation-delay-150">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                href: "/admin/entries",
                icon: CheckCircle2,
                label: "Verify Entries",
                count: `${pendingEntries.length} pending`,
                gradient: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                gradientDark: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))",
                iconColor: "#4F46E5",
              },
              {
                href: "/admin/timetable",
                icon: Calendar,
                label: "Timetable",
                count: "Manage schedule",
                gradient: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                gradientDark: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06))",
                iconColor: "#16A34A",
              },
              {
                href: "/admin/reports",
                icon: BarChart3,
                label: "Reports",
                count: "Analytics & export",
                gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                gradientDark: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))",
                iconColor: "#D97706",
              },
              {
                href: "/admin/teachers",
                icon: Users,
                label: "Teachers",
                count: `${stats?.totalTeachers ?? 0} active`,
                gradient: "linear-gradient(135deg, #FFF1F2, #FFE4E6)",
                gradientDark: "linear-gradient(135deg, rgba(225,29,72,0.12), rgba(225,29,72,0.06))",
                iconColor: "#E11D48",
              },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-[var(--radius-lg)] p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] group stagger-${i + 1}`}
                  style={{ background: action.gradient }}
                >
                  <div className="mb-2.5" style={{ color: action.iconColor }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-[var(--text-primary)] text-sm">{action.label}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{action.count}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── TEACHER ACTIVITY ── */}
        {topTeachers.length > 0 && (
          <div className="animate-slide-up animation-delay-225 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Teacher Activity
              </h3>
              <Link href="/admin/teachers" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {topTeachers.map((t) => {
                const name = `${t.firstName} ${t.lastName}`;
                // Estimate expected entries per week (assume 5 per week per subject)
                const expectedPerWeek = Math.max(t.subjects.length * 5, 5);
                return (
                  <TeacherActivityRow
                    key={t.id}
                    name={name}
                    initials={`${t.firstName[0]}${t.lastName[0]}`}
                    entriesLogged={t.entryCount}
                    entriesExpected={expectedPerWeek}
                    color={getAvatarColor(name)}
                    onClick={() => {/* could navigate to teacher detail */}}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── PENDING VERIFICATION ── */}
        {pendingEntries.length > 0 && (
          <div className="animate-slide-up animation-delay-300 card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Pending Verification
              </h3>
              <Link href="/admin/entries" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              {pendingEntries.map((entry) => {
                const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
                const subjectName = entry.assignment?.subject?.name
                  || entry.topics?.[0]?.subject?.name
                  || "Unknown";
                const isVerifying = verifying === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {teacherName}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                        {subjectName} · {entry.class.name} · {timeAgo(entry.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleVerify(entry.id)}
                      disabled={isVerifying}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 transition-all active:scale-90 disabled:opacity-50"
                      style={{
                        background: "var(--success-light)",
                        color: "var(--success)",
                      }}
                      aria-label="Verify entry"
                    >
                      {isVerifying ? (
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--success)", borderTopColor: "transparent" }} />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENTRIES BY WEEK CHART ── */}
        {stats && stats.entriesByWeek.length > 0 && (
          <div className="animate-slide-up animation-delay-375 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Entries per Week
              </h3>
            </div>
            <div className="flex items-end gap-2.5 h-28">
              {stats.entriesByWeek.map((w, i) => {
                const maxCount = Math.max(
                  ...stats.entriesByWeek.map((x) => x.count)
                );
                const height = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={w.week}
                    className="flex-1 flex flex-col items-center gap-1.5 group"
                  >
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 tabular-nums">
                      {w.count}
                    </span>
                    <div
                      className="w-full rounded-lg transition-all duration-700 animate-progress-fill"
                      style={{
                        height: `${Math.max(height, 8)}%`,
                        animationDelay: `${i * 100}ms`,
                        background: `linear-gradient(180deg, var(--accent), var(--accent-hover))`,
                        opacity: 0.7 + (height / 100) * 0.3,
                      }}
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)] font-semibold font-mono">
                      W{w.week.split("-W")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENTRIES BY SUBJECT ── */}
        {stats && stats.entriesBySubject.length > 0 && (
          <div className="animate-slide-up animation-delay-450 card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Entries by Subject
              </h3>
            </div>
            <div className="space-y-3">
              {stats.entriesBySubject.slice(0, 6).map((s) => {
                const maxCount = stats.entriesBySubject[0].count;
                const width = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-primary)] font-semibold truncate mr-2">{s.subject}</span>
                      <span className="text-[var(--text-tertiary)] font-mono font-bold tabular-nums flex-shrink-0">{s.count}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill animate-progress-fill"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MORE QUICK ACTIONS ── */}
        <div className="animate-slide-up animation-delay-525">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
            Management
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/entry-timetable", icon: FileText, label: "Entry Grid", desc: "Entries by class/week" },
              { href: "/admin/classes", icon: GraduationCap, label: "Classes", desc: "Subjects & divisions" },
              { href: "/admin/assignments", icon: UserCheck, label: "Assignments", desc: "Assign teachers" },
              { href: "/admin/hods", icon: Shield, label: "HODs", desc: "Dept. heads" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="card p-4 group hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "var(--accent-light)" }}>
                  <Icon className="w-4.5 h-4.5 text-[var(--accent-text)]" />
                </div>
                <p className="font-bold text-[var(--text-primary)] text-sm">{label}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
