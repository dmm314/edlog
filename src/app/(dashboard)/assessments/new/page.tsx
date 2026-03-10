"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface TopicOption {
  id: string;
  name: string;
  moduleName: string | null;
}

interface Assignment {
  id: string;
  classId: string;
  subjectId: string;
  class: { id: string; name: string; level: string };
  subject: { id: string; name: string; code: string };
}

const TYPES = [
  { value: "sequence_test", label: "Sequence Test" },
  { value: "class_test", label: "Class Test" },
  { value: "assignment", label: "Assignment" },
  { value: "mock_exam", label: "Mock Exam" },
  { value: "exam", label: "Exam" },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("sequence_test");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [totalMarks, setTotalMarks] = useState(20);
  const [passMark, setPassMark] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsNote, setTopicsNote] = useState("");

  // Derived: unique classes and subjects from assignments
  const classes: ClassOption[] = [];
  const seenClasses = new Set<string>();
  assignments.forEach((a) => {
    if (!seenClasses.has(a.classId)) {
      seenClasses.add(a.classId);
      classes.push({ id: a.class.id, name: a.class.name, level: a.class.level });
    }
  });

  const subjects: SubjectOption[] = [];
  const seenSubjects = new Set<string>();
  assignments
    .filter((a) => !classId || a.classId === classId)
    .forEach((a) => {
      if (!seenSubjects.has(a.subjectId)) {
        seenSubjects.add(a.subjectId);
        subjects.push({ id: a.subject.id, name: a.subject.name, code: a.subject.code });
      }
    });

  useEffect(() => {
    fetch("/api/assignments")
      .then((r) => r.json())
      .then((data) => setAssignments(data.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch topics when class+subject selected
  useEffect(() => {
    if (!classId || !subjectId) {
      setTopics([]);
      return;
    }
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;

    fetch(`/api/topics?subjectId=${subjectId}&classLevel=${encodeURIComponent(cls.level)}`)
      .then((r) => r.json())
      .then((data) => setTopics(data.topics || []))
      .catch(() => setTopics([]));
  }, [classId, subjectId]);

  // Reset subject when class changes
  useEffect(() => {
    setSubjectId("");
    setSelectedTopics([]);
  }, [classId]);

  async function handleSubmit() {
    setError("");
    if (!classId || !subjectId || !title.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (passMark > totalMarks) {
      setError("Pass mark cannot exceed total marks.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectId,
          title: title.trim(),
          type,
          date,
          totalMarks,
          passMark,
          topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          topicsNote: topicsNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create assessment.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--success-bg, #d1fae5)" }}
          >
            <Check className="w-8 h-8" style={{ color: "var(--success-text, #065f46)" }} />
          </div>
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Assessment Logged
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
            Remember to enter results after correction.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setSelectedTopics([]);
                setTopicsNote("");
              }}
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            >
              Log Another
            </button>
            <Link
              href="/assessments"
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-content-form" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="flex items-center gap-3"
        style={{ padding: "16px 16px 0" }}
      >
        <Link
          href="/assessments"
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
        >
          Log New Test
        </h1>
      </div>

      <div className="space-y-4" style={{ padding: "16px" }}>
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: "var(--error-bg, #fee2e2)", color: "var(--error-text, #991b1b)" }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Class */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Class *
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <option value="">Select class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Subject *
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!classId}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              fontFamily: "var(--font-body)",
              opacity: classId ? 1 : 0.5,
            }}
          >
            <option value="">Select subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. First Sequence Test"
            maxLength={200}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        {/* Type chips */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: type === t.value ? "var(--accent)" : "var(--bg-tertiary)",
                  color: type === t.value ? "#fff" : "var(--text-secondary)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        {/* Total Marks & Pass Mark */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
              Total Marks
            </label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
              min={1}
              max={1000}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
              Pass Mark
            </label>
            <input
              type="number"
              value={passMark}
              onChange={(e) => setPassMark(parseInt(e.target.value) || 0)}
              min={0}
              max={totalMarks}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        </div>

        {/* Topics */}
        {topics.length > 0 && (
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
              Topics Tested
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => {
                const selected = selectedTopics.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setSelectedTopics((prev) =>
                        selected
                          ? prev.filter((id) => id !== t.id)
                          : [...prev, t.id]
                      )
                    }
                    className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: selected ? "var(--accent)" : "var(--bg-tertiary)",
                      color: selected ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Topics Note */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-primary)" }}>
            Topics Note
            <span className="font-normal ml-1" style={{ color: "var(--text-quaternary)" }}>
              (optional)
            </span>
          </label>
          <textarea
            value={topicsNote}
            onChange={(e) => setTopicsNote(e.target.value)}
            placeholder="Brief description of what was tested..."
            maxLength={500}
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !classId || !subjectId || !title.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
          style={{
            background: "var(--accent)",
            color: "#fff",
            opacity: submitting || !classId || !subjectId || !title.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Saving..." : "Log Assessment"}
        </button>
      </div>
    </div>
  );
}
