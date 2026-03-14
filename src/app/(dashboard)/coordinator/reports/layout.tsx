"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const tabs = [
  { href: "/coordinator/reports/entries", label: "Entries" },
  { href: "/coordinator/reports/teachers", label: "Teachers" },
  { href: "/coordinator/reports/activity", label: "Teaching Activity" },
];

export default function CoordinatorReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Reports Portal</h1>
          <p className="text-white/60 text-sm mt-0.5">Data scoped to your assigned level(s)</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 px-5 pt-3 pb-0 max-w-lg mx-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div
          className="flex gap-1 overflow-x-auto scrollbar-hide"
          style={{ borderBottom: "1px solid var(--border-primary)" }}
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? "var(--accent-text)" : "var(--text-tertiary)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-4 max-w-lg mx-auto">{children}</div>
    </div>
  );
}
