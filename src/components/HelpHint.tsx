"use client";

import { useState, useRef } from "react";

interface HelpHintProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  createdAt?: string;
  className?: string;
}

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export function HelpHint({ text, position = "top", createdAt, className }: HelpHintProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Age check — hide after 3 months
  if (createdAt) {
    const accountAge = Date.now() - new Date(createdAt).getTime();
    if (accountAge > THREE_MONTHS_MS) return null;
  }

  // Manual dismiss check (localStorage is client-only — safe in "use client")
  if (typeof window !== "undefined" && localStorage.getItem("edlog-hints-dismissed") === "true") {
    return null;
  }

  function handleShow() {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 4000);
  }

  function handleHide() {
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <div
      className={`relative inline-flex ${className || ""}`}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (visible) { handleHide(); } else { handleShow(); }
        }}
        aria-label="Help"
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "var(--accent-soft)",
          border: "1px solid hsl(var(--accent) / 0.25)",
          color: "var(--accent-text)",
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.15s ease",
          lineHeight: 1,
        }}
      >
        !
      </button>

      {visible && (
        <div
          style={{
            position: "absolute",
            ...positionStyles[position],
            zIndex: 100,
            maxWidth: "220px",
            minWidth: "160px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "hsl(var(--surface-elevated))",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-elevated)",
            pointerEvents: "none",
            animation: "hint-fade-in 0.15s ease",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              margin: 0,
              whiteSpace: "normal",
            }}
          >
            {text}
          </p>
        </div>
      )}

      <style>{`
        @keyframes hint-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
