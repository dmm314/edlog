"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface AssessmentRow {
  id: string;
  date: string;
  teacher: string;
  school: string;
  subject: string;
  class: string;
  title: string;
  type: string;
  corrected: string;
  totalStudents: number | null;
  passRate: string;
  averageMark: string;
}

const columns: ColumnDef<AssessmentRow>[] = [
  {
    key: "date",
    label: "Date",
    type: "date",
    sortable: true,
  },
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
    key: "subject",
    label: "Subject",
    sortable: true,
    filterable: true,
  },
  {
    key: "class",
    label: "Class",
    hideOnMobile: true,
  },
  {
    key: "title",
    label: "Title",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "type",
    label: "Type",
    filterable: true,
    hideOnMobile: true,
  },
  {
    key: "corrected",
    label: "Corrected",
    type: "badge",
    filterable: true,
  },
  {
    key: "totalStudents",
    label: "Students",
    type: "number",
    align: "center",
    hideOnMobile: true,
  },
  {
    key: "passRate",
    label: "Pass Rate",
    hideOnMobile: true,
  },
  {
    key: "averageMark",
    label: "Average",
    hideOnMobile: true,
  },
];

export default function RegionalAssessmentsReportPage() {
  return (
    <DataTable<AssessmentRow>
      columns={columns}
      endpoint="/api/regional/reports/assessments"
      title="Assessments"
      description="All tests and exams across your region."
      searchPlaceholder="Search by teacher or title..."
      defaultSort="date"
      defaultOrder="desc"
      exportFilename="regional-assessments-report"
      emptyTitle="No assessments found"
      emptyDescription="No assessments match your current filters."
    />
  );
}
