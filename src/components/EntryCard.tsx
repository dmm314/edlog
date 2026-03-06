import React from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { EntryWithRelations, EntryStatus } from "@/types";

interface EntryCardProps {
  entry: EntryWithRelations;
  onClick?: () => void;
}

const statusVariant: Record<EntryStatus, "success" | "info" | "warning" | "danger" | "default"> = {
  DRAFT: "default",
  SUBMITTED: "info",
  VERIFIED: "success",
  FLAGGED: "danger",
};

const statusLabel: Record<EntryStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  VERIFIED: "Verified",
  FLAGGED: "Flagged",
};

function EntryCard({ entry, onClick }: EntryCardProps) {
  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const firstTopic = entry.topics?.[0];
  const topicDisplay = firstTopic
    ? firstTopic.moduleName
      ? `${firstTopic.moduleName}: ${firstTopic.name}`
      : firstTopic.name
    : "—";
  const subjectName = firstTopic?.subject?.name ?? "—";

  return (
    <Card
      className={`${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-150" : ""}`}
    >
      <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--text-primary)] truncate">
              {subjectName}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
              {topicDisplay}
            </p>
          </div>
          <Badge variant={statusVariant[entry.status]}>
            {statusLabel[entry.status]}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-tertiary)]">
          <span>{entry.class.name}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--text-quaternary)]" />
          <span>
            {formattedDate} at {formattedTime}
          </span>
        </div>

        {entry.notes && (
          <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
            {entry.notes}
          </p>
        )}
      </div>
    </Card>
  );
}

export { EntryCard };
export type { EntryCardProps };
