"use client";

import React, { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number;
  color?: "green" | "amber" | "red";
  animated?: boolean;
  className?: string;
}

function ProgressBar({ value, color = "amber", animated = true, className = "" }: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : value);
  const clampedValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    if (animated) {
      // Trigger animation on mount
      const raf = requestAnimationFrame(() => {
        setWidth(clampedValue);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setWidth(clampedValue);
    }
  }, [clampedValue, animated]);

  const fillClass =
    color === "green" ? "progress-green" :
    color === "red" ? "progress-red" :
    "progress-amber";

  return (
    <div className={`progress-bar ${className}`}>
      <div
        className={`progress-bar-fill ${fillClass}`}
        style={{
          width: `${width}%`,
          transition: animated ? "width 800ms var(--ease-spring)" : "none",
        }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
