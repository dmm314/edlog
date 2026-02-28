"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Target,
  Edit3,
  CheckCircle,
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700",
    VERIFIED: "bg-green-50 text-green-700",
    FLAGGED: "bg-red-50 text-red-700",
    DRAFT: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.DRAFT}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function isEditable(entry: EntryWithRelations): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - new Date(entry.createdAt).getTime() < oneHour;
}

export default function LogbookPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const todayStr = today.toISOString().split("T")[0];
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch entries (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const params = new URLSearchParams({
          from: thirtyDaysAgo.toISOString().split("T")[0],
          limit: "50",
        });

        const promises: Promise<Response>[] = [
          fetch(`/api/entries?${params}`),
        ];

        // Fetch today's timetable slots if weekday
        if (isWeekday) {
          promises.push(fetch(`/api/timetable/slots?dayOfWeek=${dayOfWeek}`));
        }

        const results = await Promise.all(promises);

        if (results[0].ok) {
          const data = await results[0].json();
          setEntries(data.entries);
        }

        if (results[1]?.ok) {
          const slotsData = await results[1].json();
          setTodaySlots(slotsData.slots || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dayOfWeek, isWeekday]);

  // Compute stats
  const stats = useMemo(() => {
    const todayEntries = entries.filter(
      (e) => new Date(e.date).toISOString().split("T")[0] === todayStr
    );

    const startOfWeek = new Date(today);
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekEntries = entries.filter(
      (e) => new Date(e.date) >= startOfWeek
    );

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEntries = entries.filter(
      (e) => new Date(e.date) >= startOfMonth
    );

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

  // Which slots haven't been filled today?
  const unfilledSlots = useMemo(() => {
    const filledPeriods = new Set(
      entries
        .filter((e) => new Date(e.date).toISOString().split("T")[0] === todayStr)
        .map((e) => e.period)
        .filter(Boolean)
    );
    return todaySlots.filter((s) => !filledPeriods.has(s.periodNumber));
  }, [todaySlots, entries, todayStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-white">My Logbook</h1>
            <p className="text-brand-400 text-sm mt-0.5">Loading...</p>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">My Logbook</h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {DAY_NAMES[dayOfWeek]}, {formatDate(today)}
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{stats.today}</p>
              <p className="text-brand-400 text-[10px] uppercase tracking-wider font-semibold">
                Today
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{stats.thisWeek}</p>
              <p className="text-brand-400 text-[10px] uppercase tracking-wider font-semibold">
                This Week
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{stats.thisMonth}</p>
              <p className="text-brand-400 text-[10px] uppercase tracking-wider font-semibold">
                This Month
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* New Entry Button */}
        <Link
          href="/logbook/new"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Entry
        </Link>

        {/* Today's Schedule - only on weekdays */}
        {isWeekday && todaySlots.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Today&apos;s Schedule
              </h3>
              {unfilledSlots.length > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full ml-auto">
                  {unfilledSlots.length} pending
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50">
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
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        isFilled ? "bg-green-50/50" : ""
                      }`}
                    >
                      <div className="w-8 text-center">
                        <span className="text-xs font-bold text-slate-400">
                          P{slot.periodNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {slot.assignment.subject.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {slot.class.name} &middot; {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      {isFilled ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Link
                          href="/logbook/new"
                          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex-shrink-0"
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

        {/* Weekend notice */}
        {!isWeekday && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Weekend</p>
              <p className="text-xs text-slate-400">
                No classes scheduled for today
              </p>
            </div>
          </div>
        )}

        {/* Editable Entries (within 1 hour) */}
        {stats.editableEntries.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Editable Entries
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full ml-auto">
                Edit within 1 hour
              </span>
            </div>
            <div className="divide-y divide-slate-50">
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
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {entry.topics?.[0]?.subject?.name ?? "Entry"} &middot;{" "}
                        {entry.class.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {entry.topics?.[0]?.name ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] text-amber-600 font-medium">
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
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Verification Rate
            </h3>
            <span className="text-sm font-bold text-slate-900 ml-auto">
              {stats.verifiedRate}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                stats.verifiedRate >= 70
                  ? "bg-green-500"
                  : stats.verifiedRate >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${stats.verifiedRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Based on your last 30 days of entries
          </p>
        </div>

        {/* Recent Entries */}
        {stats.recentEntries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Recent Entries
              </h3>
              <Link
                href="/history"
                className="text-xs text-brand-600 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {stats.recentEntries.map((entry) => (
                <div key={entry.id} className="card p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {entry.topics?.[0]?.subject?.name ?? "—"}
                      </span>
                      <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                        {entry.class.name}
                      </span>
                    </div>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="text-sm text-slate-700 font-medium truncate">
                    {entry.topics?.[0]?.moduleName
                      ? `${entry.topics[0].moduleName}: `
                      : ""}
                    {entry.topics?.[0]?.name ?? "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span>{formatDate(entry.date)}</span>
                    <span>&middot;</span>
                    <span>{formatTime(entry.createdAt)}</span>
                    {entry.period && (
                      <>
                        <span>&middot;</span>
                        <span>Period {entry.period}</span>
                      </>
                    )}
                    {isEditable(entry) && (
                      <Link
                        href={`/logbook/${entry.id}/edit`}
                        className="ml-auto text-brand-600 font-medium flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No entries yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Tap &quot;New Entry&quot; to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
