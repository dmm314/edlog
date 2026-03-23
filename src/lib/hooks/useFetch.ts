/**
 * useFetch — Custom SWR-like data fetching hook.
 *
 * Purpose-built for Edlog's patterns:
 * - Stale-while-revalidate caching
 * - Request deduplication
 * - Retry with exponential backoff (critical for 2G/3G)
 * - Optimistic updates for mutations
 * - ~2KB vs SWR's ~4KB or React Query's ~13KB
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Cache ────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isValidating: boolean;
}

const cache = new Map<string, CacheEntry<unknown>>();
const STALE_TIME = 30_000; // 30 seconds before data is considered stale
const CACHE_TIME = 5 * 60_000; // 5 minutes before cache entry is deleted

// Deduplication: in-flight requests
const inflightRequests = new Map<string, Promise<unknown>>();

// ── Types ────────────────────────────────────────────────

interface UseFetchOptions<T> {
  /** Skip fetching (e.g., when dependencies aren't ready) */
  enabled?: boolean;
  /** Time in ms before cached data is considered stale. Default: 30s */
  staleTime?: number;
  /** Number of retry attempts on failure. Default: 3 */
  retryCount?: number;
  /** Initial data to use before first fetch */
  initialData?: T;
  /** Called when data changes */
  onSuccess?: (data: T) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

interface UseFetchReturn<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | ((prev: T | undefined) => T)) => void;
  refetch: () => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────

export function useFetch<T = unknown>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const {
    enabled = true,
    staleTime = STALE_TIME,
    retryCount = 3,
    initialData,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(() => {
    if (initialData !== undefined) return initialData;
    if (url) {
      const cached = cache.get(url) as CacheEntry<T> | undefined;
      if (cached) return cached.data;
    }
    return undefined;
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!data && enabled && !!url);
  const [isValidating, setIsValidating] = useState(false);

  const mountedRef = useRef(true);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const fetchData = useCallback(
    async (isRevalidation = false) => {
      if (!url || !enabled) return;

      // Check cache freshness
      const cached = cache.get(url) as CacheEntry<T> | undefined;
      if (cached && !isRevalidation) {
        const age = Date.now() - cached.timestamp;
        if (age < staleTime) {
          // Data is fresh, use it
          if (mountedRef.current) {
            setData(cached.data);
            setIsLoading(false);
          }
          return;
        }
        // Data is stale, show it but revalidate in background
        if (mountedRef.current) {
          setData(cached.data);
          setIsLoading(false);
        }
      }

      if (mountedRef.current) {
        setIsValidating(true);
        if (!cached) setIsLoading(true);
      }

      // Request deduplication
      let fetchPromise = inflightRequests.get(url) as Promise<T> | undefined;
      if (!fetchPromise) {
        fetchPromise = fetchWithRetry<T>(url, retryCount);
        inflightRequests.set(url, fetchPromise);
      }

      try {
        const result = await fetchPromise;

        // Update cache
        cache.set(url, {
          data: result,
          timestamp: Date.now(),
          isValidating: false,
        });

        if (mountedRef.current) {
          setData(result);
          setError(null);
          setIsLoading(false);
          setIsValidating(false);
          onSuccessRef.current?.(result);
        }
      } catch (err) {
        const fetchError =
          err instanceof Error ? err : new Error("Failed to fetch");
        if (mountedRef.current) {
          setError(fetchError);
          setIsLoading(false);
          setIsValidating(false);
          onErrorRef.current?.(fetchError);
        }
      } finally {
        inflightRequests.delete(url);
      }
    },
    [url, enabled, staleTime, retryCount]
  );

  // Optimistic update / manual cache mutation
  const mutate = useCallback(
    (newData?: T | ((prev: T | undefined) => T)) => {
      if (newData === undefined) {
        // Trigger revalidation
        fetchData(true);
        return;
      }

      const resolved =
        typeof newData === "function"
          ? (newData as (prev: T | undefined) => T)(data)
          : newData;

      setData(resolved);

      if (url) {
        cache.set(url, {
          data: resolved,
          timestamp: Date.now(),
          isValidating: false,
        });
      }
    },
    [data, fetchData, url]
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cache cleanup on unmount
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Array.from(cache.entries()).forEach(([key, entry]) => {
        if (now - entry.timestamp > CACHE_TIME) {
          cache.delete(key);
        }
      });
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refetch: () => fetchData(true),
  };
}

// ── Fetch with Retry ─────────────────────────────────────

async function fetchWithRetry<T>(url: string, maxRetries: number): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Fetch failed");

      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes("HTTP 4")) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

// ── useMutation Hook ─────────────────────────────────────

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  reset: () => void;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        options.onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const mutationError =
          err instanceof Error ? err : new Error("Mutation failed");
        setError(mutationError);
        options.onError?.(mutationError, variables);
        throw mutationError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, data, error, isLoading, reset };
}

// ── Cache Invalidation Helper ────────────────────────────

/**
 * Invalidate cache entries matching a URL prefix.
 * Useful after mutations to force refetch of related data.
 *
 * Example: invalidateCache('/api/entries') clears all entry-related cache
 */
export function invalidateCache(urlPrefix: string) {
  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  });
}
