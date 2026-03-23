import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  iconBg?: string;
  iconColor?: string;
}

function StatCard({ label, value, icon: Icon, trend, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={{
            backgroundColor: iconBg || "var(--accent-soft)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor || "var(--accent-text)" }} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">{value}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{label}</p>
          {trend && (
            <p className="text-xs font-medium mt-1" style={{ color: "var(--success)" }}>{trend}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
