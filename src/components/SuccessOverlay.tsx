"use client";

import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface SuccessOverlayProps {
  title?: string;
  subtitle?: string;
  details?: { label: string; value: string }[];
  onDismiss: () => void;
  autoDismissMs?: number;
}

function SuccessOverlay({
  title = "Entry Logged!",
  subtitle,
  details,
  onDismiss,
  autoDismissMs = 2000,
}: SuccessOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg-primary)]"
      onClick={onDismiss}
    >
      <div className="text-center px-6 animate-scale-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-spring-bounce" style={{ backgroundColor: "var(--success-light)" }}>
          <CheckCircle className="w-10 h-10" style={{ color: "var(--success)" }} />
        </div>
        <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--text-tertiary)] mt-2">{subtitle}</p>
        )}
        {details && details.length > 0 && (
          <div className="mt-6 card p-4 text-left max-w-xs mx-auto">
            {details.map((d, i) => (
              <div
                key={i}
                className={`flex justify-between py-2 ${
                  i < details.length - 1 ? "border-b" : ""
                }`}
                style={{ borderColor: "var(--border-primary)" }}
              >
                <span className="text-xs text-[var(--text-tertiary)]">{d.label}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{d.value}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onDismiss}
          className="mt-6 btn-secondary inline-flex items-center gap-2 text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export { SuccessOverlay };
export type { SuccessOverlayProps };
