"use client";

import React from "react";
import { Zap } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface StreakBadgeProps {
  days: number;
  className?: string;
}

function StreakBadge({ days, className = "" }: StreakBadgeProps) {
  const animatedDays = useAnimatedCounter(days);
  const hasStreak = days > 0;

  return (
    <div
      className={`rounded-2xl border flex items-center gap-2.5 ${className}`}
      style={{
        background: "hsl(var(--accent) / 0.08)",
        borderColor: "hsl(var(--accent) / 0.12)",
        padding: "12px 14px",
      }}
    >
      <div
        className="flex items-center justify-center text-white flex-shrink-0 animate-fade-in"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-strong)))",
          animationDuration: "500ms",
        }}
      >
        <Zap style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
      </div>
      <div>
        {hasStreak ? (
          <>
            <p
              className="leading-none tabular-nums"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "18px",
                fontWeight: 800,
                color: "hsl(var(--accent-glow))",
              }}
            >
              {animatedDays} {animatedDays === 1 ? "day" : "days"}
            </p>
            <p
              className="mt-0.5"
              style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
            >
              Logging streak
            </p>
          </>
        ) : (
          <>
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--header-text-muted)",
              }}
            >
              Start a streak!
            </p>
            <p
              className="mt-0.5"
              style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
            >
              Log entries daily
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export { StreakBadge };
export type { StreakBadgeProps };
