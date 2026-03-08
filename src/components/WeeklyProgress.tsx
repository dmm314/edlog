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
  return (
    <div
      className="border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-primary)",
        borderRadius: "20px",
        padding: "18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
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

      <div className="flex items-end" style={{ height: "48px", gap: "6px" }}>
        {days.map((day) => {
          const fillPct = day.total > 0 ? (day.completed / day.total) * 100 : 0;
          const isComplete = day.completed >= day.total && day.total > 0;
          const isFuture = !day.isCurrent && day.completed === 0 && !isComplete;

          // Determine bar fill gradient
          let fillGradient: string;
          if (day.isCurrent) {
            fillGradient = "linear-gradient(180deg, var(--accent-warm, var(--accent)), var(--accent))";
          } else if (isComplete || day.completed > 0) {
            // Past days with any logging: green gradient
            fillGradient = "linear-gradient(180deg, #22C55E, #16A34A)";
          } else {
            fillGradient = "transparent";
          }

          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full relative overflow-hidden"
                style={{
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: isFuture ? "var(--bg-tertiary)" : "var(--bg-tertiary)",
                }}
              >
                {/* Fill bar — animated from bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 animate-progress-fill"
                  style={{
                    height: `${fillPct}%`,
                    background: fillGradient,
                    borderRadius: "10px",
                    minHeight: fillPct > 0 ? "4px" : "0",
                  }}
                />
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: "10px",
                  fontWeight: day.isCurrent ? 800 : 500,
                  color: day.isCurrent ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
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
