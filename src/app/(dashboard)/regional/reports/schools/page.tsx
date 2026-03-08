"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { ReportStatCards, type StatCard } from "@/components/ReportStatCards";
import type { DataTablePagination } from "@/hooks/useDataTable";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  principalName: string;
  status: string;
  division: string;
  teacherCount: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  complianceRate: number;
}

const columns: ColumnDef<SchoolRow>[] = [
  {
    key: "name",
    label: "School Name",
    sortable: true,
    searchable: true,
  },
  {
    key: "code",
    label: "Code",
    hideOnMobile: true,
  },
  {
    key: "division",
    label: "Division",
    sortable: true,
    filterable: true,
  },
  {
    key: "schoolType",
    label: "Type",
    filterable: true,
    filterKey: "type",
    hideOnMobile: true,
  },
  {
    key: "principalName",
    label: "Principal",
    hideOnMobile: true,
  },
  {
    key: "teacherCount",
    label: "Teachers",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "entriesThisWeek",
    label: "This Week",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
  },
  {
    key: "entriesThisMonth",
    label: "This Month",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "complianceRate",
    label: "Compliance",
    sortable: true,
    align: "center",
    render: (value) => {
      const rate = Number(value ?? 0);
      let color = "#DC2626"; // red
      if (rate >= 80) color = "#16A34A"; // green
      else if (rate >= 50) color = "#F59E0B"; // amber
      return (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color }}>
          {rate}%
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
  },
];

export default function SchoolsReportPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>([]);

  const handleDataLoad = useCallback((data: SchoolRow[], pagination: DataTablePagination) => {
    const totalSchools = pagination.total;
    const totalTeachers = data.reduce((sum, s) => sum + s.teacherCount, 0);
    const avgCompliance = data.length > 0
      ? Math.round(data.reduce((sum, s) => sum + s.complianceRate, 0) / data.length)
      : 0;
    const entriesMonth = data.reduce((sum, s) => sum + s.entriesThisMonth, 0);
    setStats([
      { label: "Total Schools", value: totalSchools },
      { label: "Total Teachers", value: totalTeachers },
      { label: "Avg Compliance", value: `${avgCompliance}%` },
      { label: "Entries This Month", value: entriesMonth },
    ]);
  }, []);

  return (
    <div>
      {stats.length > 0 && <ReportStatCards stats={stats} />}
      <DataTable<SchoolRow>
        columns={columns}
        endpoint="/api/regional/reports/schools"
        title="Schools"
        description="All schools in your region with compliance data."
        searchPlaceholder="Search by school name, code, or principal..."
        defaultSort="complianceRate"
        defaultOrder="asc"
        exportFilename="regional-schools-report"
        emptyTitle="No schools found"
        emptyDescription="No schools match your current filters."
        onRowClick={(row) => router.push(`/regional/schools/${row.id}`)}
        onDataLoad={handleDataLoad}
      />
    </div>
  );
}
