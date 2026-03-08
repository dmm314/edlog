"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";

export interface DataTablePagination {
  total: number;
  limit: number;
  cursor: string | null;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DataTableResponse<T = Record<string, unknown>> {
  data: T[];
  pagination: DataTablePagination;
  filters: Record<string, string[]>;
}

export interface UseDataTableResult<T = Record<string, unknown>> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: DataTablePagination;
  filters: Record<string, string[]>;
  refetch: () => void;
}

export function useDataTable<T = Record<string, unknown>>(
  endpoint: string
): UseDataTableResult<T> {
  const searchParams = useSearchParams();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DataTablePagination>({
    total: 0,
    limit: 25,
    cursor: null,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const paramString = searchParams.toString();
      const separator = endpoint.includes("?") ? "&" : "?";
      const url = paramString
        ? `${endpoint}${separator}${paramString}`
        : endpoint;

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`Failed to fetch data (${res.status})`);
      }

      const json: DataTableResponse<T> = await res.json();

      setData(json.data);
      setPagination(json.pagination);
      setFilters(json.filters || {});
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [endpoint, searchParams]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, pagination, filters, refetch: fetchData };
}
