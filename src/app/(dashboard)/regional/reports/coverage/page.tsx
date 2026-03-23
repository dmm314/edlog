"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { ReportStatCards, type StatCard } from "@/components/ReportStatCards";

interface CoverageRow {
  id: string;
  subject: string;
  subjectCode: string;
  level: string;
  moduleNum: number | null;
  moduleName: string;
  topic: string;
  orderIndex: number;
  schoolsCovering: number;
  totalSchools: number;
  coverageRate: number;
  totalEntries: number;
  teachersCovering: number;
  lastTaught: string | null;
}

function CoverageCell({ row }: { row: CoverageRow }) {
  const { schoolsCovering, totalSchools, coverageRate } = row;
  let barColor = "hsl(var(--danger))"; // red
  if (coverageRate >= 80) barColor = "hsl(var(--success))"; // green
  else if (coverageRate >= 50) barColor = "hsl(var(--accent))"; // amber

  let textColor = "hsl(var(--danger))";
  if (coverageRate >= 80) textColor = "hsl(var(--success))";
  else if (coverageRate >= 50) textColor = "hsl(var(--accent-text))";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          color: textColor,
        }}
      >
        {schoolsCovering}/{totalSchools}
      </span>
      <div
        style={{
          width: 64,
          height: 4,
          borderRadius: 9999,
          background: "hsl(var(--surface-tertiary))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(coverageRate, 100)}%`,
            height: "100%",
            borderRadius: 9999,
            background: barColor,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

const columns: ColumnDef<CoverageRow>[] = [
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    filterable: true,
  },
  {
    key: "level",
    label: "Level",
    sortable: true,
    filterable: true,
  },
  {
    key: "moduleName",
    label: "Module",
    sortable: true,
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "topic",
    label: "Topic",
    sortable: true,
    searchable: true,
  },
  {
    key: "coverageRate",
    label: "Coverage",
    sortable: true,
    align: "center",
    render: (_value, row) => <CoverageCell row={row} />,
  },
  {
    key: "totalEntries",
    label: "Total Entries",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
  },
  {
    key: "teachersCovering",
    label: "Teachers",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
  },
  {
    key: "lastTaught",
    label: "Last Taught",
    type: "date",
    sortable: true,
  },
];

export default function RegionalCoverageReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<StatCard[]>([]);

  const showGapsOnly = searchParams.get("filter[covered]") === "gaps";

  const toggleGaps = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showGapsOnly) {
      params.delete("filter[covered]");
    } else {
      params.set("filter[covered]", "gaps");
      params.delete("cursor"); // reset pagination
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDataLoad = useCallback((data: CoverageRow[]) => {
    const total = data.length;
    const fullyCovered = data.filter((r) => r.coverageRate === 100).length;
    const partial = data.filter((r) => r.coverageRate > 0 && r.coverageRate < 100).length;
    const notCovered = data.filter((r) => r.coverageRate === 0).length;
    setStats([
      { label: "Total Topics", value: total },
      { label: "Fully Covered", value: fullyCovered },
      { label: "Partial", value: partial },
      { label: "Not Covered", value: notCovered },
    ]);
  }, []);

  return (
    <div>
      {stats.length > 0 && <ReportStatCards stats={stats} />}

      {/* Gaps toggle */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={toggleGaps}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 12,
            border: showGapsOnly
              ? "1px solid var(--accent)"
              : "1px solid var(--border-primary)",
            background: showGapsOnly
              ? "var(--accent-soft)"
              : "hsl(var(--surface-tertiary))",
            color: showGapsOnly
              ? "var(--accent-text)"
              : "var(--text-secondary)",
            cursor: "pointer",
            transition: "all var(--transition-fast) ease",
          }}
        >
          <AlertTriangle size={14} />
          Show gaps only
          {showGapsOnly && <X size={14} />}
        </button>
      </div>

      <DataTable<CoverageRow>
        columns={columns}
        endpoint="/api/regional/reports/coverage"
        title="Curriculum Coverage"
        description="National syllabus topics with regional coverage data across all schools."
        searchPlaceholder="Search topics or modules..."
        defaultSort="subject"
        defaultOrder="asc"
        exportFilename="regional-coverage-report"
        emptyTitle="No curriculum topics found"
        emptyDescription="Try selecting a different subject or level."
        onDataLoad={handleDataLoad}
      />
    </div>
  );
}
