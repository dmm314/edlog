"use client";

import Link from "next/link";
import { Bell, BookMarked, CalendarDays, ClipboardPenLine, Sparkles } from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/logbook/new", label: "Quick Log", hint: "30 sec", icon: ClipboardPenLine, ring: "from-[#0866FF] to-[#6EA8FF]" },
  { href: "/timetable", label: "Today Classes", hint: "Schedule", icon: CalendarDays, ring: "from-[#00A884] to-[#52D6B8]" },
  { href: "/messages", label: "Notices", hint: "Unread", icon: Bell, ring: "from-[#8B5CF6] to-[#C4B5FD]" },
  { href: "/assessments", label: "Results", hint: "Pending", icon: BookMarked, ring: "from-[#F59E0B] to-[#FCD34D]" },
];

export function QuickActionsRow() {
  return (
    <section className="-mx-4 mb-4">
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group min-w-[148px] snap-start rounded-xl border border-border-theme bg-white p-3 shadow-card transition hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${action.ring} p-[2px]`}>
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-content-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-content-tertiary transition group-hover:text-[#0866FF]" />
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
