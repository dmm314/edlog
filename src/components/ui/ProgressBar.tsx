import React from "react";

interface ProgressBarProps {
  value: number;
  variant?: "amber" | "green" | "red";
  className?: string;
  animated?: boolean;
}

function ProgressBar({ value, variant = "amber", className = "", animated = true }: ProgressBarProps) {
  const fillClass = variant === "green" ? "progress-green" : variant === "red" ? "progress-red" : "progress-amber";

  return (
    <div className={`progress-bar ${className}`}>
      <div
        className={`progress-bar-fill ${fillClass} ${animated ? "animate-progress-fill" : ""}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
