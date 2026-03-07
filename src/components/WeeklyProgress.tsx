"use client";

import React from "react";

interface DayProgress {
  day: string; // Mon, Tue, etc.
  completed: number;
  total: number;
  isCurrent: boolean;
}

interface WeeklyProgressProps {
  days: DayProgress[];
  totalCompleted: number;
  totalPeriods: number;
}

function WeeklyProgress({ days, totalCompleted, totalPeriods }: WeeklyProgressProps) {
  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">This Week</h3>
        <span className="text-xs font-mono tabular-nums text-[var(--text-tertiary)]">
          {totalCompleted}/{totalPeriods} periods
        </span>
      </div>
      <div className="flex items-end gap-2 h-20">
        {days.map((day) => {
          const height = day.total > 0 ? (day.completed / maxTotal) * 100 : 0;
          const bgHeight = day.total > 0 ? (day.total / maxTotal) * 100 : 0;
          const isComplete = day.completed >= day.total && day.total > 0;

          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full relative" style={{ height: `${bgHeight}%`, minHeight: "4px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: "100%",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "4px",
                  }}
                />
                <div
                  className="absolute bottom-0 w-full rounded-t-sm animate-progress-fill"
                  style={{
                    height: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                    background: day.isCurrent
                      ? "linear-gradient(to top, var(--accent), var(--accent-warm))"
                      : isComplete
                      ? "linear-gradient(to top, #16A34A, #22C55E)"
                      : "var(--bg-tertiary)",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${
                day.isCurrent ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"
              }`}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WeeklyProgress };
export type { WeeklyProgressProps, DayProgress };
