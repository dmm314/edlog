"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "hsl(var(--surface-canvas))" }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-xs font-mono mb-4" style={{ color: "var(--text-quaternary)" }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
            style={{
              background: "var(--accent)",
              color: "white",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-[0.97]"
            style={{
              background: "hsl(var(--surface-elevated))",
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)",
            }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
