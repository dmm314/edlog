"use client";

import React from "react";
import { Flame } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface StreakBadgeProps {
  days: number;
  className?: string;
}

function StreakBadge({ days, className = "" }: StreakBadgeProps) {
  const animatedDays = useAnimatedCounter(days);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${className}`}
      style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
    >
      <Flame
        className="w-5 h-5 animate-spring-bounce"
        style={{ color: "var(--accent)" }}
      />
      <div>
        <p className="font-bold font-mono tabular-nums" style={{ color: "var(--accent)" }}>
          {animatedDays} days
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)]">Logging streak</p>
      </div>
    </div>
  );
}

export { StreakBadge };
export type { StreakBadgeProps };
