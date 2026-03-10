"use client";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

interface ActivityRow {
  id: string;
  date: string;
  teacher: string;
  subject: string;
  class: string;
  level: string;
  moduleName: string;
  topicText: string;
  familyOfSituation: string;
  period: number | null;
  status: string;
  engagementLevel: string;
  studentAttendance: number | null;
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
    filterable: true,
    searchable: true,
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
    filterable: true,
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
    key: "familyOfSituation",
    label: "Family of Situation",
    filterable: true,
    filterKey: "familyOfSituation",
    hideOnMobile: true,
  },
  {
    key: "period",
    label: "Period",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
  },
  {
    key: "engagementLevel",
    label: "Engagement",
    filterable: true,
    filterKey: "engagementLevel",
    hideOnMobile: true,
  },
  {
    key: "studentAttendance",
    label: "Attendance",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
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

export default function ActivityReportPage() {
  return (
    <DataTable<ActivityRow>
      columns={columns}
      endpoint="/api/admin/reports/activity"
      title="Teaching Activity"
      description="All logbook entries submitted by teachers."
      searchPlaceholder="Search by teacher, module, or topic..."
      defaultSort="date"
      defaultOrder="desc"
      exportFilename="activity-report"
      emptyTitle="No entries found"
      emptyDescription="No logbook entries match your current filters."
    />
  );
}
