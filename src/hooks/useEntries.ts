"use client";

import { useState, useEffect, useCallback } from "react";
import type { EntryWithRelations } from "@/types";

interface UseEntriesOptions {
  from?: string;
  to?: string;
  subjectId?: string;
  classId?: string;
  search?: string;
  limit?: number;
}

export function useEntries(options: UseEntriesOptions = {}) {
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchEntries = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) setLoading(true);

        const params = new URLSearchParams();
        if (options.from) params.set("from", options.from);
        if (options.to) params.set("to", options.to);
        if (options.subjectId) params.set("subjectId", options.subjectId);
        if (options.classId) params.set("classId", options.classId);
        if (options.search) params.set("search", options.search);
        params.set("limit", String(options.limit || 20));
        params.set("offset", String(loadMore ? offset : 0));

        const res = await fetch(`/api/entries?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch entries");

        const data = await res.json();

        if (loadMore) {
          setEntries((prev) => [...prev, ...data.entries]);
        } else {
          setEntries(data.entries);
        }
        setTotal(data.total);
        setOffset(loadMore ? offset + (options.limit || 20) : options.limit || 20);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entries");
      } finally {
        setLoading(false);
      }
    },
    [options.from, options.to, options.subjectId, options.classId, options.search, options.limit, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchEntries(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.from, options.to, options.subjectId, options.classId, options.search]);

  const loadMore = () => fetchEntries(true);
  const hasMore = entries.length < total;

  return { entries, total, loading, error, loadMore, hasMore, refetch: () => fetchEntries(false) };
}
