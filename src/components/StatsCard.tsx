import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

function StatsCard({ label, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
          <Icon className="h-5 w-5 text-brand-700" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-brand-950">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          {trend && (
            <p className="text-xs font-medium text-green-600 mt-1">{trend}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { StatsCard };
export type { StatsCardProps };
