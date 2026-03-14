"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Calendar,
  BarChart3,
  CheckCircle2,
  Check,
  Megaphone,
  Shield,
  BookOpen,
  Layers,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TeacherActivityRow } from "@/components/TeacherActivityRow";
import type { AdminStats, TeacherWithStats } from "@/types";


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

  // Sort teachers by compliance ascending (lowest first — admin sees who's behind)
  const topTeachers = teachers
    .filter((t) => t.membershipStatus === "ACTIVE")
    .sort((a, b) => {
      const aExpected = Math.max(a.subjects.length * 5, 5);
      const bExpected = Math.max(b.subjects.length * 5, 5);
      const aRate = a.entryCount / aExpected;
      const bRate = b.entryCount / bExpected;
      return aRate - bRate;
    })
    .slice(0, 6);

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
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-4 desktop-content">
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
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500, color: "#94A3B8" }}>
                  School Admin
                </p>
                {school && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold"
                    style={{
                      background: school.status === "ACTIVE" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                      border: school.status === "ACTIVE" ? "1px solid rgba(74,222,128,0.15)" : "1px solid rgba(251,191,36,0.15)",
                      color: school.status === "ACTIVE" ? "#4ADE80" : "#FBBF24",
                      borderRadius: "10px",
                      padding: "6px 12px",
                    }}
                  >
                    {school.status === "ACTIVE" ? "Active" : school.status}
                  </span>
                )}
              </div>
              <h1 className="font-display text-[22px] font-bold text-[var(--header-text)] tracking-tight">
                {school?.name || "Admin Dashboard"}
              </h1>
            </div>
            <NotificationBell />
          </div>

          {/* 3 stat pods */}
          <div className="flex mt-5 animate-slide-up animation-delay-75" style={{ gap: "8px" }}>
            {[
              { value: stats?.totalTeachers ?? 0, label: "Teachers", color: "#818CF8" },
              { value: stats?.entriesThisWeek ?? 0, label: "This week", color: "#F59E0B" },
              { value: `${complianceRate}%`, label: "Compliance", color: complianceRate >= 80 ? "#4ADE80" : complianceRate >= 50 ? "#FBBF24" : "#FB7185" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "12px",
                }}
              >
                <p
                  className="leading-none tabular-nums"
                  style={{ fontFamily: "var(--font-body)", fontSize: "22px", fontWeight: 800, color: stat.color }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "10px", color: "#64748B", marginTop: "6px" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4 desktop-content">
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
          <div className="grid grid-cols-2 desktop-actions-row" style={{ gap: "8px" }}>
            {[
              {
                href: "/admin/entries",
                icon: CheckCircle2,
                label: "Verify Entries",
                count: `${pendingEntries.length} pending`,
                gradient: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                iconColor: "#4F46E5",
              },
              {
                href: "/admin/timetable",
                icon: Calendar,
                label: "Timetable",
                count: "Manage schedule",
                gradient: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                iconColor: "#16A34A",
              },
              {
                href: "/admin/reports",
                icon: BarChart3,
                label: "Reports",
                count: "Analytics & export",
                gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                iconColor: "#D97706",
              },
              {
                href: "/admin/teachers",
                icon: Users,
                label: "Teachers",
                count: `${stats?.totalTeachers ?? 0} active`,
                gradient: "linear-gradient(135deg, #FFF1F2, #FFE4E6)",
                iconColor: "#E11D48",
              },
              {
                href: "/admin/classes",
                icon: BookOpen,
                label: "Manage Classes",
                count: "Add & organise classes",
                gradient: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
                iconColor: "#0284C7",
              },
              {
                href: "/admin/subjects",
                icon: Layers,
                label: "Assign Subjects",
                count: "Subjects per class",
                gradient: "linear-gradient(135deg, #F7FEE7, #ECFCCB)",
                iconColor: "#65A30D",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
                  style={{ background: action.gradient, borderRadius: "16px" }}
                >
                  <div className="mb-2.5" style={{ color: action.iconColor }}>
                    <Icon style={{ width: "18px", height: "18px" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{action.label}</p>
                  <p className="mt-0.5" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{action.count}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── MANAGE VPs ── */}
        <Link
          href="/admin/coordinators"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
            border: "1px solid #DDD6FE",
            borderRadius: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
              <Shield className="w-5 h-5" style={{ color: "#6D28D9" }} />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "#3B0764" }}>
                Manage VPs
              </span>
              <span className="block" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#5B21B6" }}>
                Level Coordinators — assign per class level
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: "#7C3AED" }} />
        </Link>

        {/* ── SEND ANNOUNCEMENT ── */}
        <Link
          href="/admin/announcements"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
            border: "1px solid #FDE68A",
            borderRadius: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "#92400E" }}>
                Send Announcement
              </span>
              <span className="block" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#B45309" }}>
                Broadcast to all teachers
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── REPORTS LINK ── */}
        <Link
          href="/admin/reports/teachers"
          className="animate-slide-up animation-delay-175 flex items-center justify-between p-4 group active:scale-[0.98] transition-all duration-200"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[var(--accent-text)]" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              View detailed reports
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── TEACHER ACTIVITY ── */}
        {topTeachers.length > 0 && (
          <div
            className="animate-slide-up animation-delay-225 border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Teacher Activity
              </h3>
              <Link href="/admin/teachers" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-text)" }}>
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {topTeachers.map((t) => {
                const name = `${t.firstName} ${t.lastName}`;
                const expectedPerWeek = Math.max(t.subjects.length * 5, 5);
                return (
                  <TeacherActivityRow
                    key={t.id}
                    name={name}
                    initials={`${t.firstName[0]}${t.lastName[0]}`}
                    entriesLogged={t.entryCount}
                    entriesExpected={expectedPerWeek}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── PENDING VERIFICATION ── */}
        {pendingEntries.length > 0 && (
          <div
            className="animate-slide-up animation-delay-300 border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)", borderRadius: "20px", padding: "18px" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Pending Verification
              </h3>
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
                      className="flex items-center justify-center flex-shrink-0 ml-3 transition-all active:scale-90 disabled:opacity-50"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "12px",
                        background: "#DCFCE7",
                        color: "#16A34A",
                      }}
                      aria-label="Verify entry"
                    >
                      {isVerifying ? (
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "#16A34A", borderTopColor: "transparent" }} />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/entries" className="block text-center text-xs font-semibold mt-3 pt-3" style={{ color: "var(--accent-text)", borderTop: "1px solid var(--border-secondary)" }}>
              View all pending →
            </Link>
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

      </div>
    </div>
  );
}
