"use client";

import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface StreakBadgeProps {
  days: number;
  className?: string;
}

function StreakBadge({ days, className = "" }: StreakBadgeProps) {
  const animatedDays = useAnimatedCounter(days);
  const [iconReady, setIconReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIconReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`rounded-2xl px-3.5 py-3 border flex items-center gap-2.5 ${className}`}
      style={{
        background: "var(--header-accent)",
        borderColor: "rgba(245, 158, 11, 0.12)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          transform: iconReady ? "scale(1)" : "scale(0.5)",
          opacity: iconReady ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <Zap className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div>
        <p
          className="text-lg font-extrabold leading-none tabular-nums"
          style={{ color: "var(--accent-warm, #FBBF24)" }}
        >
          {animatedDays} {animatedDays === 1 ? "day" : "days"}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Logging streak
        </p>
      </div>
    </div>
  );
}

export { StreakBadge };
export type { StreakBadgeProps };
