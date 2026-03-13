"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Shield,
  Users,
  CheckCircle,
  ClipboardList,
  Calendar,
  BookOpen,
  Flag,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { formatDate } from "@/lib/utils";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";

interface CoordinatorInfo {
  id: string;
  title: string;
  levels: string[];
  canVerify: boolean;
  canRemark: boolean;
  schoolName: string;
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
  moduleName: string | null;
  topicText: string | null;
  status: string;
  teacher: { id: string; firstName: string; lastName: string };
  class: { id: string; name: string; level: string };
  topics: { id: string; name: string; subject: { id: string; name: string } }[];
  assignment?: { subject: { id: string; name: string } } | null;
}

function TeacherInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
      style={{ background: "linear-gradient(135deg, #6D28D9, #7C3AED)" }}
    >
      {firstName[0]}{lastName[0]}
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  const { hasTeachingAssignments, switchMode } = useCoordinatorMode();
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, entriesRes] = await Promise.all([
          fetch("/api/coordinator/dashboard"),
          fetch("/api/coordinator/entries?status=SUBMITTED&limit=20"),
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setCoordinator(dashData.coordinator);
          setStats(dashData.stats);
        } else {
          // Dashboard API failed (likely missing DB columns) — fall back to check API
          const checkRes = await fetch("/api/coordinator/check");
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            setCoordinator({
              id: "",
              title: checkData.title || "Level Coordinator",
              levels: checkData.levels || [],
              canVerify: true,
              canRemark: true,
              schoolName: "",
            });
          } else {
            const err = await dashRes.json().catch(() => ({}));
            setError(err.error || "Failed to load coordinator data");
          }
        }

        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setPendingEntries(entriesData.entries || []);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div
          className="px-5 pt-10 pb-7 rounded-b-[2rem]"
          style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
        >
          <div className="max-w-lg mx-auto">
            <div className="skeleton h-4 w-20 !bg-white/10 mb-2" />
            <div className="skeleton h-7 w-44 !bg-white/15 mb-1" />
            <div className="skeleton h-3 w-32 !bg-white/8 mb-5" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 rounded-[14px] p-3 bg-white/[0.04]">
                  <div className="skeleton h-6 w-10 mx-auto !bg-white/10 mb-1" />
                  <div className="skeleton h-2 w-14 mx-auto !bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--skeleton-base)]" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-32 mb-2" />
                  <div className="skeleton h-2 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !coordinator) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center px-5">
          <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
          <p className="font-semibold text-[var(--text-secondary)]">{error || "Coordinator record not found"}</p>
          <Link href="/logbook" className="text-sm font-semibold mt-3 inline-block" style={{ color: "#7C3AED" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const levelSummary = coordinator.levels.length === 1
    ? coordinator.levels[0]
    : coordinator.levels.join(", ");

  const pendingCount = stats?.pendingVerification ?? 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── Purple Gradient Header ── */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
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
          <div className="flex items-start justify-between animate-fade-in">
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "rgba(196,181,253,0.8)" }}>
                Level Coordinator
              </p>
              <h1
                className="mt-1"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {coordinator.title}
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                Managing {levelSummary} classes
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>
                {coordinator.schoolName}
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* Stat pods */}
          <div className="flex mt-5 animate-slide-up animation-delay-75" style={{ gap: "8px" }}>
            {[
              {
                value: pendingCount,
                label: "To Review",
                color: pendingCount > 0 ? "#FBBF24" : "#A78BFA",
              },
              {
                value: stats?.verifiedCount ?? 0,
                label: "Verified",
                color: "#4ADE80",
              },
              {
                value: stats?.totalTeachers ?? 0,
                label: "Teachers",
                color: "#818CF8",
              },
              {
                value: stats?.totalEntries ?? 0,
                label: "This month",
                color: "#C4B5FD",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "10px 6px",
                }}
              >
                <p
                  className="leading-none tabular-nums"
                  style={{ fontSize: "20px", fontWeight: 800, color: stat.color }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "5px" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Mode switch banner for dual-role users */}
        {hasTeachingAssignments && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-fade-in"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
          >
            <p className="flex-1 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              You&apos;re in Coordinator mode
            </p>
            <button
              onClick={() => switchMode("teacher")}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              Teacher mode →
            </button>
          </div>
        )}

        {/* Quick nav cards */}
        <div className="grid grid-cols-2 gap-2 animate-slide-up">
          <Link
            href="/coordinator/teachers"
            className="p-4 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
              borderRadius: "16px",
            }}
          >
            <Users className="w-5 h-5 mb-2" style={{ color: "#5B21B6" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Teachers</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {stats?.totalTeachers ?? 0} at your levels
            </p>
          </Link>
          <Link
            href="/coordinator/timetable"
            className="p-4 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
              borderRadius: "16px",
            }}
          >
            <Calendar className="w-5 h-5 mb-2" style={{ color: "#166534" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Timetable</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {levelSummary} schedule
            </p>
          </Link>
        </div>

        {/* ── Pending Review Section ── */}
        <div className="animate-slide-up animation-delay-150">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: "#7C3AED" }} />
              Pending Review
              {pendingCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEF3C7", color: "#92400E" }}
                >
                  {pendingCount}
                </span>
              )}
            </h2>
          </div>

          {pendingEntries.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#4ADE80" }} />
              <p className="font-bold text-[var(--text-primary)]">All caught up!</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                No entries pending review at your levels
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingEntries.map((entry) => {
                const subjectName =
                  entry.assignment?.subject?.name ||
                  entry.topics?.[0]?.subject?.name ||
                  "Unknown subject";
                const topicPreview =
                  entry.topics?.length > 0
                    ? entry.topics[0].name
                    : entry.topicText || "No topic";

                return (
                  <div
                    key={entry.id}
                    className="card p-4 flex items-start gap-3"
                    style={{ borderLeft: "3px solid #7C3AED" }}
                  >
                    <TeacherInitials
                      firstName={entry.teacher.firstName}
                      lastName={entry.teacher.lastName}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {entry.teacher.firstName} {entry.teacher.lastName}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {subjectName} · {entry.class.name} · {formatDate(entry.date)}
                            {entry.period ? ` · P${entry.period}` : ""}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                            {topicPreview}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
                        >
                          Submitted
                        </span>
                      </div>
                      <Link
                        href={`/coordinator/entries/${entry.id}`}
                        className="inline-flex items-center gap-1 mt-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
                        style={{ background: "#7C3AED" }}
                      >
                        Review
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info about coordinator scope */}
        <div
          className="animate-slide-up animation-delay-225 card p-4 flex items-start gap-3"
          style={{ borderLeft: "3px solid #A78BFA" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "#EDE9FE" }}
          >
            <BookOpen className="w-4 h-4" style={{ color: "#6D28D9" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Your scope</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              You see entries, teachers, and timetables for:{" "}
              <span className="font-semibold" style={{ color: "#6D28D9" }}>{levelSummary}</span>
            </p>
          </div>
        </div>

        {/* Flag legend */}
        <div className="card p-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verify = OK
          </span>
          <span className="flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-red-500" /> Flag = needs correction
          </span>
        </div>
      </div>
    </div>
  );
}
