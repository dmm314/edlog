"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface ActivityRow {
  id: string;
  date: string;
  teacher: string;
  school: string;
  division: string;
  subject: string;
  class: string;
  level: string;
  moduleName: string;
  topicText: string;
  period: number | null;
  status: string;
  lessonMode: string;
  bilingual: string;
}

const columns: ColumnDef<ActivityRow>[] = [
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
    hideOnMobile: true,
  },
  {
    key: "moduleName",
    label: "Module",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "topicText",
    label: "Topic",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
  },
  {
    key: "lessonMode",
    label: "Lesson Mode",
    filterable: true,
    filterKey: "lessonMode",
    hideOnMobile: true,
  },
  {
    key: "bilingual",
    label: "Bilingual",
    filterable: true,
    filterKey: "bilingual",
    hideOnMobile: true,
  },
];

export default function RegionalActivityReportPage() {
  return (
    <DataTable<ActivityRow>
      columns={columns}
      endpoint="/api/regional/reports/activity"
      title="Teaching Activity"
      description="All logbook entries across your region."
      searchPlaceholder="Search by teacher, module, or topic..."
      defaultSort="date"
      defaultOrder="desc"
      exportFilename="regional-activity-report"
      emptyTitle="No entries found"
      emptyDescription="No logbook entries match your current filters."
    />
  );
}
