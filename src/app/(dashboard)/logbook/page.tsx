"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  CheckCircle,
  ArrowRight,
  Sun,
  Zap,
  Award,
  Crown,
  ChevronRight,
  AlertCircle,
  Pen,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakBadge } from "@/components/StreakBadge";
import { WeeklyProgress } from "@/components/WeeklyProgress";
import type { EntryWithRelations } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { useStaggeredReveal } from "@/hooks/useStaggeredReveal";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimetableSlotInfo {
  id: string;
  periodNumber: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  class: { id: string; name: string };
  assignment: {
    id: string;
    subject: { id: string; name: string };
  };
}

interface AllSlotInfo {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  schoolName?: string;
  assignment: {
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: "badge-submitted",
    VERIFIED: "badge-verified",
    FLAGGED: "badge-flagged",
    DRAFT: "badge-draft",
  };
  return (
    <span className={map[status] || map.DRAFT}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function isEditable(entry: EntryWithRelations): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - new Date(entry.createdAt).getTime() < oneHour;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getSubjectBg(): string {
  return "bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--border-primary)]";
}

function getCurrentPeriodIndex(slots: TimetableSlotInfo[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < slots.length; i++) {
    const [startH, startM] = slots[i].startTime.split(":").map(Number);
    const [endH, endM] = slots[i].endTime.split(":").map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    if (currentMinutes >= start && currentMinutes < end) return i;
  }

  // If before all classes, return -1; if after, return slots.length
  if (slots.length > 0) {
    const [firstH, firstM] = slots[0].startTime.split(":").map(Number);
    if (currentMinutes < firstH * 60 + firstM) return -1;
  }
  return slots.length;
}

export default function LogbookPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<AllSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHOD, setIsHOD] = useState(false);
  const [unfilledOpen, setUnfilledOpen] = useState(false);
  const [hodSubjects, setHodSubjects] = useState<string[]>([]);
  const [userName, setUserName] = useState("");

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const todayStr = today.toISOString().split("T")[0];
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const greeting = getGreeting();

  useEffect(() => {
    async function fetchData() {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const params = new URLSearchParams({
          from: thirtyDaysAgo.toISOString().split("T")[0],
          limit: "50",
        });

        const promises: Promise<Response>[] = [
          fetch(`/api/entries?${params}`),
          fetch(`/api/timetable/slots`),
        ];

        if (isWeekday) {
          promises.push(fetch(`/api/timetable/slots?dayOfWeek=${dayOfWeek}`));
        }

        const results = await Promise.all(promises);

        if (results[0].ok) {
          const data = await results[0].json();
          setEntries(data.entries);
        }

        if (results[1]?.ok) {
          const allSlotsData = await results[1].json();
          setAllSlots(allSlotsData);
        }

        if (results[2]?.ok) {
          const slotsData = await results[2].json();
          setTodaySlots(slotsData.slots || []);
        }

        // Check if teacher is an HOD
        try {
          const hodRes = await fetch("/api/hod/stats");
          if (hodRes.ok) {
            const hodData = await hodRes.json();
            setIsHOD(true);
            setHodSubjects(hodData.hodSubjects.map((s: { name: string }) => s.name));
          }
        } catch {
          // not an HOD
        }

        // Get user name
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setUserName(sessionData?.user?.name || "");
          }
        } catch {
          // silently fail
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dayOfWeek, isWeekday]);

  const stats = useMemo(() => {
    const todayEntries = entries.filter(
      (e) => new Date(e.date).toISOString().split("T")[0] === todayStr
    );

    const startOfWeek = new Date(today);
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekEntries = entries.filter((e) => new Date(e.date) >= startOfWeek);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEntries = entries.filter((e) => new Date(e.date) >= startOfMonth);

    const verified = entries.filter((e) => e.status === "VERIFIED").length;
    const total = entries.length;

    return {
      today: todayEntries.length,
      thisWeek: weekEntries.length,
      thisMonth: monthEntries.length,
      verifiedRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      recentEntries: entries.slice(0, 5),
      editableEntries: entries.filter(isEditable),
    };
  }, [entries, todayStr, today]);

