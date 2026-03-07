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
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)]">
          This Week
        </h3>
        <span
          className="text-xs font-semibold font-mono tabular-nums"
          style={{ color: "var(--accent-text)" }}
        >
          {totalCompleted}/{totalPeriods} periods
        </span>
      </div>

      <div className="flex gap-[6px] items-end" style={{ height: "56px" }}>
        {days.map((day) => {
          const barHeight = day.total > 0 ? (day.total / maxTotal) * 100 : 8;
          const fillPct = day.total > 0 ? (day.completed / day.total) * 100 : 0;
          const isComplete = day.completed >= day.total && day.total > 0;
          const isFuture = day.completed === 0 && !day.isCurrent && day.total > 0;

          // Determine bar colors
          let fillGradient: string;
          if (isComplete) {
            fillGradient = "linear-gradient(180deg, var(--success), #15803D)";
          } else if (day.isCurrent) {
            fillGradient = "linear-gradient(180deg, var(--accent-warm), var(--accent))";
          } else if (day.completed > 0) {
            fillGradient = "linear-gradient(180deg, var(--accent), var(--accent-hover))";
          } else {
            fillGradient = "transparent";
          }

          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full relative rounded-lg overflow-hidden"
                style={{
                  height: `${barHeight}%`,
                  minHeight: "6px",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                {/* Fill bar — animated from bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-lg animate-progress-fill"
                  style={{
                    height: `${fillPct}%`,
                    background: fillGradient,
                    minHeight: fillPct > 0 ? "4px" : "0",
                  }}
                />
              </div>
              <span
                className={`text-[10px] font-mono ${
                  day.isCurrent
                    ? "font-extrabold text-[var(--text-primary)]"
                    : "font-medium text-[var(--text-tertiary)]"
                }`}
              >
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
