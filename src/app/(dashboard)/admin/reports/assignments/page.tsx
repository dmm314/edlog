"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface AssignmentRow {
  id: string;
  teacher: string;
  subject: string;
  division: string;
  class: string;
  level: string;
  periodsPerWeek: number;
}

const columns: ColumnDef<AssignmentRow>[] = [
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    searchable: true,
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    filterable: true,
  },
  {
    key: "division",
    label: "Division",
    hideOnMobile: true,
  },
  {
    key: "class",
    label: "Class",
    sortable: true,
  },
  {
    key: "level",
    label: "Level",
    filterable: true,
    hideOnMobile: true,
  },
  {
    key: "periodsPerWeek",
    label: "Periods/Week",
    type: "number",
    sortable: true,
    align: "center",
  },
];

export default function AssignmentsReportPage() {
  return (
    <DataTable<AssignmentRow>
      columns={columns}
      endpoint="/api/admin/reports/assignments"
      title="Teacher Assignments"
      description="All subject-class assignments and timetable periods."
      searchPlaceholder="Search by teacher name..."
      defaultSort="subject"
      defaultOrder="asc"
      exportFilename="assignments-report"
      emptyTitle="No assignments found"
      emptyDescription="No assignments match your current filters."
    />
  );
}
