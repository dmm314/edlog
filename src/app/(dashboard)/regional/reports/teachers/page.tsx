"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface TeacherRow {
  id: string;
  name: string;
  gender: string | null;
  phone: string | null;
  school: string;
  division: string;
  subjects: string;
  classes: string;
  entriesThisMonth: number;
  lastActive: string | null;
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
    key: "subjects",
    label: "Subjects",
    filterable: true,
    filterKey: "subject",
  },
  {
    key: "classes",
    label: "Classes",
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
    key: "lastActive",
    label: "Last Active",
    type: "date",
    sortable: true,
  },
];

export default function RegionalTeachersReportPage() {
  return (
    <DataTable<TeacherRow>
      columns={columns}
      endpoint="/api/regional/reports/teachers"
      title="Teachers"
      description="All teachers across your region."
      searchPlaceholder="Search by teacher name..."
      defaultSort="lastActive"
      defaultOrder="desc"
      exportFilename="regional-teachers-report"
      emptyTitle="No teachers found"
      emptyDescription="No teachers match your current filters."
    />
  );
}
