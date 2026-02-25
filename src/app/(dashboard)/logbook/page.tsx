"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import type { EntryWithRelations } from "@/types";
import { formatDate, formatTime, truncate } from "@/lib/utils";

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

export default function LogbookPage() {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const params = new URLSearchParams({
          from: sevenDaysAgo.toISOString().split("T")[0],
          limit: "20",
        });
        const res = await fetch(`/api/entries?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries);

          const today = new Date().toISOString().split("T")[0];
          const todayEntries = data.entries.filter(
            (e: EntryWithRelations) =>
              new Date(e.date).toISOString().split("T")[0] === today
          );
          setTodayCount(todayEntries.length);
        }
      } catch {
        // Silently handle — entries will show as empty
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Logbook</h1>
              <p className="text-brand-400 text-sm">Your recent entries</p>
            </div>
          </div>

          {/* Today stats */}
          <div className="bg-white/10 rounded-xl px-4 py-3 mt-3">
            <p className="text-brand-400 text-xs uppercase tracking-wider font-semibold">
              Today
            </p>
            <p className="text-2xl font-bold text-white">
              {todayCount}{" "}
              <span className="text-sm font-normal text-brand-400">
                {todayCount === 1 ? "entry" : "entries"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {/* New Entry Button */}
        <Link
          href="/logbook/new"
          className="btn-primary flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          New Entry
        </Link>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No entries yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Tap &quot;New Entry&quot; to get started
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Last 7 Days
            </h3>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="card p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-brand-950">
                      {entry.topic.subject.name}
                    </h4>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {entry.topic.moduleName
                      ? `${entry.topic.moduleName}: `
                      : ""}
                    {entry.topic.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{entry.class.name}</span>
                    <span>&middot;</span>
                    <span>{formatDate(entry.date)}</span>
                    <span>&middot;</span>
                    <span>{formatTime(entry.createdAt)}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      {truncate(entry.notes, 100)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/history"
              className="block text-center text-sm text-brand-700 font-semibold mt-4 py-2"
            >
              View All History
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
