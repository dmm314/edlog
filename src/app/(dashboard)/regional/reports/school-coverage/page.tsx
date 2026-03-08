"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Check } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { ReportStatCards, type StatCard } from "@/components/ReportStatCards";

interface SchoolCoverageRow {
  id: string;
  schoolId: string;
  school: string;
  schoolCode: string;
  division: string;
  totalTopics: number;
  topicsCovered: number;
  coverageRate: number;
  totalEntries: number;
  teacherCount: number;
  lastActivity: string | null;
  gaps: string[];
  totalGaps: number;
}

function CoverageCell({ row }: { row: SchoolCoverageRow }) {
  const { topicsCovered, totalTopics, coverageRate } = row;
  let barColor = "#DC2626";
  if (coverageRate >= 80) barColor = "#16A34A";
  else if (coverageRate >= 50) barColor = "#F59E0B";

  let textColor = "#DC2626";
  if (coverageRate >= 80) textColor = "#16A34A";
  else if (coverageRate >= 50) textColor = "#B45309";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          color: textColor,
        }}
      >
        {topicsCovered}/{totalTopics}
      </span>
      <div
        style={{
          width: "100%",
          height: 6,
          borderRadius: 9999,
          background: "var(--bg-tertiary)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(coverageRate, 100)}%`,
            height: "100%",
            borderRadius: 9999,
            background: barColor,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
        ({coverageRate}%)
      </span>
    </div>
  );
}

function MissingTopicsCell({ row }: { row: SchoolCoverageRow }) {
  const { gaps, totalGaps } = row;

  if (gaps.length === 0) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Check size={16} style={{ color: "#16A34A" }} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "#16A34A" }}>
          Complete
        </span>
      </span>
    );
  }

  const shown = gaps.slice(0, 3);
  const remaining = totalGaps - 3;

  return (
    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)" }}>
      {shown.join(", ")}
      {remaining > 0 && (
        <span style={{ color: "var(--text-quaternary)" }}> +{remaining} more</span>
      )}
    </span>
  );
}

const columns: ColumnDef<SchoolCoverageRow>[] = [
  {
    key: "school",
    label: "School",
    sortable: true,
    searchable: true,
  },
  {
    key: "division",
    label: "Division",
    sortable: true,
    filterable: true,
  },
  {
    key: "coverageRate",
    label: "Coverage",
    sortable: true,
    align: "center",
    width: "140px",
    render: (_value, row) => <CoverageCell row={row} />,
  },
  {
    key: "teacherCount",
    label: "Teachers",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "totalEntries",
    label: "Entries",
    type: "number",
    sortable: true,
    align: "center",
  },
  {
    key: "lastActivity",
    label: "Last Active",
    type: "date",
    sortable: true,
  },
  {
    key: "gaps",
    label: "Missing Topics",
    render: (_value, row) => <MissingTopicsCell row={row} />,
  },
];

const LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

export default function SchoolComparisonPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState<StatCard[]>([]);

  // Fetch available subjects
  useEffect(() => {
    fetch("/api/regional/reports/coverage?limit=0")
      .then((res) => res.json())
      .then((data) => {
        if (data.filters?.subject) {
          setSubjects(data.filters.subject);
        }
      })
      .catch(() => {});
  }, []);

  const handleDataLoad = useCallback((data: SchoolCoverageRow[]) => {
    const count = data.length;
    const rates = data.map((r) => r.coverageRate);
    const avg = count > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / count) : 0;
    const highest = count > 0 ? Math.max(...rates) : 0;
    const lowest = count > 0 ? Math.min(...rates) : 0;
    setStats([
      { label: "Schools Compared", value: count },
      { label: "Avg Coverage %", value: `${avg}%` },
      { label: "Highest", value: `${highest}%` },
      { label: "Lowest", value: `${lowest}%` },
    ]);
  }, []);

  const bothSelected = subject && level;

  return (
    <div>
      {/* Subject + Level selectors */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
        }}
        className="school-coverage-selectors"
      >
        <div
          style={{
            flex: 1,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: "12px 16px",
          }}
        >
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: subject ? "var(--text-primary)" : "var(--text-tertiary)",
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            flex: 1,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: "12px 16px",
          }}
        >
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: level ? "var(--text-primary)" : "var(--text-tertiary)",
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Select Level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards (only when data loaded) */}
      {bothSelected && stats.length > 0 && <ReportStatCards stats={stats} />}

      {/* Prompt or DataTable */}
      {!bothSelected ? (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <BarChart3
            size={48}
            style={{ color: "var(--text-quaternary)", margin: "0 auto 16px" }}
          />
          <h3
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Select a subject and class level to compare schools
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-tertiary)",
              margin: 0,
            }}
          >
            Choose a subject and level to see how schools in your region compare on curriculum coverage.
          </p>
        </div>
      ) : (
        <DataTable<SchoolCoverageRow>
          columns={columns}
          endpoint={`/api/regional/reports/school-coverage?filter[subject]=${encodeURIComponent(subject)}&filter[level]=${encodeURIComponent(level)}`}
          title={`${subject} — ${level}`}
          description="School-by-school comparison of curriculum coverage."
          searchPlaceholder="Search by school name..."
          defaultSort="coverageRate"
          defaultOrder="asc"
          exportFilename={`school-comparison-${subject.toLowerCase()}-${level.toLowerCase().replace(/\s+/g, "-")}`}
          emptyTitle="No schools found"
          emptyDescription="No schools in your region teach this subject at this level."
          onRowClick={(row) => router.push(`/regional/schools/${row.schoolId}`)}
          onDataLoad={handleDataLoad}
        />
      )}

      {/* Mobile responsive styles */}
      <style jsx global>{`
        @media (max-width: 639px) {
          .school-coverage-selectors {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
