"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/reports/teachers", label: "Teachers" },
  { href: "/admin/reports/assignments", label: "Assignments" },
  { href: "/admin/reports/activity", label: "Teaching Activity" },
  { href: "/admin/reports/coverage", label: "Curriculum Coverage" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "24px 16px 0" }}>
        <h1
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Reports
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--text-tertiary)",
            margin: "4px 0 0",
          }}
        >
          Live data across your school — updates automatically.
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          padding: "16px 16px 0",
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid var(--border-primary)",
            minWidth: "max-content",
          }}
        >
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");

            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? "var(--accent-text)" : "var(--text-tertiary)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color var(--transition-fast) ease, border-color var(--transition-fast) ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}
