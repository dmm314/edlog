"use client";

import { Suspense } from "react";
import type { EntryWithRelations } from "@/types";
import { EntryCard } from "@/components/EntryCard";

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((id) => (
        <div key={id} className="rounded-xl border border-border-theme bg-white p-4 shadow-card">
          <div className="mb-3 h-4 w-28 rounded bg-surface-secondary animate-shimmer" />
          <div className="mb-2 h-3 w-full rounded bg-surface-secondary animate-shimmer" />
          <div className="h-3 w-4/5 rounded bg-surface-secondary animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

function FeedList({ entries }: { entries: EntryWithRelations[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      {entries.slice(0, 8).map((entry, index) => (
        <EntryCard key={entry.id} entry={entry} priority={index === 0 ? "vibrant" : "default"} />
      ))}
    </section>
  );
}

export function TeacherFeed({ entries, loading = false }: { entries: EntryWithRelations[]; loading?: boolean }) {
  if (loading) return <FeedSkeleton />;

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedList entries={entries} />
    </Suspense>
  );
}