  const sortedTodaySlots = useMemo(
    () => [...todaySlots].sort((a, b) => a.periodNumber - b.periodNumber),
    [todaySlots]
  );

  const currentPeriodIndex = useMemo(
    () => getCurrentPeriodIndex(sortedTodaySlots),
    [sortedTodaySlots]
  );

  const todayFilledCount = useMemo(() => {
    return sortedTodaySlots.filter((slot) =>
      entries.some(
        (e) =>
          new Date(e.date).toISOString().split("T")[0] === todayStr &&
          e.period === slot.periodNumber
      )
    ).length;
  }, [sortedTodaySlots, entries, todayStr]);

  const unfilledWeekSlots = useMemo(() => {
    if (allSlots.length === 0) return [];

    const now = new Date();
    const currentDow = now.getDay();
    const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const unfilled: { dayOfWeek: number; dayName: string; dateStr: string; slotLabel: string; className: string; subjectName: string }[] = [];
    const DOW_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let d = 0; d < 5; d++) {
      const checkDate = new Date(monday);
      checkDate.setDate(monday.getDate() + d);
      if (checkDate > now) break;

      const dow = d + 1;
      const dateStr = checkDate.toISOString().split("T")[0];
      const daySlots = allSlots.filter((s) => s.dayOfWeek === dow);

      for (const slot of daySlots) {
        const periodMatch = slot.periodLabel.match(/\d+/);
        const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;

        const hasEntry = entries.some((e) => {
          const entryDate = new Date(e.date).toISOString().split("T")[0];
          if (entryDate !== dateStr) return false;
          if (e.status === "DRAFT") return false;
          if (periodNum !== null && e.period === periodNum) return true;
          return false;
        });

        if (!hasEntry) {
          unfilled.push({
            dayOfWeek: dow,
            dayName: DOW_NAMES[dow] || "",
            dateStr,
            slotLabel: slot.periodLabel,
            className: slot.assignment.className,
            subjectName: slot.assignment.subjectName,
          });
        }
      }
    }

    return unfilled;
  }, [allSlots, entries]);

  const hasMultipleSchools = useMemo(() => {
    const schools = new Set(allSlots.map((s) => s.schoolName).filter(Boolean));
    return schools.size > 1;
  }, [allSlots]);

  // Streak: count consecutive days with entries (simplified — counts from today backward)
  const streakDays = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();
      // Skip weekends
      if (dow === 0 || dow === 6) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      const hasEntry = entries.some(
        (e) => new Date(e.date).toISOString().split("T")[0] === dateStr
      );
      if (hasEntry) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (i === 0) {
        // Today might not have entries yet — don't break streak
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  // Weekly progress data for the bar chart
  const weeklyProgressData = useMemo(() => {
    const startOfWeek = new Date(today);
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days: { day: string; completed: number; total: number; isCurrent: boolean }[] = [];
    let totalCompleted = 0;
    let totalPeriods = 0;

    for (let d = 0; d < 5; d++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(startOfWeek.getDate() + d);
      const dateStr = checkDate.toISOString().split("T")[0];
      const dow = d + 1;

      const daySlots = allSlots.filter((s) => s.dayOfWeek === dow);
      const dayEntries = entries.filter(
        (e) =>
          new Date(e.date).toISOString().split("T")[0] === dateStr &&
          e.status !== "DRAFT"
      );

      const total = daySlots.length;
      const completed = Math.min(dayEntries.length, total);
      const isCurrent = dateStr === todayStr;

      days.push({ day: ["Mon", "Tue", "Wed", "Thu", "Fri"][d], completed, total, isCurrent });
      totalCompleted += completed;
      totalPeriods += total;
    }

    return { days, totalCompleted, totalPeriods };
  }, [allSlots, entries, today, todayStr]);

  const nextClassInfo = useMemo(() => {
    if (allSlots.length === 0) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentDow = now.getDay();
    const todayDow = currentDow === 0 ? 7 : currentDow;

    const todaySlotsAll = allSlots
      .filter((s) => s.dayOfWeek === todayDow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingToday = todaySlotsAll.filter((s) => {
      const [h, m] = s.startTime.split(":").map(Number);
      return h * 60 + m > currentHour * 60 + currentMin;
    });

    if (upcomingToday.length > 0) {
      const next = upcomingToday[0];
      const [h, m] = next.startTime.split(":").map(Number);
      const diffMins = (h * 60 + m) - (currentHour * 60 + currentMin);

      if (diffMins <= 120) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;
        const schoolStr = hasMultipleSchools && next.schoolName ? ` at ${next.schoolName}` : "";
        return {
          type: "prep" as const,
          message: `Your next class is in ${timeStr}!${schoolStr}`,
          detail: `${next.assignment.subjectName} — ${next.assignment.className} at ${next.startTime}`,
          hint: hasMultipleSchools && next.schoolName
            ? `Head to ${next.schoolName} and ensure you are prepped!`
            : "Time to recheck everything and ensure you are prepped for class!",
        };
      } else {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;
        const schoolStr = hasMultipleSchools && next.schoolName ? ` at ${next.schoolName}` : "";
        return {
          type: "rest-short" as const,
          message: `Next class in ${timeStr}${schoolStr}`,
          detail: `${next.assignment.subjectName} — ${next.assignment.className} at ${next.startTime}`,
          hint: "You have some time. Take a breather and prepare at your pace.",
        };
      }
    }

    const DAY_LABELS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const teachingDays = new Set(allSlots.map((s) => s.dayOfWeek));

    for (let offset = 1; offset <= 7; offset++) {
      let checkDow = todayDow + offset;
      if (checkDow > 7) checkDow -= 7;
      if (teachingDays.has(checkDow)) {
        const nextDaySlots = allSlots
          .filter((s) => s.dayOfWeek === checkDow)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const firstSlot = nextDaySlots[0];

        if (offset === 1) {
          const schoolHint = hasMultipleSchools && firstSlot.schoolName ? ` at ${firstSlot.schoolName}` : "";
          return {
            type: "rest-short" as const,
            message: `Done for today! Next class is tomorrow${schoolHint}`,
            detail: `${firstSlot.assignment.subjectName} — ${firstSlot.assignment.className} at ${firstSlot.startTime}`,
            hint: "Get some rest and come back refreshed!",
          };
        }

        const schoolHint = hasMultipleSchools && firstSlot.schoolName ? ` at ${firstSlot.schoolName}` : "";
        return {
          type: "rest-long" as const,
          message: `No more classes until ${DAY_LABELS[checkDow]}${schoolHint}`,
          detail: `${firstSlot.assignment.subjectName} — ${firstSlot.assignment.className} at ${firstSlot.startTime}`,
          hint: `That's ${offset} days away. Enjoy your well-deserved rest!`,
        };
      }
    }

    return null;
  }, [allSlots, hasMultipleSchools]);

  const { containerRef, getItemStyle } = useStaggeredReveal(sortedTodaySlots.length);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Skeleton Header */}
        <div className="page-header px-5 pt-12 pb-7">
          <div className="max-w-lg mx-auto relative">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="skeleton h-3 w-24 !bg-white/[0.06] mb-2" />
                <div className="skeleton h-7 w-40 !bg-white/10" />
              </div>
              <div className="skeleton h-10 w-10 rounded-[14px] !bg-white/[0.06]" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl p-3 bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="skeleton h-9 w-9 rounded-xl !bg-white/[0.06]" />
                  <div>
                    <div className="skeleton h-5 w-16 !bg-white/[0.08] mb-1" />
                    <div className="skeleton h-3 w-20 !bg-white/[0.04]" />
                  </div>
                </div>
              </div>
              <div className="w-20 rounded-2xl p-3 bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center">
                <div className="skeleton h-6 w-12 !bg-white/[0.08] mb-1" />
                <div className="skeleton h-2 w-14 !bg-white/[0.04]" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          <div className="flex justify-between items-center mb-1">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-16" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 items-stretch">
              <div className="w-12 flex flex-col items-center pt-3">
                <div className="skeleton h-3 w-8 mb-1" />
                <div className="skeleton h-2 w-5" />
              </div>
              <div className="flex-1 card p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="skeleton h-4 w-24 mb-2" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                  <div className="skeleton h-7 w-7 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
          <div className="card p-5 mt-5">
            <div className="flex justify-between mb-3">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="flex gap-2 items-end h-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1">
                  <div className="skeleton h-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const syllabusRate = stats.verifiedRate;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="page-header px-5 pt-12 pb-7">
        <div className="max-w-lg mx-auto relative">
          {/* Greeting + Bell */}
          <div className="flex items-start justify-between mb-5">
            <div className="animate-fade-in">
              <p
                className="text-[13px] font-medium tracking-wide"
                style={{ color: "var(--header-text-muted)" }}
              >
                {greeting}
              </p>
              <h1
                className="font-display text-[26px] font-bold mt-0.5 tracking-tight leading-tight"
                style={{ color: "var(--header-text)" }}
              >
                {userName || "My Logbook"}
              </h1>
            </div>
            <NotificationBell />
          </div>

          {/* Streak + Syllabus pods */}
          <div className="flex gap-3 animate-slide-up animation-delay-75">
            <StreakBadge days={streakDays} className="flex-1" />
            <div
              className="rounded-2xl px-4 py-3 flex flex-col items-center justify-center min-w-[80px] border"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xl font-extrabold leading-none tabular-nums"
                style={{ color: "var(--header-text)" }}
              >
                {syllabusRate}%
              </p>
              <p
                className="text-[10px] uppercase tracking-widest font-medium mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Syllabus
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="px-4 -mt-1 max-w-lg mx-auto space-y-4">
        {/* HOD Banner */}
        {isHOD && (
          <Link
            href="/hod"
            className="animate-slide-up card p-4 flex items-center gap-3.5 border-l-4 border-l-amber-500 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Head of Department
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {hodSubjects.join(", ")} — Tap to view department
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* ── Today's Schedule ─────────────────────────────────────── */}
        {isWeekday && sortedTodaySlots.length > 0 && (
          <div className="animate-slide-up">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Today — {DAY_NAMES[dayOfWeek]}
              </h2>
              <span className="text-xs font-medium text-[var(--text-tertiary)] font-mono tabular-nums">
                {todayFilledCount}/{sortedTodaySlots.length} logged
              </span>
            </div>

            {/* Period cards */}
            <div ref={containerRef} className="flex flex-col gap-2">
              {sortedTodaySlots.map((slot, i) => {
                const isFilled = entries.some(
                  (e) =>
                    new Date(e.date).toISOString().split("T")[0] === todayStr &&
                    e.period === slot.periodNumber
                );
                const isCurrent = i === currentPeriodIndex && !isFilled;
                const isPast = i < currentPeriodIndex || isFilled;

                return (
                  <div
                    key={slot.id}
                    className="flex gap-3 items-stretch"
                    style={getItemStyle(i)}
                  >
                    {/* Time column */}
                    <div className="w-12 flex-shrink-0 flex flex-col items-center pt-3.5">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isCurrent ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {slot.startTime}
                      </span>
                      <span className="text-[10px] text-[var(--text-quaternary)]">
                        P{slot.periodNumber}
                      </span>
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 rounded-2xl px-4 py-3.5 relative overflow-hidden transition-all duration-200 ${
                        isCurrent
                          ? "border-2 shadow-lg"
                          : "border"
                      }`}
                      style={{
                        background: isCurrent
                          ? "var(--bg-elevated)"
                          : isPast
                          ? "var(--bg-secondary)"
                          : "var(--bg-elevated)",
                        borderColor: isCurrent
                          ? "var(--accent)"
                          : "var(--border-primary)",
                        boxShadow: isCurrent
                          ? "var(--shadow-accent)"
                          : "var(--shadow-card)",
                        opacity: isPast && isFilled ? 0.6 : 1,
                      }}
                    >
                      {/* Amber top bar for current period */}
                      {isCurrent && (
                        <div
                          className="absolute top-0 left-0 right-0 h-[3px]"
                          style={{
                            background: "linear-gradient(90deg, var(--accent), var(--accent-warm))",
                          }}
                        />
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[var(--text-primary)] leading-snug">
                            {slot.assignment.subject.name}
                          </p>
                          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
                            {slot.class.name}
                          </p>
                        </div>

                        {isFilled ? (
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "var(--success-light)",
                              color: "var(--success)",
                            }}
                          >
                            <CheckCircle className="w-[18px] h-[18px]" />
                          </div>
                        ) : isCurrent ? (
                          <Link
                            href="/logbook/new"
                            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform flex-shrink-0"
                            style={{
                              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                              boxShadow: "var(--shadow-accent)",
                            }}
                          >
                            <Pen className="w-3.5 h-3.5" />
                            Log
                          </Link>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-xl flex-shrink-0"
                            style={{
                              background: "var(--bg-secondary)",
                              border: "2px dashed var(--text-quaternary)",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekend / No classes notice */}
        {(!isWeekday || sortedTodaySlots.length === 0) && !nextClassInfo && (
          <div className="animate-slide-up card p-6 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <Calendar className="w-7 h-7 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {!isWeekday ? "Weekend Mode" : "No Classes Today"}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                {!isWeekday
                  ? "No classes scheduled. Enjoy your rest!"
                  : "Your timetable is clear today."}
              </p>
            </div>
          </div>
        )}

        {/* ── Weekly Progress ──────────────────────────────────────── */}
        {weeklyProgressData.totalPeriods > 0 && (
          <div className="animate-slide-up animation-delay-150">
            <WeeklyProgress
              days={weeklyProgressData.days}
              totalCompleted={weeklyProgressData.totalCompleted}
              totalPeriods={weeklyProgressData.totalPeriods}
            />
          </div>
        )}

        {/* Smart next-class card */}
        {nextClassInfo && (
          <div className={`animate-slide-up card overflow-hidden border-l-4 ${
            nextClassInfo.type === "prep" ? "border-l-amber-500" :
            nextClassInfo.type === "rest-short" ? "border-l-sky-500" :
            "border-l-emerald-500"
          }`}>
            <div className="p-5">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  nextClassInfo.type === "prep" ? "bg-amber-500/10" :
                  nextClassInfo.type === "rest-short" ? "bg-sky-500/10" :
                  "bg-emerald-500/10"
                }`}>
                  {nextClassInfo.type === "prep" ? (
                    <Zap className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Sun className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{nextClassInfo.message}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{nextClassInfo.detail}</p>
                  <p className="text-[11px] font-medium mt-2 text-[var(--text-tertiary)]">{nextClassInfo.hint}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unfilled Periods This Week */}
        {unfilledWeekSlots.length > 0 && (
          <div className="animate-slide-up card overflow-hidden">
            <button
              onClick={() => setUnfilledOpen(!unfilledOpen)}
              className="w-full flex items-center gap-3 p-3.5 transition-colors text-left"
              style={{ backgroundColor: unfilledOpen ? "var(--bg-tertiary)" : "transparent" }}
            >
              <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">Unfilled Periods This Week</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {unfilledWeekSlots.length} period{unfilledWeekSlots.length !== 1 ? "s" : ""} not yet filled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {unfilledWeekSlots.length}
                </span>
                <ChevronRight className={`w-4 h-4 text-[var(--text-quaternary)] transition-transform ${unfilledOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {unfilledOpen && (
              <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
                {[1, 2, 3, 4, 5].map((dow) => {
                  const daySlots = unfilledWeekSlots.filter((s) => s.dayOfWeek === dow);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={dow} className="px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">
                        {daySlots[0].dayName}
                      </p>
                      <div className="space-y-1.5">
                        {daySlots.map((slot, i) => (
                          <Link
                            key={i}
                            href="/logbook/new"
                            className="w-full flex items-center gap-2.5 bg-red-500/5 hover:bg-red-500/10 border rounded-lg px-3 py-2 text-left transition-colors"
                            style={{ borderColor: "var(--border-primary)" }}
                          >
                            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {slot.slotLabel.replace(/[^0-9P]/g, "").slice(0, 3) || slot.slotLabel.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {slot.subjectName} &middot; {slot.className}
                              </p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">
                                {slot.slotLabel} &middot; Not filled
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-red-500">Fill</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Editable Entries */}
        {stats.editableEntries.length > 0 && (
          <div className="animate-slide-up card overflow-hidden border-l-4 border-l-amber-500">
            <div className="px-5 pt-4 pb-2.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Editable Entries
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Edit within the 1-hour window
                </p>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3 inline mr-0.5 -mt-px" />
                1hr window
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              {stats.editableEntries.map((entry) => {
                const minutesLeft = Math.max(
                  0,
                  Math.floor(
                    (60 * 60 * 1000 -
                      (Date.now() - new Date(entry.createdAt).getTime())) /
                      60000
                  )
                );
                return (
                  <Link
                    key={entry.id}
                    href={`/logbook/${entry.id}/edit`}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {entry.topics?.[0]?.subject?.name ?? "Entry"} &middot;{" "}
                        {entry.class.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {entry.topics?.[0]?.name ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-3 py-1.5 flex-shrink-0">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] text-amber-600 font-bold tabular-nums">
                        {minutesLeft}m left
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification Rate */}
        <div className="animate-slide-up animation-delay-225 card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-[var(--accent-light)] rounded-xl flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-[var(--accent-text)]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Verification Rate
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Last 30 days performance
              </p>
            </div>
            <div className={`text-lg font-black tabular-nums ${
              stats.verifiedRate >= 70
                ? "text-emerald-600"
                : stats.verifiedRate >= 40
                ? "text-amber-600"
                : "text-red-500"
            }`}>
              {stats.verifiedRate}%
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
            <div
              className={`h-full rounded-full animate-progress-fill transition-all duration-500 ${
                stats.verifiedRate >= 70
                  ? "bg-emerald-500"
                  : stats.verifiedRate >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${stats.verifiedRate}%` }}
            />
          </div>
          {stats.verifiedRate >= 70 && (
            <p className="text-[11px] text-emerald-600 font-medium mt-2.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Great progress! Keep it up
            </p>
          )}
        </div>

        {/* Recent Entries */}
        {stats.recentEntries.length > 0 && (
          <div className="animate-slide-up animation-delay-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                Recent Entries
              </h3>
              <Link
                href="/history"
                className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all group"
                style={{ color: "var(--accent-text)" }}
              >
                View All
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {stats.recentEntries.map((entry, i) => {
                const subjectName = entry.topics?.[0]?.subject?.name ?? "—";
                return (
                  <div
                    key={entry.id}
                    className="card p-4 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 group"
                    style={{ animationDelay: `${300 + i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSubjectBg()}`}>
                          {subjectName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}>
                          {entry.class.name}
                        </span>
                      </div>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="text-sm text-[var(--text-primary)] font-semibold truncate">
                      {entry.topics?.[0]?.moduleName
                        ? `${entry.topics[0].moduleName}: `
                        : ""}
                      {entry.topics?.[0]?.name ?? "—"}
                    </p>
                    <div className="flex items-center gap-2.5 mt-2.5 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-[var(--text-quaternary)]">&middot;</span>
                      <span>{formatTime(entry.createdAt)}</span>
                      {entry.period && (
                        <>
                          <span className="text-[var(--text-quaternary)]">&middot;</span>
                          <span className="font-semibold text-[var(--text-secondary)]">P{entry.period}</span>
                        </>
                      )}
                      {isEditable(entry) && (
                        <Link
                          href={`/logbook/${entry.id}/edit`}
                          className="ml-auto font-bold flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100"
                          style={{ color: "var(--accent-text)" }}
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && sortedTodaySlots.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <BookOpen className="w-10 h-10 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-primary)] font-bold text-lg">No entries yet</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1.5 max-w-xs mx-auto">
              Start recording your teaching activities by tapping the button below
            </p>
            <Link
              href="/logbook/new"
              className="inline-flex items-center gap-2 mt-5 text-white font-semibold rounded-xl px-5 py-2.5 active:scale-95 transition-all"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="w-4 h-4" />
              Create First Entry
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
