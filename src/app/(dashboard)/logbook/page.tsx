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
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  return colors[index % colors.length];
}

function getSubjectBg(index: number): string {
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-100",
    "bg-emerald-50 text-emerald-700 border-emerald-100",
    "bg-violet-50 text-violet-700 border-violet-100",
    "bg-amber-50 text-amber-700 border-amber-100",
    "bg-rose-50 text-rose-700 border-rose-100",
    "bg-cyan-50 text-cyan-700 border-cyan-100",
  ];
  return colors[index % colors.length];
}

export default function LogbookPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<AllSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHOD, setIsHOD] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-10 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
          <div className="max-w-lg mx-auto relative">
            <div className="skeleton h-5 w-32 !bg-white/10 mb-2" />
            <div className="skeleton h-7 w-48 !bg-white/15 mb-6" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.07] rounded-2xl px-3 py-4">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-10 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/[0.05] rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

        <div className="max-w-lg mx-auto relative">
          {/* Greeting row */}
          <div className="flex items-center justify-between mb-6">
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <GreetingIcon className="w-4 h-4 text-amber-400" />
                <p className="text-brand-300 text-xs font-semibold uppercase tracking-wider">
                  {greeting.text}
                </p>
              </div>
              <h1 className="text-2xl font-bold text-white">
                My Logbook
              </h1>
              <p className="text-brand-400/80 text-sm mt-0.5">
                {DAY_NAMES[dayOfWeek]}, {today.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Today", value: stats.today, icon: Zap, color: "text-amber-400", delay: "" },
              { label: "This Week", value: stats.thisWeek, icon: TrendingUp, color: "text-emerald-400", delay: "animation-delay-75" },
              { label: "This Month", value: stats.thisMonth, icon: BarChart3, color: "text-blue-400", delay: "animation-delay-150" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`animate-count-up ${stat.delay} bg-white/[0.08] backdrop-blur-sm rounded-2xl px-3 py-4 text-center border border-white/[0.06] hover:bg-white/[0.12] transition-colors duration-300`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1.5 opacity-80`} />
                <p className="text-3xl font-bold text-white tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className="text-brand-400/70 text-[10px] uppercase tracking-wider font-semibold mt-1.5">
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
          className="animate-scale-in relative flex items-center justify-center gap-3 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white font-bold rounded-2xl py-4.5 px-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-base">New Entry</span>
          <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* HOD Banner */}
        {isHOD && (
          <Link
            href="/hod"
            className="animate-slide-up flex items-center gap-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                Head of Department
              </p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">
                {hodSubjects.join(", ")} — Tap to view department
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Today's Schedule */}
        {isWeekday && todaySlots.length > 0 && (
          <div className="animate-slide-up card overflow-hidden">
            <div className="px-5 pt-4 pb-2.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Today&apos;s Schedule
                </h3>
                <p className="text-[11px] text-slate-400">
                  {todaySlots.length} class{todaySlots.length !== 1 ? "es" : ""} scheduled
                </p>
              </div>
              {unfilledSlots.length > 0 && (
                <span className="text-[10px] bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-100 animate-pulse-subtle">
                  {unfilledSlots.length} pending
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50/80">
              {todaySlots
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((slot, i) => {
                  const isFilled = entries.some(
                    (e) =>
                      new Date(e.date).toISOString().split("T")[0] === todayStr &&
                      e.period === slot.periodNumber
                  );
                  const colorIdx = subjectColorMap.get(slot.assignment.subject.name) ?? i;
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3.5 px-5 py-3.5 transition-all duration-200 ${
                        isFilled ? "bg-emerald-50/40" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
                          isFilled
                            ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white"
                            : `bg-gradient-to-br ${getSubjectColor(colorIdx)} text-white opacity-80`
                        }`}
                      >
                        P{slot.periodNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {slot.assignment.subject.name}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isFilled ? "bg-emerald-400" : "bg-slate-300"}`} />
                          {slot.class.name} &middot; {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      {isFilled ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 rounded-lg px-2.5 py-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[11px] font-semibold">Done</span>
                        </div>
                      ) : (
                        <Link
                          href="/logbook/new"
                          className="text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl px-4 py-2 flex-shrink-0 transition-all active:scale-95 shadow-sm"
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

        {/* Smart next-class card */}
        {nextClassInfo && (
          <div className={`animate-slide-up card overflow-hidden border-l-4 ${
            nextClassInfo.type === "prep" ? "border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-white" :
            nextClassInfo.type === "rest-short" ? "border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-white" :
            "border-l-emerald-400 bg-gradient-to-r from-emerald-50/50 to-white"
          }`}>
            <div className="p-5">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  nextClassInfo.type === "prep" ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                  nextClassInfo.type === "rest-short" ? "bg-gradient-to-br from-blue-400 to-blue-500" :
                  "bg-gradient-to-br from-emerald-400 to-emerald-500"
                }`}>
                  {nextClassInfo.type === "prep" ? (
                    <Zap className="w-5 h-5 text-white" />
                  ) : (
                    <Sun className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    nextClassInfo.type === "prep" ? "text-amber-800" :
                    nextClassInfo.type === "rest-short" ? "text-blue-800" :
                    "text-emerald-800"
                  }`}>{nextClassInfo.message}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{nextClassInfo.detail}</p>
                  <p className={`text-[11px] font-medium mt-2 ${
                    nextClassInfo.type === "prep" ? "text-amber-600" :
                    nextClassInfo.type === "rest-short" ? "text-blue-600" :
                    "text-emerald-600"
                  }`}>{nextClassInfo.hint}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekend notice — only show if no nextClassInfo */}
        {!isWeekday && !nextClassInfo && (
          <div className="animate-slide-up card p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">Weekend Mode</p>
              <p className="text-sm text-slate-400 mt-0.5">
                No classes scheduled. Enjoy your rest!
              </p>
            </div>
          </div>
        )}

        {/* Editable Entries */}
        {stats.editableEntries.length > 0 && (
          <div className="animate-slide-up card overflow-hidden border-amber-200/60 shadow-[0_0_0_1px_rgba(245,158,11,0.1),0_4px_16px_rgba(245,158,11,0.06)]">
            <div className="px-5 pt-4 pb-2.5 flex items-center gap-3 bg-gradient-to-r from-amber-50/50 to-transparent">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center shadow-sm">
                <Edit3 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Editable Entries
                </h3>
                <p className="text-[11px] text-slate-400">
                  Edit within the 1-hour window
                </p>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200/60">
                <Clock className="w-3 h-3 inline mr-0.5 -mt-px" />
                1hr window
              </span>
            </div>
            <div className="divide-y divide-slate-50/80">
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
                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-amber-50/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-amber-800 transition-colors">
                        {entry.topics?.[0]?.subject?.name ?? "Entry"} &middot;{" "}
                        {entry.class.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {entry.topics?.[0]?.name ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-1.5 flex-shrink-0 border border-amber-100">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] text-amber-700 font-bold tabular-nums">
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
            <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center shadow-sm">
              <Award className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                Verification Rate
              </h3>
              <p className="text-[11px] text-slate-400">
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
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full animate-progress-fill transition-all duration-500 ${
                stats.verifiedRate >= 70
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : stats.verifiedRate >= 40
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  : "bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Recent Entries
              </h3>
              <Link
                href="/history"
                className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:gap-2 transition-all group"
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
                        <span className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100">
                          {entry.class.name}
                        </span>
                      </div>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="text-sm text-slate-800 font-semibold truncate">
                      {entry.topics?.[0]?.moduleName
                        ? `${entry.topics[0].moduleName}: `
                        : ""}
                      {entry.topics?.[0]?.name ?? "—"}
                    </p>
                    <div className="flex items-center gap-2.5 mt-2.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-slate-200">&middot;</span>
                      <span>{formatTime(entry.createdAt)}</span>
                      {entry.period && (
                        <>
                          <span className="text-slate-200">&middot;</span>
                          <span className="font-semibold text-slate-500">P{entry.period}</span>
                        </>
                      )}
                      {isEditable(entry) && (
                        <Link
                          href={`/logbook/${entry.id}/edit`}
                          className="ml-auto text-brand-600 font-bold flex items-center gap-0.5 hover:text-brand-700 transition-colors opacity-0 group-hover:opacity-100"
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

        {entries.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <BookOpen className="w-10 h-10 text-brand-400" />
            </div>
            <p className="text-slate-700 font-bold text-lg">No entries yet</p>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
              Start recording your teaching activities by tapping the button above
            </p>
            <Link
              href="/logbook/new"
              className="inline-flex items-center gap-2 mt-5 bg-brand-600 text-white font-semibold rounded-xl px-5 py-2.5 hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
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
