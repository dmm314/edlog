"use client";

import Link from "next/link";
import { ArrowRight, BellRing, CalendarRange, ClipboardPenLine, Sparkles, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsRowProps {
  pendingCount: number;
  upcomingLabel?: string | null;
}

const quickActions = [
  {
    href: "/logbook/new",
    label: "Log now",
    caption: "Open the composer instantly",
    icon: ClipboardPenLine,
    pulse: true,
  },
  {
    href: "/timetable",
    label: "Timetable",
    caption: "Tap into every lesson block",
    icon: CalendarRange,
  },
  {
    href: "/history",
    label: "Catch up",
    caption: "Finish pending entries fast",
    icon: TimerReset,
  },
  {
    href: "/notifications",
    label: "Notices",
    caption: "See what just changed",
    icon: BellRing,
  },
];

export function QuickActionsRow({ pendingCount, upcomingLabel }: QuickActionsRowProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-tertiary">One next move</p>
          <h2 className="text-lg font-bold text-content-primary">Quick actions</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent-soft))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--accent-text))] shadow-card motion-safe:animate-live-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          {pendingCount > 0 ? `${pendingCount} waiting` : "All clear"}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-3 pr-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "card min-w-[220px] flex-1 p-4 motion-safe:animate-slide-up",
                  action.pulse && "motion-safe:animate-live-pulse",
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent-glow)/0.32))] shadow-card">
                    <Icon className="h-5 w-5 text-[hsl(var(--accent-text))]" />
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-content-tertiary transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="mt-5 space-y-1">
                  <h3 className="text-sm font-bold text-content-primary">{action.label}</h3>
                  <p className="text-sm text-content-secondary">{action.caption}</p>
                  {action.href === "/timetable" && upcomingLabel ? (
                    <p className="font-mono text-[11px] text-[hsl(var(--accent-text))]">{upcomingLabel}</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type { QuickActionsRowProps };
