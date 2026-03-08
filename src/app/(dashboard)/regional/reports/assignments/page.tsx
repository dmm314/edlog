"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface AssignmentRow {
  id: string;
  teacher: string;
  school: string;
  division: string;
  subject: string;
  class: string;
  level: string;
}

const columns: ColumnDef<AssignmentRow>[] = [
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    searchable: true,
  },
  {
    key: "school",
    label: "School",
    sortable: true,
    filterable: true,
  },
  {
    key: "division",
    label: "Division",
    filterable: true,
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    filterable: true,
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
];

export default function RegionalAssignmentsReportPage() {
  return (
    <DataTable<AssignmentRow>
      columns={columns}
      endpoint="/api/regional/reports/assignments"
      title="Teacher Assignments"
      description="All subject-class assignments across your region."
      searchPlaceholder="Search by teacher or subject..."
      defaultSort="school"
      defaultOrder="asc"
      exportFilename="regional-assignments-report"
      emptyTitle="No assignments found"
      emptyDescription="No assignments match your current filters."
    />
  );
}
