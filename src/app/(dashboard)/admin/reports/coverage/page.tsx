"use client";

import React, { useState, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ReportStatCards, type StatCard } from "@/components/ReportStatCards";
import type { DataTablePagination } from "@/hooks/useDataTable";

interface CoverageRow {
  id: string;
  subject: string;
  level: string;
  moduleNum: number | null;
  moduleName: string;
  topic: string;
  orderIndex: number;
  taughtBy: string;
  timesCovered: number;
  lastTaught: string | null;
  covered: boolean;
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
    filterable: true,
    hideOnMobile: true,
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
    key: "taughtBy",
    label: "Taught By",
    hideOnMobile: true,
    render: (value) => {
      const str = String(value || "");
      return str === "—" ? (
        <span style={{ color: "var(--text-quaternary)" }}>—</span>
      ) : (
        str
      );
    },
  },
  {
    key: "timesCovered",
    label: "Times Covered",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "lastTaught",
    label: "Last Taught",
    type: "date",
    sortable: true,
    hideOnMobile: true,
  },
  {
    key: "covered",
    label: "Status",
    filterable: true,
    filterKey: "covered",
    filterOptions: ["all", "covered", "gaps"],
    render: (_value, row) => {
      if (row.covered) {
        return <Badge variant="verified">Covered</Badge>;
      }
      return <Badge variant="draft">Not Yet</Badge>;
    },
  },
];

export default function CoverageReportPage() {
  const [stats, setStats] = useState<StatCard[]>([]);

  const handleDataLoad = useCallback((data: CoverageRow[], pagination: DataTablePagination) => {
    const total = pagination.total;
    const covered = data.filter((r) => r.covered).length;
    const gaps = data.length - covered;
    const rate = data.length > 0 ? Math.round((covered / data.length) * 100) : 0;
    setStats([
      { label: "Total Topics", value: total },
      { label: "Covered", value: covered },
      { label: "Gaps", value: gaps },
      { label: "Coverage %", value: `${rate}%` },
    ]);
  }, []);

  return (
    <div>
      {stats.length > 0 && <ReportStatCards stats={stats} />}
      <DataTable<CoverageRow>
        columns={columns}
        endpoint="/api/admin/reports/coverage"
        title="Curriculum Coverage"
        description="National syllabus topics and whether they've been taught."
        searchPlaceholder="Search topics or modules..."
        defaultSort="subject"
        defaultOrder="asc"
        exportFilename="coverage-report"
        emptyTitle="No topics found"
        emptyDescription="No curriculum topics match your current filters."
        onDataLoad={handleDataLoad}
      />
    </div>
  );
}
