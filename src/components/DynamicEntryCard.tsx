"use client";

import type { CSSProperties, MouseEventHandler, PointerEventHandler } from "react";
import { useMemo, useState } from "react";
import { CheckCheck, CircleAlert, Clock3, Heart, MessageSquareText, Sparkles } from "lucide-react";
import type { EntryStatus, EntryWithRelations } from "@/types";
import { formatDateShort, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DynamicEntryCardProps {
  entry: EntryWithRelations;
  priority?: "default" | "live" | "calm";
  onClick?: () => void;
}

const statusConfig: Record<
  EntryStatus,
  {
    label: string;
    icon: typeof Sparkles;
    shift: number;
    chipClass: string;
    description: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    icon: Clock3,
    shift: -12,
    chipClass: "badge-draft",
    description: "Still refining this lesson.",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Sparkles,
    shift: 0,
    chipClass: "badge-submitted",
    description: "Submitted and ready for review.",
  },
  VERIFIED: {
    label: "Verified",
    icon: CheckCheck,
    shift: 12,
    chipClass: "badge-verified",
    description: "Verified and safely in the record.",
  },
  FLAGGED: {
    label: "Flagged",
    icon: CircleAlert,
    shift: -15,
    chipClass: "badge-flagged",
    description: "Needs a quick correction.",
  },
};

export function DynamicEntryCard({ entry, priority = "default", onClick }: DynamicEntryCardProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [liked, setLiked] = useState(false);
  const status = statusConfig[entry.status];

  const topic = entry.topics?.[0]?.name || entry.topicText || "Topic to review";
  const moduleName = entry.topics?.[0]?.moduleName || entry.moduleName || "Teaching log";
  const subjectName = entry.topics?.[0]?.subject?.name || entry.assignment?.subject?.name || "Subject";
  const timestamp = useMemo(() => `${formatDateShort(entry.date)} • ${formatTime(entry.date)}`, [entry.date]);
  const accentShift = priority === "live" ? status.shift + 6 : status.shift;

  const spawnRipple = (clientX: number, clientY: number, rect: DOMRect) => {
    const id = Date.now() + Math.random();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setRipples((current) => [...current, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 700);
  };

  const handleDoubleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    spawnRipple(event.clientX, event.clientY, rect);
    setLiked(true);
  };

  const handlePointerDown: PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.pointerType === "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      spawnRipple(event.clientX, event.clientY, rect);
    }
  };

  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      className={cn(
        "card group w-full p-0 text-left",
        priority === "live" && "live-card",
        priority === "calm" && "opacity-90",
      )}
      style={{ ["--accent-status-shift" as string]: accentShift } as CSSProperties}
    >
      <div className="relative overflow-hidden rounded-[inherit] p-4">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-[3px] rounded-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--accent-strong)),transparent)] opacity-80" />
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute h-40 w-40 animate-ripple rounded-full bg-[hsl(var(--accent-glow)/0.24)]"
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}

        <div className="relative z-10 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent-glow)/0.28))] shadow-accent">
            <StatusIcon className="h-5 w-5 text-[hsl(var(--accent-text))]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-content-secondary">{subjectName}</p>
                <h3 className="mt-0.5 line-clamp-2 text-base font-bold text-content-primary">{topic}</h3>
              </div>
              <span className={status.chipClass}>{status.label}</span>
            </div>

            <p className="mt-2 line-clamp-1 text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">
              {moduleName}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-content-secondary">{entry.notes || status.description}</p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-[hsl(var(--border-muted))] pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-content-tertiary">{entry.class.name}</p>
            <p className="animate-live-update font-mono text-[11px] text-[hsl(var(--accent-text))]">{timestamp}</p>
          </div>

          <div className="flex items-center gap-2 text-content-tertiary">
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--surface-secondary))] px-2.5 py-1 text-[11px] font-semibold">
              <MessageSquareText className="h-3.5 w-3.5" />
              {entry.notes ? "Notes" : "Tap to add"}
            </span>
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                liked ? "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] shadow-accent" : "bg-[hsl(var(--surface-secondary))] text-content-tertiary",
              )}
              aria-hidden="true"
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export type { DynamicEntryCardProps };
