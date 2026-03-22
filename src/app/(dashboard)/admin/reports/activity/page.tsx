"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { EntryDetailModal } from "@/components/EntryDetailModal";

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
  duration: number | null;
  status: string;
  engagementLevel: string;
  studentAttendance: number | null;
  lessonMode: string;
  bilingual: string;
  integrationActivity: string | null;
  integrationStatus: string | null;
  assignmentGiven: string;
  notes: string | null;
  digitalTools: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  remarksCount: number;
  viewsCount: number;
  completeness: number;
}

const columns: ColumnDef<ActivityRow>[] = [
  { key: "date", label: "Date", type: "date", sortable: true },
  { key: "teacher", label: "Teacher", sortable: true, filterable: true, searchable: true },
  { key: "subject", label: "Subject", sortable: true, filterable: true },
  { key: "class", label: "Class", sortable: true, filterable: true, hideOnMobile: true },
  { key: "moduleName", label: "Module", searchable: true, hideOnMobile: true },
  { key: "topicText", label: "Topic", searchable: true, hideOnMobile: true },
  { key: "status", label: "Status", type: "badge", filterable: true },
  {
    key: "completeness",
    label: "Complete",
    type: "number",
    sortable: true,
    align: "center",
    hideOnMobile: true,
    render: (value) => {
      const score = Number(value);
      const color = score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--accent))" : "hsl(var(--danger))";
      return <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color }}>{score}%</span>;
    },
  },
  { key: "familyOfSituation", label: "Family of Situation", filterable: true, filterKey: "familyOfSituation", hideOnMobile: true },
  { key: "period", label: "Period", type: "number", sortable: true, align: "center", hideOnMobile: true },
  { key: "engagementLevel", label: "Engagement", filterable: true, filterKey: "engagementLevel", hideOnMobile: true },
  { key: "studentAttendance", label: "Attendance", type: "number", sortable: true, align: "center", hideOnMobile: true },
  { key: "lessonMode", label: "Lesson Mode", filterable: true, filterKey: "lessonMode", hideOnMobile: true },
  { key: "bilingual", label: "Bilingual", filterable: true, filterKey: "bilingual", hideOnMobile: true },
  // Hidden by default — revealed via column toggle
  { key: "integrationActivity", label: "Integration Activity", hideOnMobile: true, defaultHidden: true },
  { key: "integrationStatus", label: "Integration Status", filterable: true, filterKey: "integrationStatus", hideOnMobile: true, defaultHidden: true },
  { key: "assignmentGiven", label: "Assignment Given", filterable: true, filterKey: "assignmentGiven", hideOnMobile: true, defaultHidden: true },
  { key: "notes", label: "Notes", hideOnMobile: true, defaultHidden: true },
  { key: "digitalTools", label: "Digital Tools", hideOnMobile: true, defaultHidden: true },
  { key: "duration", label: "Duration (min)", type: "number", align: "center", hideOnMobile: true, defaultHidden: true },
  { key: "verifiedBy", label: "Verified By", hideOnMobile: true, defaultHidden: true },
  { key: "verifiedAt", label: "Verified At", type: "date", hideOnMobile: true, defaultHidden: true },
  { key: "remarksCount", label: "Remarks", type: "number", align: "center", hideOnMobile: true, defaultHidden: true },
  { key: "viewsCount", label: "Views", type: "number", align: "center", hideOnMobile: true, defaultHidden: true },
];

export default function ActivityReportPage() {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  return (
    <>
      <DataTable<ActivityRow>
        columns={columns}
        endpoint="/api/admin/reports/activity"
        title="Teaching Activity"
        description="All logbook entries submitted by teachers. Click a row to view the full entry."
        searchPlaceholder="Search by teacher, module, or topic..."
        defaultSort="date"
        defaultOrder="desc"
        exportFilename="activity-report"
        emptyTitle="No entries found"
        emptyDescription="No logbook entries match your current filters."
        onRowClick={(row) => setSelectedEntryId(row.id)}
      />

      {selectedEntryId && (
        <EntryDetailModal
          entryId={selectedEntryId}
          onClose={() => setSelectedEntryId(null)}
          remarkLabel="Admin Note"
          accentClass="from-blue-900 to-blue-800"
        />
      )}
    </>
  );
}
