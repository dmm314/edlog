"use client";

import Link from "next/link";
import { Bell, BookMarked, CalendarDays, ClipboardPenLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    href: "/logbook/new",
    label: "Quick Log",
    hint: "30 sec",
    icon: ClipboardPenLine,
    pulse: true,
  },
  {
    href: "/timetable",
    label: "Today Classes",
    hint: "Schedule",
    icon: CalendarDays,
  },
  {
    href: "/messages",
    label: "Notices",
    hint: "Unread",
    icon: Bell,
  },
  {
    href: "/assessments",
    label: "Results",
    hint: "Pending",
    icon: BookMarked,
  },
];

export function QuickActionsRow() {
  return (
    <section className="-mx-4 mb-4">
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "card group min-w-[148px] snap-start p-3 motion-safe:animate-slide-up",
                action.pulse && "motion-safe:animate-live-pulse",
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent-glow)/0.28))]">
                  <Icon className="h-4 w-4 text-[hsl(var(--accent-text))]" />
                </div>
                <Sparkles className="h-3.5 w-3.5 text-content-tertiary transition-colors group-hover:text-[hsl(var(--accent-text))]" />
              </div>
              <p className="text-sm font-semibold text-content-primary">{action.label}</p>
              <p className="text-xs text-content-tertiary">{action.hint}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
