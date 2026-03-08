import React from "react";

export interface StatCard {
  label: string;
  value: string | number;
}

export function ReportStatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            flex: "1 0 0",
            minWidth: 100,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {stat.value}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              margin: "4px 0 0",
            }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
