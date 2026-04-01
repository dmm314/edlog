"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { ReportStatCards, type StatCard } from "@/components/ReportStatCards";
import type { DataTablePagination } from "@/hooks/useDataTable";

interface TeacherRow {
  id: string;
  teacherId: string;
  name: string;
  gender: string | null;
  phone: string | null;
  teacherCode: string | null;
  subjects: string;
  classes: string;
  entriesThisWeek: number;
  entriesThisMonth: number;
  lastActive: string | null;
  status: string;
}

const columns: ColumnDef<TeacherRow>[] = [
  {
    key: "name",
    label: "Teacher Name",
    sortable: true,
    searchable: true,
  },
  {
    key: "gender",
    label: "Gender",
    filterable: true,
    hideOnMobile: true,
  },
  {
    key: "phone",
    label: "Phone",
    hideOnMobile: true,
  },
  {
    key: "teacherCode",
    label: "Teacher Code",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "subjects",
    label: "Subjects",
    filterable: true,
    filterKey: "subject",
  },
  {
    key: "classes",
    label: "Classes",
    filterable: true,
    filterKey: "class",
    hideOnMobile: true,
  },
  {
    key: "entriesThisWeek",
    label: "This Week",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "entriesThisMonth",
    label: "This Month",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "lastActive",
    label: "Last Active",
    type: "date",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
  },
];

export default function TeachersReportPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>([]);

  const handleDataLoad = useCallback((data: TeacherRow[], pagination: DataTablePagination) => {
    const total = pagination.total;
    const activeThisWeek = data.filter((t) => t.entriesThisWeek > 0).length;
    const totalMonthEntries = data.reduce((sum, t) => sum + t.entriesThisMonth, 0);
    const avgEntries = total > 0 ? Math.round(totalMonthEntries / data.length) : 0;
    setStats([
      { label: "Total Teachers", value: total },
      { label: "Active This Week", value: activeThisWeek },
      { label: "Avg Entries/Teacher", value: avgEntries },
    ]);
  }, []);

  return (
    <div>
      {stats.length > 0 && <ReportStatCards stats={stats} />}
      <DataTable<TeacherRow>
        columns={columns}
        endpoint="/api/admin/reports/teachers"
        title="Teachers"
        description="All teachers at your school with activity summary."
        searchPlaceholder="Search teachers by name or code..."
        defaultSort="lastActive"
        defaultOrder="desc"
        exportFilename="teachers-report"
        emptyTitle="No teachers found"
        emptyDescription="No teachers match your current filters."
        onRowClick={(row) => router.push(`/admin/teachers/${row.teacherId}`)}
        onDataLoad={handleDataLoad}
      />
    </div>
  );
}
