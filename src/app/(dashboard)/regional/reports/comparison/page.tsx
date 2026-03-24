"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, X, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

interface SchoolOption {
  id: string;
  name: string;
  code: string;
}

interface SchoolComparison {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  metrics: {
    teachers: number;
    classes: number;
    subjects: number;
    totalEntries: number;
    entriesThisMonth: number;
    entriesThisWeek: number;
    verifiedEntries: number;
    flaggedEntries: number;
    complianceRate: number;
    verificationRate: number;
    entriesPerTeacher: number;
  };
}

interface ComparisonResult {
  comparison: SchoolComparison[];
  winners: Record<string, string>;
}

const METRIC_LABELS: { key: keyof SchoolComparison["metrics"]; label: string; suffix?: string }[] = [
  { key: "teachers", label: "Teachers" },
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects Taught" },
  { key: "totalEntries", label: "Total Entries" },
  { key: "entriesThisMonth", label: "Entries This Month" },
  { key: "entriesThisWeek", label: "Entries This Week" },
  { key: "verifiedEntries", label: "Verified Entries" },
  { key: "flaggedEntries", label: "Flagged Entries" },
  { key: "complianceRate", label: "Compliance Rate", suffix: "%" },
  { key: "verificationRate", label: "Verification Rate", suffix: "%" },
  { key: "entriesPerTeacher", label: "Entries/Teacher (Month)" },
];

const WINNER_METRICS = ["complianceRate", "verificationRate", "entriesPerTeacher", "entriesThisMonth"];

export default function ComparisonPage() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch available schools
  useEffect(() => {
    fetch("/api/regional/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.filterOptions?.schools) {
          setSchools(data.filterOptions.schools);
        }
      })
      .catch(() => {});
  }, []);

  const fetchComparison = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/regional/reports/comparison?schools=${selectedIds.join(",")}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load comparison");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Failed to load comparison data");
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  function addSchool(id: string) {
    if (!selectedIds.includes(id) && selectedIds.length < 6) {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function removeSchool(id: string) {
    setSelectedIds(selectedIds.filter((s) => s !== id));
    if (result) setResult(null);
  }

  const availableSchools = schools.filter((s) => !selectedIds.includes(s.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/regional/reports" className="p-2 rounded-lg hover:bg-[hsl(var(--surface-elevated))]">
          <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Cross-School Comparison</h2>
          <p className="text-xs text-[var(--text-tertiary)]">Select 2–6 schools to compare side-by-side</p>
        </div>
      </div>

      {/* School selector */}
      <div className="card p-4">
        <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">Selected Schools ({selectedIds.length}/6)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedIds.map((id) => {
            const school = schools.find((s) => s.id === id);
            return (
              <span key={id} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "hsl(var(--accent-soft))", color: "hsl(var(--accent-text))" }}>
                {school?.name || id}
                <button onClick={() => removeSchool(id)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selectedIds.length === 0 && (
            <p className="text-xs text-[var(--text-quaternary)]">No schools selected yet</p>
          )}
        </div>

        {availableSchools.length > 0 && selectedIds.length < 6 && (
          <div className="flex gap-2 items-center">
            <select
              className="input-field text-sm flex-1"
              value=""
              onChange={(e) => { if (e.target.value) addSchool(e.target.value); }}
            >
              <option value="">Add a school...</option>
              {availableSchools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
            <Plus className="w-4 h-4 text-[var(--text-tertiary)]" />
          </div>
        )}

        <button
          onClick={fetchComparison}
          disabled={selectedIds.length < 2 || loading}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ background: "hsl(var(--accent))" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Loading..." : "Compare Schools"}
        </button>
      </div>

      {error && (
        <div className="card p-4 text-sm text-[hsl(var(--danger))] font-semibold">{error}</div>
      )}

      {/* Comparison table */}
      {result && result.comparison.length >= 2 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-primary)" }}>
                <th className="text-left p-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wide sticky left-0 bg-[hsl(var(--surface-elevated))]">
                  Metric
                </th>
                {result.comparison.map((school) => (
                  <th key={school.id} className="text-center p-3 min-w-[120px]">
                    <p className="text-xs font-bold text-[var(--text-primary)]">{school.name}</p>
                    <p className="text-[10px] text-[var(--text-quaternary)] font-mono">{school.code}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_LABELS.map((metric) => {
                const isWinnerMetric = WINNER_METRICS.includes(metric.key);
                const winnerId = result.winners[metric.key];
                return (
                  <tr key={metric.key} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    <td className="p-3 text-xs font-semibold text-[var(--text-secondary)] sticky left-0 bg-[hsl(var(--surface-elevated))]">
                      {metric.label}
                    </td>
                    {result.comparison.map((school) => {
                      const value = school.metrics[metric.key];
                      const isWinner = isWinnerMetric && school.id === winnerId;
                      return (
                        <td key={school.id} className="p-3 text-center">
                          <span className={`font-mono text-sm ${isWinner ? "font-bold" : ""}`}
                            style={{ color: isWinner ? "hsl(var(--success))" : "var(--text-primary)" }}>
                            {value}{metric.suffix || ""}
                            {isWinner && <Trophy className="w-3 h-3 inline-block ml-1 -mt-0.5" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Visual comparison bars */}
      {result && result.comparison.length >= 2 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Compliance Comparison</h3>
          <div className="space-y-3">
            {result.comparison
              .sort((a, b) => b.metrics.complianceRate - a.metrics.complianceRate)
              .map((school, i) => {
                const colors = ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(210, 60%, 55%)", "hsl(270, 50%, 55%)", "hsl(340, 60%, 55%)"];
                return (
                  <div key={school.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{school.name}</p>
                      <p className="text-xs font-bold font-mono" style={{ color: colors[i % colors.length] }}>
                        {school.metrics.complianceRate}%
                      </p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-secondary)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${school.metrics.complianceRate}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
