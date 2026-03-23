"use client";

import { cn } from "@/lib/utils";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";

interface ModeSwitcherProps {
  activeMode: PortalMode;
  switchMode: (mode: PortalMode) => void;
}

export function ModeSwitcher({ activeMode, switchMode }: ModeSwitcherProps) {
  return (
    <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] px-4 lg:hidden">
      <div className="mx-auto grid h-10 max-w-[640px] grid-cols-2 gap-1 rounded-lg bg-[hsl(var(--surface-tertiary))] p-1">
        <button
          onClick={() => switchMode("teacher")}
          className={cn(
            "rounded-md text-sm font-semibold transition-colors",
            activeMode === "teacher"
              ? "bg-accent text-white"
              : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]",
          )}
        >
          Teacher
        </button>
        <button
          onClick={() => switchMode("coordinator")}
          className={cn(
            "rounded-md text-sm font-semibold transition-colors",
            activeMode === "coordinator"
              ? "bg-accent text-white"
              : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]",
          )}
        >
          VP
        </button>
      </div>
    </div>
  );
}
