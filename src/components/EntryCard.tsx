"use client";

import { useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import type { EntryWithRelations } from "@/types";

interface EntryCardProps {
  entry: EntryWithRelations;
  priority?: "default" | "vibrant";
  onOpen?: (entryId: string) => void;
}

function formatAgo(date: string | Date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(1, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function EntryCard({ entry, priority = "default", onOpen }: EntryCardProps) {
  const [liked, setLiked] = useState(false);
  const isInteractive = Boolean(onOpen);
  const [heartBurst, setHeartBurst] = useState(false);

  const meta = useMemo(() => {
    const topic = entry.topics?.[0];
    const subjectName = topic?.subject?.name ?? "General";
    const className = entry.class?.name ?? "Class";
    const topicText = topic?.moduleName ? `${topic.moduleName}: ${topic.name}` : topic?.name ?? "Lesson notes";
    return { subjectName, className, topicText };
  }, [entry]);

  const triggerLike = () => {
    setLiked((prev) => !prev);
    setHeartBurst(true);
    window.setTimeout(() => setHeartBurst(false), 380);
  };

  return (
  <article
      className={`relative overflow-hidden rounded-xl border border-border-theme bg-white p-4 shadow-card transition-transform duration-200 ${isInteractive ? "active:scale-[0.99] cursor-pointer" : ""} ${priority === "vibrant" ? "ring-1 ring-accent/30" : ""}`}
      onDoubleClick={triggerLike}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={() => onOpen?.(entry.id)}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(entry.id);
        }
      }}
    >
      {heartBurst && (
        <Heart className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 fill-red-500 text-red-500 animate-spring-bounce" />
      )}

        <header className="mb-3 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#1877F2] to-[#0866FF] text-xs font-bold text-white shadow-accent">
          {getInitials(meta.subjectName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-primary">{meta.subjectName}</p>
          <p className="truncate text-xs text-content-secondary">{meta.className} • {formatAgo(entry.createdAt)}</p>
        </div>
      </header>

      <div className="space-y-2">
        <p className="line-clamp-2 text-sm font-semibold text-content-primary">{meta.topicText}</p>
        {entry.notes && <p className="line-clamp-3 text-sm text-content-secondary">{entry.notes}</p>}
      </div>
    <footer className="mt-4 border-t border-border-theme pt-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-content-secondary">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              triggerLike();
            }}
            className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-full transition ${liked ? "bg-[#E7F3FF] text-[#0866FF]" : "hover:bg-surface-secondary"}`}
          >
            {liked ? <Heart className="h-4 w-4 fill-current" /> : <ThumbsUp className="h-4 w-4" />} React
          </button>
          <button type="button" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full hover:bg-surface-secondary">
            <MessageCircle className="h-4 w-4" /> Note
          </button>
          <button type="button" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full hover:bg-surface-secondary">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </footer>
    </article>
  );
}

export type { EntryCardProps };
