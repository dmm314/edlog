"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Calendar,
  CheckCircle,
  Pen,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakBadge } from "@/components/StreakBadge";
import { WeeklyProgress } from "@/components/WeeklyProgress";
import type { EntryWithRelations } from "@/types";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";
import { getTimeGreeting, getDisplayName } from "@/lib/greeting";

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

function isEditable(entry: EntryWithRelations): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - new Date(entry.createdAt).getTime() < oneHour;
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
  const { isCoordinator: isCoordinatorCtx, coordinatorTitle: coordinatorTitleCtx, switchMode } = useCoordinatorMode();
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [allSlots, setAllSlots] = useState<AllSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHOD, setIsHOD] = useState(false);
  const [unfilledOpen, setUnfilledOpen] = useState(false);
  const [hodSubjects, setHodSubjects] = useState<string[]>([]);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userGender, setUserGender] = useState<string | null>(null);
  const [genderPromptDismissed, setGenderPromptDismissed] = useState(true); // default true to avoid flash
  const [savingGender, setSavingGender] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [pendingAssessments, setPendingAssessments] = useState(0);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [coordinatorTitle, setCoordinatorTitle] = useState("");
  const [coordinatorPendingCount, setCoordinatorPendingCount] = useState(0);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const todayStr = today.toISOString().split("T")[0];
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

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

        // Get user name + gender
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            const u = sessionData?.user;
            setUserFirstName(u?.firstName || "");
            setUserLastName(u?.lastName || "");
          }
          // Fetch gender from profile (session may not have it yet until re-login)
          const profileRes = await fetch("/api/profile");
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const g = profileData.gender ?? null;
            setUserGender(g);
            // Show gender prompt if gender is null and not dismissed
            const dismissed = typeof window !== "undefined"
              ? localStorage.getItem("edlog-gender-prompt-dismissed") === "true"
              : true;
            setGenderPromptDismissed(dismissed || g !== null);
          }
        } catch {
          // silently fail
        }

        // Check for unread announcements
        try {
          const notiRes = await fetch("/api/notifications?unreadOnly=true");
          if (notiRes.ok) {
            const notifs = await notiRes.json();
            const announcementCount = notifs.filter(
              (n: { type: string }) =>
                n.type === "SCHOOL_ANNOUNCEMENT" || n.type === "REGIONAL_ANNOUNCEMENT"
            ).length;
            setUnreadAnnouncements(announcementCount);
          }
        } catch {
          // silently fail
        }

        // Check for pending (uncorrected) assessments
        try {
          const assessRes = await fetch("/api/assessments?corrected=false&limit=1");
          if (assessRes.ok) {
            const assessData = await assessRes.json();
            setPendingAssessments(assessData.total || 0);
          }
        } catch {
          // silently fail
        }

        // Check if teacher is a Level Coordinator
        try {
          const coordRes = await fetch("/api/coordinator/dashboard");
          if (coordRes.ok) {
            const coordData = await coordRes.json();
            setIsCoordinator(true);
            setCoordinatorTitle(coordData.coordinator?.title || "Level Coordinator");
            setCoordinatorPendingCount(coordData.stats?.pendingVerification || 0);
          }
        } catch {
          // not a coordinator
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dayOfWeek, isWeekday]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const allLoggedToday = useMemo(() => {
    return sortedTodaySlots.length > 0 && todayFilledCount === sortedTodaySlots.length;
  }, [sortedTodaySlots, todayFilledCount]);

  async function handleSetGender(gender: "MALE" | "FEMALE") {
    setSavingGender(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender }),
      });
      if (res.ok) {
        setUserGender(gender);
        setGenderPromptDismissed(true);
      }
    } catch { /* silently fail */ }
    finally { setSavingGender(false); }
  }

  function dismissGenderPrompt() {
    if (typeof window !== "undefined") {
      localStorage.setItem("edlog-gender-prompt-dismissed", "true");
    }
    setGenderPromptDismissed(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Skeleton Header */}
        <div
          className="px-5 pt-12 pb-7"
          style={{
            background: "linear-gradient(135deg, var(--header-from), var(--header-via), var(--header-to))",
          }}
        >
          <div className="max-w-lg mx-auto relative">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="skeleton h-3 w-24 !bg-white/[0.06] mb-2" />
                <div className="skeleton h-7 w-40 !bg-white/10" />
              </div>
              <div className="skeleton h-10 w-10 rounded-[14px] !bg-white/[0.06]" />
            </div>
            <div className="flex" style={{ gap: "10px" }}>
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

  // TODO: Calculate syllabus coverage as (unique topics logged / total topics in assigned subjects-levels) × 100
  // Current APIs don't provide total topic counts per subject-level, so hardcoding "—" for now
  const syllabusDisplay = "—";

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div
        className="px-5 pt-12 pb-7"
        style={{
          background: "linear-gradient(135deg, var(--header-from), var(--header-via), var(--header-to))",
        }}
      >
        <div className="max-w-lg mx-auto relative">
          {/* Greeting + Bell */}
          <div className="flex items-start justify-between mb-5">
            <div className="animate-fade-in">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "#a8a29e",
                }}
              >
                {getTimeGreeting()}
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "white",
                  marginTop: "2px",
                  lineHeight: 1.2,
                }}
              >
                {userFirstName || userLastName
                  ? getDisplayName(userFirstName, userLastName, userGender)
                  : "My Logbook"}
              </h1>
            </div>
            <NotificationBell />
          </div>

          {/* Streak + Syllabus pods */}
          <div className="flex animate-slide-up animation-delay-75" style={{ gap: "10px" }}>
            <StreakBadge days={streakDays} className="flex-1" />
            <div
              className="flex flex-col items-center justify-center"
              style={{
                minWidth: "80px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "12px 14px",
              }}
            >
              <p
                className="leading-none tabular-nums"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "white",
                }}
              >
                {syllabusDisplay}
              </p>
              <p
                className="mt-1"
                style={{
                  fontSize: "10px",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                SYLLABUS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="px-4 mt-4 max-w-lg mx-auto desktop-content" style={{ paddingBottom: "90px" }}>
        {/* ── Gender Prompt (one-time) ─────────────────────────────── */}
        {!genderPromptDismissed && (
          <div className="mb-3 rounded-2xl border p-4 animate-slide-up"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Complete your profile</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Set your gender so we can address you properly in the app.
                </p>
              </div>
              <button onClick={dismissGenderPrompt} className="text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] p-1 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSetGender("MALE")} disabled={savingGender}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#DBEAFE", color: "#1E40AF" }}>
                Male
              </button>
              <button onClick={() => handleSetGender("FEMALE")} disabled={savingGender}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#FCE7F3", color: "#9D174D" }}>
                Female
              </button>
              <button onClick={dismissGenderPrompt}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}>
                Later
              </button>
            </div>
          </div>
        )}

        {/* ── Unread Announcements Banner ─────────────────────────── */}
        {unreadAnnouncements > 0 && (
          <Link
            href="/messages"
            className="flex items-center justify-between p-3.5 mb-3 rounded-2xl border active:scale-[0.98] transition-all animate-slide-up"
            style={{
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              border: "1px solid #FDE68A",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#92400E" }}>
                You have {unreadAnnouncements} new announcement{unreadAnnouncements > 1 ? "s" : ""}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        )}

        {/* ── Today's Schedule ─────────────────────────────────────── */}
        {isWeekday && sortedTodaySlots.length > 0 && (
          <div className="animate-slide-up">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Today — {DAY_NAMES[dayOfWeek]}
              </h2>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                }}
              >
                {todayFilledCount}/{sortedTodaySlots.length} logged
              </span>
            </div>

            {/* Period cards */}
            <div className="flex flex-col gap-2">
              {sortedTodaySlots.map((slot, i) => {
                const matchingEntry = entries.find(
                  (e) =>
                    new Date(e.date).toISOString().split("T")[0] === todayStr &&
                    e.period === slot.periodNumber
                );
                const isFilled = !!matchingEntry;
                const isCurrent = i === currentPeriodIndex && !isFilled;
                const moduleName = matchingEntry?.moduleName;

                // Period time status for Log button behavior
                const nowDate = new Date();
                const currentMins = nowDate.getHours() * 60 + nowDate.getMinutes();
                const [slotStartH, slotStartM] = slot.startTime.split(":").map(Number);
                const [slotEndH, slotEndM] = slot.endTime.split(":").map(Number);
                const slotStartMins = slotStartH * 60 + slotStartM;
                const slotEndMins = slotEndH * 60 + slotEndM;
                const hasEnded = currentMins >= slotEndMins;
                const isInProgress = currentMins >= slotStartMins && currentMins < slotEndMins;
                const minutesUntilEnd = slotEndMins - currentMins;

                return (
                  <div
                    key={slot.id}
                    className="flex gap-3 items-stretch"
                    style={{
                      opacity: 0,
                      animation: "fadeSlideIn 400ms ease forwards",
                      animationDelay: `${i * 80}ms`,
                    }}
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
                        background: "var(--bg-elevated)",
                        borderColor: isCurrent
                          ? "var(--accent)"
                          : "var(--border-primary)",
                        boxShadow: isCurrent
                          ? "var(--shadow-accent)"
                          : "var(--shadow-card)",
                        opacity: isFilled ? 0.55 : 1,
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
                            {slot.class.name}{isFilled && moduleName ? ` \u00B7 ${moduleName}` : ""}
                          </p>
                        </div>

                        {isFilled ? (
                          <div
                            className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "#DCFCE7",
                            }}
                          >
                            <CheckCircle className="w-[18px] h-[18px]" style={{ color: "#16A34A" }} />
                          </div>
                        ) : hasEnded ? (
                          <Link
                            href={`/logbook/new?slotId=${slot.id}&period=${slot.periodNumber}&date=${todayStr}&assignmentId=${slot.assignment.id}&classId=${slot.class.id}`}
                            className="flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform flex-shrink-0"
                            style={{
                              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                              boxShadow: "var(--shadow-accent)",
                            }}
                          >
                            <Pen className="w-3.5 h-3.5" />
                            Log
                          </Link>
                        ) : isInProgress ? (
                          <span
                            className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold flex-shrink-0"
                            style={{
                              background: "var(--bg-tertiary)",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            <Clock className="w-3 h-3" />
                            {minutesUntilEnd}m
                          </span>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-[10px] flex-shrink-0"
                            style={{
                              background: "#F5F5F4",
                              border: "2px dashed #D6D3D1",
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

        {/* All caught up celebration */}
        {isWeekday && allLoggedToday && sortedTodaySlots.length > 0 && (
          <div className="animate-scale-in mt-4 card p-6 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "#DCFCE7" }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: "#16A34A" }} />
            </div>
            <p className="font-display text-xl font-bold text-[var(--text-primary)]">
              All caught up!
            </p>
            {streakDays > 0 && (
              <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
                {streakDays} day streak
              </p>
            )}
          </div>
        )}

        {/* Weekend / No classes notice */}
        {(!isWeekday || sortedTodaySlots.length === 0) && (
          <div className="animate-slide-up card p-6 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <Calendar className="w-7 h-7 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">
                No classes today
              </p>
              <div className="flex gap-3 mt-2">
                <Link
                  href="/timetable"
                  className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-2"
                >
                  View timetable
                </Link>
                {unfilledWeekSlots.length > 0 && (
                  <Link
                    href="/history"
                    className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-2"
                  >
                    Catch up on entries
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Next Class Info ──────────────────────────────────────── */}
        {nextClassInfo && (
          <div className="animate-slide-up animation-delay-75 mt-4 card p-4 flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: nextClassInfo.type === "prep" ? "var(--accent-light)" : "var(--bg-tertiary)",
              }}
            >
              <Clock
                className="w-5 h-5"
                style={{
                  color: nextClassInfo.type === "prep" ? "var(--accent-text)" : "var(--text-tertiary)",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)]">{nextClassInfo.message}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{nextClassInfo.detail}</p>
              <p className="text-xs text-[var(--text-quaternary)] mt-1 italic">{nextClassInfo.hint}</p>
            </div>
          </div>
        )}

        {/* ── Weekly Progress ──────────────────────────────────────── */}
        {weeklyProgressData.totalPeriods > 0 && (
          <div className="animate-slide-up animation-delay-150 mt-4">
            <WeeklyProgress
              days={weeklyProgressData.days}
              totalCompleted={weeklyProgressData.totalCompleted}
              totalPeriods={weeklyProgressData.totalPeriods}
            />
          </div>
        )}

        {/* ── Unfilled Periods This Week (collapsible) ─────────────── */}
        {unfilledWeekSlots.length > 0 && (
          <div className="animate-slide-up animation-delay-225 mt-4">
            <button
              onClick={() => setUnfilledOpen(!unfilledOpen)}
              className="w-full card px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-bold text-[var(--text-primary)]">
                Unfilled periods this week
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums" style={{ color: "var(--accent-text)" }}>
                  {unfilledWeekSlots.length}
                </span>
                {unfilledOpen ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                )}
              </div>
            </button>
            {unfilledOpen && (
              <div className="mt-1 space-y-1">
                {unfilledWeekSlots.map((slot, idx) => (
                  <div
                    key={`${slot.dateStr}-${slot.slotLabel}-${idx}`}
                    className="card px-4 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {slot.subjectName}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {slot.dayName} &middot; {slot.slotLabel} &middot; {slot.className}
                      </p>
                    </div>
                    <Link
                      href="/logbook/new"
                      className="text-xs font-semibold px-2.5 py-1 rounded-[10px]"
                      style={{
                        background: "var(--accent-light)",
                        color: "var(--accent-text)",
                      }}
                    >
                      Log
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HOD Banner ───────────────────────────────────────────── */}
        {isHOD && hodSubjects.length > 0 && (
          <div className="animate-slide-up animation-delay-300 mt-4">
            <Link
              href="/hod"
              className="card p-4 flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-light)" }}
              >
                <Shield className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">Head of Department</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {hodSubjects.join(", ")}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] -rotate-90" />
            </Link>
          </div>
        )}

        {/* ── Level Coordinator Banner ─────────────────────────── */}
        {(isCoordinator || isCoordinatorCtx) && (
          <div className="animate-slide-up animation-delay-300 mt-4">
            <div
              className="card p-3 flex items-center gap-3 border-l-4"
              style={{ borderLeftColor: "#8B5CF6" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.1)" }}
              >
                <Shield className="w-4 h-4" style={{ color: "#7C3AED" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--text-primary)] text-xs">
                  You&apos;re in Teacher mode
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {(coordinatorTitle || coordinatorTitleCtx) || "Level Coordinator"}
                  {coordinatorPendingCount > 0 && (
                    <span className="ml-1 font-semibold" style={{ color: "#D97706" }}>
                      — {coordinatorPendingCount} to review
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => switchMode("coordinator")}
                className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: "#EDE9FE", color: "#5B21B6" }}
              >
                Switch →
              </button>
            </div>
          </div>
        )}

        {/* Pending Assessments Card */}
        {pendingAssessments > 0 && (
          <div className="animate-slide-up animation-delay-300 mt-4">
            <Link
              href="/assessments"
              className="card p-4 flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--warning-bg, #fef3c7)" }}
              >
                <Pen className="w-5 h-5" style={{ color: "var(--warning-text, #92400e)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {pendingAssessments} test{pendingAssessments !== 1 ? "s" : ""} pending results
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Enter results &rarr;
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </Link>
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
