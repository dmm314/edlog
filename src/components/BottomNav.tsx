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
      className="fixed bottom-0 left-0 z-50 w-full pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main navigation"
    >
      {/* Frosted glass bar */}
      <div className="border-t border-white/10 bg-[hsl(var(--surface-elevated)/0.72)] backdrop-blur-xl backdrop-saturate-150">
        <div
          className={cn(
            "mx-auto grid h-16 max-w-[640px] items-center",
            tabs.length === 4 ? "grid-cols-4" : "grid-cols-5",
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            /* Center highlight button (New Entry) - teacher only */
            if (tab.highlight) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center"
                  aria-label={tab.label}
                  data-tour={tab.dataTour}
                >
                  <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[hsl(var(--accent))] px-5 text-xs font-semibold text-white shadow-lg shadow-[hsl(var(--accent)/0.3)] transition-transform duration-150 active:scale-[0.92]">
                    <Plus className="h-4 w-4" />
                    New
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
                  "group relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors duration-200",
                  tab.isActive
                    ? "text-[hsl(var(--accent))]"
                    : "text-[hsl(var(--text-tertiary)/0.6)] hover:text-[hsl(var(--text-tertiary))]",
                )}
              >
                {/* Active dot indicator */}
                <span
                  className={cn(
                    "absolute top-1 h-1 w-1 rounded-full bg-[hsl(var(--accent))] transition-all duration-300",
                    tab.isActive
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0",
                  )}
                />

                <Icon
                  className={cn(
                    "h-[20px] w-[20px] transition-all duration-200",
                    tab.isActive && "drop-shadow-[0_0_6px_hsl(var(--accent)/0.4)]",
                  )}
                  strokeWidth={tab.isActive ? 2.5 : 1.75}
                />

                <span
                  className={cn(
                    "text-[10px] transition-all duration-200",
                    tab.isActive ? "font-bold" : "font-medium",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
