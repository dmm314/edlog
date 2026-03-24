/**
 * Offline Queue — Stores failed entry submissions in localStorage
 * and retries when the network is restored.
 *
 * Used for 2G/3G environments where network failures are common.
 */

const QUEUE_KEY = "edlog_offline_queue";

interface QueuedEntry {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
  retries: number;
}

/** Get all queued entries */
export function getQueuedEntries(): QueuedEntry[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** Add a failed request to the queue */
export function enqueueEntry(url: string, method: string, body: Record<string, unknown>): void {
  try {
    const queue = getQueuedEntries();
    queue.push({
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url,
      method,
      body: JSON.stringify(body),
      timestamp: Date.now(),
      retries: 0,
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full or unavailable
  }
}

/** Remove a specific entry from the queue */
export function dequeueEntry(id: string): void {
  try {
    const queue = getQueuedEntries().filter((e) => e.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

/** Process all queued entries — retry failed submissions */
export async function processQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = getQueuedEntries();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const res = await fetch(entry.url, {
        method: entry.method,
        headers: { "Content-Type": "application/json" },
        body: entry.body,
      });

      if (res.ok) {
        dequeueEntry(entry.id);
        succeeded++;
      } else if (res.status >= 400 && res.status < 500) {
        // Client error — remove from queue (won't succeed on retry)
        dequeueEntry(entry.id);
        failed++;
      } else {
        // Server error — keep in queue for retry
        entry.retries++;
        failed++;
      }
    } catch {
      // Network still down — keep in queue
      entry.retries++;
      failed++;
    }
  }

  // Update retry counts for remaining entries
  const remaining = getQueuedEntries();
  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  return { succeeded, failed };
}

/** Get count of queued entries */
export function getQueueCount(): number {
  return getQueuedEntries().length;
}

/** Listen for online events and auto-process queue */
export function setupOfflineSync(): () => void {
  const handler = () => {
    processQueue().catch(() => {});
  };

  window.addEventListener("online", handler);

  // Also process on load if we're online and have items
  if (navigator.onLine && getQueueCount() > 0) {
    // Delay slightly to let the app initialize
    setTimeout(handler, 2000);
  }

  return () => {
    window.removeEventListener("online", handler);
  };
}
