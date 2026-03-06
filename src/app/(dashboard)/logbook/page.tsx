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
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CloudSun,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
  Crown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { EntryWithRelations } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

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

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: Sun };
  if (hour < 17) return { text: "Good Afternoon", icon: CloudSun };
  return { text: "Good Evening", icon: Moon };
}

function getSubjectColor(index: number): string {
  const opacity = [0.9, 0.75, 0.65, 0.55, 0.8, 0.7];
  return `opacity-${Math.round((opacity[index % opacity.length] || 0.7) * 100)}`;
}
 
function getSubjectBg(_index: number): string {
  return "bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--border-primary)]";
}

export default function LogbookPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<AllSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHOD, setIsHOD] = useState(false);
  const [unfilledOpen, setUnfilledOpen] = useState(false);
  const [hodSubjects, setHodSubjects] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const todayStr = today.toISOString().split("T")[0];
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

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
          fetch(`/api/timetable/slots`), // all weekday slots
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
          // not an HOD, silently fail
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

  const unfilledSlots = useMemo(() => {
    const filledPeriods = new Set(
      entries
        .filter((e) => new Date(e.date).toISOString().split("T")[0] === todayStr)
        .map((e) => e.period)
        .filter(Boolean)
    );
    return todaySlots.filter((s) => !filledPeriods.has(s.periodNumber));
  }, [todaySlots, entries, todayStr]);

  // Unfilled periods for this week — shows what the teacher hasn't filled yet
  const unfilledWeekSlots = useMemo(() => {
    if (allSlots.length === 0) return [];

    // Get start of current week (Monday)
    const now = new Date();
    const currentDow = now.getDay(); // 0=Sun...6=Sat
    const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // For each weekday up to today, check which slots don't have entries
    const unfilled: { dayOfWeek: number; dayName: string; dateStr: string; slotLabel: string; className: string; subjectName: string }[] = [];
    const DOW_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let d = 0; d < 5; d++) { // Mon=0..Fri=4
      const checkDate = new Date(monday);
      checkDate.setDate(monday.getDate() + d);
      if (checkDate > now) break; // Don't show future days

      const dow = d + 1; // 1=Mon...5=Fri
      const dateStr = checkDate.toISOString().split("T")[0];

      // Get slots for this day
      const daySlots = allSlots.filter((s) => s.dayOfWeek === dow);

      // Check which ones have entries
      for (const slot of daySlots) {
        const periodMatch = slot.periodLabel.match(/\d+/);
        const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;

        const hasEntry = entries.some((e) => {
          const entryDate = new Date(e.date).toISOString().split("T")[0];
          if (entryDate !== dateStr) return false;
          if (e.status === "DRAFT") return false;
          // Match by period number or slot ID
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

  // Track unique subjects for coloring
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    todaySlots.forEach((s) => {
      if (!map.has(s.assignment.subject.name)) {
        map.set(s.assignment.subject.name, idx++);
      }
    });
    entries.forEach((e) => {
      const name = e.topics?.[0]?.subject?.name;
      if (name && !map.has(name)) {
        map.set(name, idx++);
      }
    });
    return map;
  }, [todaySlots, entries]);

  // Check if teacher has multiple schools
  const hasMultipleSchools = useMemo(() => {
    const schools = new Set(allSlots.map((s) => s.schoolName).filter(Boolean));
    return schools.size > 1;
  }, [allSlots]);

  // Smart next-class message
  const nextClassInfo = useMemo(() => {
    if (allSlots.length === 0) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentDow = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Convert to 1=Mon format
    const todayDow = currentDow === 0 ? 7 : currentDow;

    // Find slots for today that haven't started yet
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
        // 2 hours or less — prep warning
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
        // More than 2 hours away
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

    // No more classes today — find next teaching day
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

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="page-header px-5 pt-10 pb-10 rounded-b-[2rem] shadow-elevated">
          <div className="max-w-lg mx-auto relative">
            <div className="skeleton h-5 w-32 !bg-white/10 mb-2" />
            <div className="skeleton h-7 w-48 !bg-white/15 mb-6" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.05] rounded-2xl px-3 py-4">
                  <div className="skeleton h-8 w-10 mx-auto mb-2 !bg-white/10" />
                  <div className="skeleton h-3 w-14 mx-auto !bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 mt-5 max-w-lg mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-2/3 mb-3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Hero Header */}
      <div className="page-header px-5 pt-10 pb-10 rounded-b-[2rem] shadow-elevated">
        <div className="max-w-lg mx-auto relative">
          {/* Greeting row */}
          <div className="flex items-center justify-between mb-6">
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <GreetingIcon className="w-4 h-4 text-white/40" />
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                  {greeting.text}
                </p>
              </div>
              <h1 className="text-2xl font-bold text-white">
                My Logbook
              </h1>
              <p className="text-white/30 text-sm mt-0.5">
                {DAY_NAMES[dayOfWeek]}, {today.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </div>
            <NotificationBell />
          </div>
 
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Today", value: stats.today, icon: Zap, delay: "" },
              { label: "This Week", value: stats.thisWeek, icon: TrendingUp, delay: "animation-delay-75" },
              { label: "This Month", value: stats.thisMonth, icon: BarChart3, delay: "animation-delay-150" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`animate-count-up ${stat.delay} bg-white/[0.06] backdrop-blur-sm rounded-2xl px-3 py-4 text-center border border-white/[0.04] hover:bg-white/[0.1] transition-colors duration-300`}
              >
                <stat.icon className="w-4 h-4 text-white/30 mx-auto mb-1.5" />
                <p className="text-3xl font-bold text-white tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className="text-white/25 text-[10px] uppercase tracking-wider font-semibold mt-1.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 max-w-lg mx-auto space-y-4">
        {/* New Entry CTA */}
        <Link
          href="/logbook/new"
          className="animate-scale-in relative flex items-center justify-center gap-3 text-white font-bold rounded-2xl py-4.5 px-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group overflow-hidden"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-base">New Entry</span>
        </Link>

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

        {/* Today's Schedule */}
        {isWeekday && todaySlots.length > 0 && (
          <div className="animate-slide-up card overflow-hidden">
            <div className="px-5 pt-4 pb-2.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-[var(--accent-light)] rounded-xl flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-[var(--accent-text)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Today&apos;s Schedule
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {todaySlots.length} class{todaySlots.length !== 1 ? "es" : ""} scheduled
                </p>
              </div>
              {unfilledSlots.length > 0 && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2.5 py-1 rounded-full animate-pulse-subtle">
                  {unfilledSlots.length} pending
                </span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              {todaySlots
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((slot) => {
                  const isFilled = entries.some(
                    (e) =>
                      new Date(e.date).toISOString().split("T")[0] === todayStr &&
                      e.period === slot.periodNumber
                  );
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3.5 px-5 py-3.5 transition-all duration-200"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isFilled
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-[var(--accent-light)] text-[var(--accent-text)]"
                        }`}
                      >
                        P{slot.periodNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {slot.assignment.subject.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isFilled ? "bg-emerald-400" : "bg-[var(--text-quaternary)]"}`} />
                          {slot.class.name} &middot; {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      {isFilled ? (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg px-2.5 py-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[11px] font-semibold">Done</span>
                        </div>
                      ) : (
                        <Link
                          href="/logbook/new"
                          className="text-xs font-bold text-white rounded-xl px-4 py-2 flex-shrink-0 transition-all active:scale-95"
                          style={{ backgroundColor: "var(--accent)" }}
                        >
                          Fill
                        </Link>
                      )}
                    </div>
                  );
                })}
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

        {/* Weekend notice — only show if no nextClassInfo */}
        {!isWeekday && !nextClassInfo && (
          <div className="animate-slide-up card p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-7 h-7 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">Weekend Mode</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                No classes scheduled. Enjoy your rest!
              </p>
            </div>
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
        <div className="animate-slide-up animation-delay-150 card p-5">
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
          <div className="animate-slide-up animation-delay-225">
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
                const colorIdx = subjectColorMap.get(subjectName) ?? i;
                return (
                  <div
                    key={entry.id}
                    className="card p-4 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 group"
                    style={{ animationDelay: `${300 + i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSubjectBg(colorIdx)}`}>
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

        <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-3xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-10 h-10 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-primary)] font-bold text-lg">No entries yet</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1.5 max-w-xs mx-auto">
              Start recording your teaching activities by tapping the button above
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
