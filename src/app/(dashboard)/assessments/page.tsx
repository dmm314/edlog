"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  AlertTriangle,
  Calendar,
  BookOpen,
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  type: string;
  date: string;
  totalMarks: number;
  passMark: number;
  corrected: boolean;
  correctionDate: string | null;
  totalStudents: number | null;
  totalPassed: number | null;
  totalMale: number | null;
  totalFemale: number | null;
  malePassed: number | null;
  femalePassed: number | null;
  averageMark: number | null;
  passRate: number | null;
  malePassRate: number | null;
  femalePassRate: number | null;
  class: { name: string };
  subject: { name: string; code: string };
}

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function AssessmentsPage() {
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const corrected = tab === "completed" ? "true" : "false";
    setLoading(true);
    fetch(`/api/assessments?corrected=${corrected}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        setAssessments(data.assessments || []);
      })
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "24px 16px 0" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            >
              Assessments
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              Track tests and results
            </p>
          </div>
          <Link
            href="/assessments/new"
            className="flex items-center gap-1.5 text-sm font-semibold rounded-xl px-4 py-2 active:scale-95 transition-transform"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            Log New Test
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          className="flex rounded-xl p-1"
          style={{ background: "var(--bg-tertiary)" }}
        >
          {(["upcoming", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 text-sm font-semibold py-2 rounded-lg transition-all"
              style={{
                fontFamily: "var(--font-body)",
                background: tab === t ? "var(--bg-primary)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: tab === t ? "var(--shadow-sm)" : "none",
              }}
            >
              {t === "upcoming" ? "Pending Results" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "12px 16px" }}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card p-4 animate-pulse"
                style={{ height: 88 }}
              />
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <BookOpen className="w-8 h-8" style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
              {tab === "upcoming" ? "No pending assessments" : "No completed assessments"}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {tab === "upcoming"
                ? "Log a new test to start tracking."
                : "Enter results for your upcoming tests."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((a) => {
              const overdue = !a.corrected && daysSince(a.date) > 14;
              const overdueDays = daysSince(a.date);
              const passRate = a.passRate ?? (a.totalStudents && a.totalPassed != null
                ? Math.round((a.totalPassed / a.totalStudents) * 100 * 10) / 10
                : null);
              const passRateColor = passRate != null
                ? passRate >= 70
                  ? "var(--success-text, #065f46)"
                  : passRate >= 50
                  ? "var(--warning-text, #92400e)"
                  : "var(--error-text, #991b1b)"
                : undefined;

              if (a.corrected) {
                // Completed card
                return (
                  <Link
                    key={a.id}
                    href={`/assessments/${a.id}/results`}
                    className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}
                        className="truncate"
                      >
                        {a.title}
                      </p>
                      <p
                        style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}
                        className="truncate"
                      >
                        {a.subject.name} &middot; {a.class.name}
                      </p>
                      <p
                        style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-quaternary)", marginTop: 2 }}
                      >
                        {new Date(a.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                      {a.totalPassed != null && a.totalStudents != null && (
                        <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                          {a.totalPassed}/{a.totalStudents} passed
                          {a.averageMark != null && ` \u00B7 Avg: ${a.averageMark}/${a.totalMarks}`}
                        </p>
                      )}
                    </div>

                    {passRate != null && (
                      <div className="flex-shrink-0 text-right">
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 24,
                            fontWeight: 700,
                            color: passRateColor,
                            lineHeight: 1,
                          }}
                        >
                          {passRate.toFixed(passRate % 1 === 0 ? 0 : 1)}%
                        </p>
                      </div>
                    )}
                  </Link>
                );
              }

              // Pending card
              return (
                <Link
                  key={a.id}
                  href={`/assessments/${a.id}/results`}
                  className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: overdue
                        ? "var(--warning-bg, #fef3c7)"
                        : "var(--accent-light)",
                    }}
                  >
                    {overdue ? (
                      <AlertTriangle
                        className="w-5 h-5"
                        style={{ color: "var(--warning-text, #92400e)" }}
                      />
                    ) : (
                      <Calendar
                        className="w-5 h-5"
                        style={{ color: "var(--accent-text)" }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}
                        className="truncate"
                      >
                        {a.title}
                      </p>
                      {overdue && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: "var(--warning-bg, #fef3c7)",
                            color: "var(--warning-text, #92400e)",
                          }}
                        >
                          Overdue — {overdueDays} days
                        </span>
                      )}
                    </div>
                    <p
                      style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}
                      className="truncate"
                    >
                      {a.subject.name} &middot; {a.class.name}
                    </p>
                    <p
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-quaternary)", marginTop: 2 }}
                    >
                      {new Date(a.date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Enter Results
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
