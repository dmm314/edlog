"use client";

import Link from "next/link";
import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleSlot {
  id: string;
  periodNumber: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  assignment: {
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
  };
  isLogged?: boolean;
}

interface ScheduleCardProps {
  slots: ScheduleSlot[];
  date: string;
  loading?: boolean;
}

export function ScheduleCard({ slots, date, loading }: ScheduleCardProps) {
  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        <div className="skeleton-heading" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <div className="skeleton-text w-3/4" />
              <div className="skeleton-text w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--text-tertiary))]" />
        <p className="text-sm font-medium text-[hsl(var(--text-primary))]">No classes scheduled today.</p>
      </div>
    );
  }

  const allLogged = slots.every((s) => s.isLogged);

  return (
    <div className="card">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Today&apos;s Schedule</h3>
        {allLogged && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
            <Check className="h-3.5 w-3.5" />
            All logged
          </span>
        )}
      </div>
      <div className="divide-y divide-[hsl(var(--border-muted))]">
        {slots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-shrink-0 w-10 text-center">
              <p className="font-mono text-xs font-bold text-[hsl(var(--text-primary))]">
                P{slot.periodNumber}
              </p>
              <p className="font-mono text-[10px] text-[hsl(var(--text-tertiary))]">
                {slot.startTime}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">
                {slot.assignment.className}
              </p>
              <p className="text-xs text-[hsl(var(--text-tertiary))] truncate">
                {slot.assignment.subjectName}
              </p>
            </div>
            <div className="flex-shrink-0">
              {slot.isLogged ? (
                <span className="badge-verified">Logged</span>
              ) : (
                <Link
                  href={`/logbook/new?assignmentId=${slot.assignment.id}&slotId=${slot.id}&date=${date}`}
                  className={cn(
                    "inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white",
                    "active:scale-95 transition-transform",
                  )}
                >
                  Log
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
