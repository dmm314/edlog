"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { PortalMode } from "@/contexts/CoordinatorModeContext";
import { useNavConfig } from "@/hooks/useNavConfig";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: string;
  isCoordinator?: boolean;
  activeMode?: PortalMode;
}

function BottomNav({ role, isCoordinator, activeMode }: BottomNavProps) {
  const tabs = useNavConfig(role, isCoordinator, activeMode);

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "mx-auto grid h-16 max-w-[640px] items-center px-2",
          tabs.length === 4 ? "grid-cols-4" : "grid-cols-5",
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          /* Center highlight button (New Entry) */
          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1"
                aria-label={tab.label}
                data-tour={tab.dataTour}
              >
                <span className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white active:scale-95">
                  <Plus className="h-4 w-4" /> New
                </span>
              </Link>
            );
          }

          /* Regular nav tab */
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              data-tour={tab.dataTour}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] font-medium active:scale-95",
                tab.isActive
                  ? "text-[hsl(var(--accent))]"
                  : "text-[hsl(var(--text-tertiary))]",
              )}
            >
              <Icon className="h-[20px] w-[20px]" />
              <span className={cn("font-semibold", tab.isActive && "font-bold")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
