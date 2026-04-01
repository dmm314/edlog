"use client";

import { useMemo } from "react";
import { CheckCheck, CircleAlert, Clock3, MessageSquareText, Sparkles } from "lucide-react";
import type { EntryStatus, EntryWithRelations } from "@/types";
import { formatDateShort, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EntryCardProps {
  entry: EntryWithRelations;
  priority?: "default" | "live" | "calm";
  onClick?: () => void;
}

const statusConfig: Record<
  EntryStatus,
  {
    label: string;
    icon: typeof Sparkles;
    chipClass: string;
    description: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    icon: Clock3,
    chipClass: "badge-draft",
    description: "Still refining this lesson.",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Sparkles,
    chipClass: "badge-submitted",
    description: "Submitted and ready for review.",
  },
  VERIFIED: {
    label: "Verified",
    icon: CheckCheck,
    chipClass: "badge-verified",
    description: "Verified and safely in the record.",
  },
  FLAGGED: {
    label: "Flagged",
    icon: CircleAlert,
    chipClass: "badge-flagged",
    description: "Needs a quick correction.",
  },
};

export function EntryCard({ entry, priority = "default", onClick }: EntryCardProps) {
  const status = statusConfig[entry.status];

  const topic = entry.topics?.[0]?.name || entry.topicText || "Topic to review";
  const moduleName = entry.topics?.[0]?.moduleName || entry.moduleName || "Teaching log";
  const subjectName = entry.topics?.[0]?.subject?.name || entry.assignment?.subject?.name || "Subject";
  const timestamp = useMemo(() => `${formatDateShort(entry.date)} • ${formatTime(entry.date)}`, [entry.date]);

  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "feed-item w-full rounded-xl border bg-[hsl(var(--surface-elevated))] p-4 text-left shadow-card transition-shadow hover:shadow-elevated",
        priority === "live" && "border-[hsl(var(--accent)/0.3)]",
        priority !== "live" && "border-[hsl(var(--border-primary))]",
        priority === "calm" && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            entry.status === "VERIFIED" && "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
            entry.status === "FLAGGED" && "bg-[hsl(var(--danger)/0.08)] text-[hsl(var(--danger))]",
            entry.status === "SUBMITTED" && "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]",
            entry.status === "DRAFT" && "bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--text-tertiary))]",
          )}
        >
          <StatusIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-content-secondary">{subjectName}</p>
              <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-content-primary">{topic}</h3>
            </div>
            <span className={status.chipClass}>{status.label}</span>
          </div>

          <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[hsl(var(--accent-text))]">
            {moduleName}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm text-content-secondary">{entry.notes || status.description}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[hsl(var(--border-muted))] pt-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-content-tertiary">{entry.class.name}</p>
          <p className="font-mono text-[11px] text-content-tertiary">{timestamp}</p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--surface-tertiary))] px-2 py-0.5 text-[11px] font-medium text-content-tertiary">
          <MessageSquareText className="h-3 w-3" />
          {entry.notes ? "Notes" : "No notes"}
        </span>
      </div>
    </button>
  );
}

export type { EntryCardProps };
