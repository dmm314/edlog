"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, AlertCircle, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface AssessmentDetail {
  id: string;
  title: string;
  type: string;
  date: string;
  totalMarks: number;
  passMark: number;
  corrected: boolean;
  correctionDate: string | null;
  totalStudents: number | null;
  totalMale: number | null;
  totalFemale: number | null;
  totalPassed: number | null;
  malePassed: number | null;
  femalePassed: number | null;
  highestMark: number | null;
  lowestMark: number | null;
  averageMark: number | null;
  notifiedParents: boolean;
  class: { name: string; level: string };
  subject: { name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
  topicsTested: { id: string; name: string }[];
}

const TYPE_LABELS: Record<string, string> = {
  sequence_test: "Sequence Test",
  class_test: "Class Test",
  assignment: "Assignment",
  mock_exam: "Mock Exam",
  exam: "Exam",
};

export default function AssessmentResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Results form state
  const [totalStudents, setTotalStudents] = useState<string>("");
  const [totalMale, setTotalMale] = useState<string>("");
  const [totalFemale, setTotalFemale] = useState<string>("");
  const [totalPassed, setTotalPassed] = useState<string>("");
  const [malePassed, setMalePassed] = useState<string>("");
  const [femalePassed, setFemalePassed] = useState<string>("");
  const [highestMark, setHighestMark] = useState<string>("");
  const [lowestMark, setLowestMark] = useState<string>("");
  const [averageMark, setAverageMark] = useState<string>("");
  // Track which gender field was last edited to auto-calc the other
  const [lastGenderEdited, setLastGenderEdited] = useState<"male" | "female" | null>(null);
  const [lastGenderPassedEdited, setLastGenderPassedEdited] = useState<"male" | "female" | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: AssessmentDetail) => {
        setAssessment(data);
        // Pre-fill form if results exist
        if (data.totalStudents != null) setTotalStudents(String(data.totalStudents));
        if (data.totalMale != null) setTotalMale(String(data.totalMale));
        if (data.totalFemale != null) setTotalFemale(String(data.totalFemale));
        if (data.totalPassed != null) setTotalPassed(String(data.totalPassed));
        if (data.malePassed != null) setMalePassed(String(data.malePassed));
        if (data.femalePassed != null) setFemalePassed(String(data.femalePassed));
        if (data.highestMark != null) setHighestMark(String(data.highestMark));
        if (data.lowestMark != null) setLowestMark(String(data.lowestMark));
        if (data.averageMark != null) setAverageMark(String(data.averageMark));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-calculate gender complement
  function handleTotalMaleChange(val: string) {
    setTotalMale(val);
    setLastGenderEdited("male");
    const ts = parseFloat(totalStudents);
    const m = parseFloat(val);
    if (!isNaN(ts) && !isNaN(m) && ts >= m) {
      setTotalFemale(String(ts - m));
    }
  }
  function handleTotalFemaleChange(val: string) {
    setTotalFemale(val);
    setLastGenderEdited("female");
    const ts = parseFloat(totalStudents);
    const f = parseFloat(val);
    if (!isNaN(ts) && !isNaN(f) && ts >= f) {
      setTotalMale(String(ts - f));
    }
  }
  function handleMalePassedChange(val: string) {
    setMalePassed(val);
    setLastGenderPassedEdited("male");
    const tp = parseFloat(totalPassed);
    const mp = parseFloat(val);
    if (!isNaN(tp) && !isNaN(mp) && tp >= mp) {
      setFemalePassed(String(tp - mp));
    }
  }
  function handleFemalePassedChange(val: string) {
    setFemalePassed(val);
    setLastGenderPassedEdited("female");
    const tp = parseFloat(totalPassed);
    const fp = parseFloat(val);
    if (!isNaN(tp) && !isNaN(fp) && tp >= fp) {
      setMalePassed(String(tp - fp));
    }
  }

  // Gender mismatch warnings
  const tsNum = parseFloat(totalStudents);
  const tmNum = parseFloat(totalMale);
  const tfNum = parseFloat(totalFemale);
  const genderMismatch = !isNaN(tsNum) && !isNaN(tmNum) && !isNaN(tfNum) && tmNum + tfNum !== tsNum;
  const tpNum = parseFloat(totalPassed);
  const mpNum = parseFloat(malePassed);
  const fpNum = parseFloat(femalePassed);
  const genderPassedMismatch = !isNaN(tpNum) && !isNaN(mpNum) && !isNaN(fpNum) && mpNum + fpNum !== tpNum;

  function numOrNull(v: string): number | null {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  async function handleSubmit() {
    setError("");

    const ts = numOrNull(totalStudents);
    const tm = numOrNull(totalMale);
    const tf = numOrNull(totalFemale);
    const tp = numOrNull(totalPassed);

    if (ts == null || ts <= 0) {
      setError("Total students is required.");
      return;
    }
    if (tp != null && tp > ts) {
      setError("Passed cannot exceed total students.");
      return;
    }
    if (tm != null && tf != null && tm + tf !== ts) {
      setError("Male + Female must equal total students.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        corrected: true,
        totalStudents: ts,
        totalMale: tm,
        totalFemale: tf,
        totalPassed: tp,
        malePassed: numOrNull(malePassed),
        femalePassed: numOrNull(femalePassed),
        highestMark: numOrNull(highestMark),
        lowestMark: numOrNull(lowestMark),
        averageMark: numOrNull(averageMark),
      };

      const res = await fetch(`/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save results.");
        return;
      }

      const updated = await res.json();
      setAssessment(updated);
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="card p-4 animate-pulse" style={{ height: 120 }} />
        <div className="card p-4 animate-pulse" style={{ height: 200 }} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20 px-4">
        <p className="font-bold" style={{ color: "var(--text-primary)" }}>
          Assessment not found
        </p>
        <Link
          href="/assessments"
          className="text-sm mt-2 inline-block"
          style={{ color: "var(--accent-text)" }}
        >
          Back to assessments
        </Link>
      </div>
    );
  }

  const passRate =
    assessment.corrected &&
    assessment.totalStudents &&
    assessment.totalPassed != null
      ? Math.round(((assessment.totalPassed / assessment.totalStudents) * 100) * 10) / 10
      : null;
  const malePassRate =
    assessment.corrected && assessment.totalMale && assessment.malePassed != null
      ? Math.round(((assessment.malePassed / assessment.totalMale) * 100) * 10) / 10
      : null;
  const femalePassRate =
    assessment.corrected && assessment.totalFemale && assessment.femalePassed != null
      ? Math.round(((assessment.femalePassed / assessment.totalFemale) * 100) * 10) / 10
      : null;
  const passRateColor = passRate != null
    ? passRate >= 70 ? "#16A34A" : passRate >= 50 ? "#D97706" : "#DC2626"
    : undefined;

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: "16px 16px 0" }}>
        <Link
          href="/assessments"
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <h1
          className="text-lg font-bold truncate"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
        >
          {assessment.corrected ? "Results" : "Enter Results"}
        </h1>
      </div>

      <div className="space-y-4" style={{ padding: "16px" }}>
        {/* Assessment info card */}
        <div className="card p-4">
          <h2
            className="text-base font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {assessment.title}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {assessment.class.name} &middot; {assessment.subject.name} &middot;{" "}
            {TYPE_LABELS[assessment.type] || assessment.type}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>
            {new Date(assessment.date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" "}
            &middot; /{assessment.totalMarks} (pass: {assessment.passMark})
          </p>
          {assessment.topicsTested.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {assessment.topicsTested.map((t) => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results summary (when corrected) */}
        {assessment.corrected && (
          <div className="card p-5">
            {/* Big pass rate */}
            {passRate != null && (
              <div className="text-center mb-4">
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 32,
                    fontWeight: 700,
                    color: passRateColor,
                    lineHeight: 1,
                  }}
                >
                  {passRate.toFixed(passRate % 1 === 0 ? 0 : 1)}%
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {assessment.totalPassed}/{assessment.totalStudents} students passed
                </p>
              </div>
            )}

            {/* Gender breakdown */}
            {(malePassRate != null || femalePassRate != null) && (
              <p className="text-center text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
                {malePassRate != null && `Male: ${assessment.malePassed}/${assessment.totalMale} (${malePassRate.toFixed(malePassRate % 1 === 0 ? 0 : 1)}%)`}
                {malePassRate != null && femalePassRate != null && " | "}
                {femalePassRate != null && `Female: ${assessment.femalePassed}/${assessment.totalFemale} (${femalePassRate.toFixed(femalePassRate % 1 === 0 ? 0 : 1)}%)`}
              </p>
            )}

            {/* Range + Average */}
            <div
              className="pt-3 space-y-2"
              style={{ borderTop: "1px solid var(--border-primary)" }}
            >
              {assessment.highestMark != null && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>Range</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {assessment.lowestMark ?? "—"} &ndash; {assessment.highestMark} / {assessment.totalMarks}
                  </span>
                </div>
              )}
              {assessment.averageMark != null && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>Average</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {assessment.averageMark}/{assessment.totalMarks}
                  </span>
                </div>
              )}
            </div>

            {/* Back link */}
            <div className="text-center mt-4">
              <Link
                href="/assessments"
                className="text-sm font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                Back to assessments
              </Link>
            </div>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: "var(--success-bg, #d1fae5)", color: "var(--success-text, #065f46)" }}
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            Results saved successfully.
          </div>
        )}

        {/* Results entry form */}
        {!assessment.corrected && (
          <>
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: "var(--error-bg, #fee2e2)", color: "var(--error-text, #991b1b)" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Students sat */}
            <div>
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                Total Students Sat *
              </label>
              <input
                type="number"
                value={totalStudents}
                onChange={(e) => setTotalStudents(e.target.value)}
                min={1}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              />
            </div>

            {/* Male / Female */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Male
                </label>
                <input
                  type="number"
                  value={totalMale}
                  onChange={(e) => handleTotalMaleChange(e.target.value)}
                  min={0}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: `1px solid ${genderMismatch ? "var(--warning-text, #92400e)" : "var(--border-primary)"}`,
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Female
                </label>
                <input
                  type="number"
                  value={totalFemale}
                  onChange={(e) => handleTotalFemaleChange(e.target.value)}
                  min={0}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: `1px solid ${genderMismatch ? "var(--warning-text, #92400e)" : "var(--border-primary)"}`,
                  }}
                />
              </div>
            </div>
            {genderMismatch && (
              <p className="text-xs" style={{ color: "var(--warning-text, #92400e)", marginTop: -8 }}>
                Male ({tmNum}) + Female ({tfNum}) = {tmNum + tfNum}, but total is {tsNum}
              </p>
            )}

            {/* Passed */}
            <div>
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                Total Passed
              </label>
              <input
                type="number"
                value={totalPassed}
                onChange={(e) => setTotalPassed(e.target.value)}
                min={0}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              />
            </div>

            {/* Male Passed / Female Passed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Male Passed
                </label>
                <input
                  type="number"
                  value={malePassed}
                  onChange={(e) => handleMalePassedChange(e.target.value)}
                  min={0}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: `1px solid ${genderPassedMismatch ? "var(--warning-text, #92400e)" : "var(--border-primary)"}`,
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Female Passed
                </label>
                <input
                  type="number"
                  value={femalePassed}
                  onChange={(e) => handleFemalePassedChange(e.target.value)}
                  min={0}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: `1px solid ${genderPassedMismatch ? "var(--warning-text, #92400e)" : "var(--border-primary)"}`,
                  }}
                />
              </div>
            </div>
            {genderPassedMismatch && (
              <p className="text-xs" style={{ color: "var(--warning-text, #92400e)", marginTop: -8 }}>
                Male passed ({mpNum}) + Female passed ({fpNum}) = {mpNum + fpNum}, but total passed is {tpNum}
              </p>
            )}

            {/* Marks */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Highest
                </label>
                <input
                  type="number"
                  value={highestMark}
                  onChange={(e) => setHighestMark(e.target.value)}
                  min={0}
                  max={assessment.totalMarks}
                  step="0.5"
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Lowest
                </label>
                <input
                  type="number"
                  value={lowestMark}
                  onChange={(e) => setLowestMark(e.target.value)}
                  min={0}
                  max={assessment.totalMarks}
                  step="0.5"
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
                  Average
                </label>
                <input
                  type="number"
                  value={averageMark}
                  onChange={(e) => setAverageMark(e.target.value)}
                  min={0}
                  max={assessment.totalMarks}
                  step="0.5"
                  placeholder="Auto if empty"
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>
                  Approximate if not calculated
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
              style={{
                background: "#16A34A",
                color: "#fff",
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? "Saving..." : "Save Results"}
            </button>
          </>
        )}

        {/* Edit results (if already corrected) */}
        {assessment.corrected && !saved && (
          <button
            onClick={() => {
              // Allow re-editing by temporarily setting corrected to false in state
              setAssessment({ ...assessment, corrected: false });
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          >
            Edit Results
          </button>
        )}
      </div>
    </div>
  );
}
