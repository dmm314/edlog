"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Plus,
  Search,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";

interface DivisionInfo {
  id: string;
  name: string;
  levels: string[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  category: string | null;
  linked: boolean;
  divisions: DivisionInfo[];
}

const VALID_LEVELS = [
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
  "Lower Sixth", "Upper Sixth",
];

const FIRST_CYCLE = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];
const SECOND_CYCLE = ["Lower Sixth", "Upper Sixth"];

// Pre-defined division templates for common subjects
const DIVISION_TEMPLATES: Record<string, { name: string; levels: string[] }[]> = {
  CHE: [
    { name: "Physical Chemistry", levels: [...SECOND_CYCLE] },
    { name: "Organic Chemistry", levels: [...SECOND_CYCLE] },
    { name: "Inorganic Chemistry", levels: [...SECOND_CYCLE] },
  ],
  ENG: [
    { name: "Directed Writing", levels: ["Form 4", "Form 5"] },
    { name: "Composition", levels: ["Form 4", "Form 5"] },
    { name: "Summary & Comprehension", levels: ["Form 4", "Form 5"] },
    { name: "Grammar & Vocabulary", levels: ["Form 4", "Form 5"] },
  ],
  LIT: [
    { name: "Prose", levels: [] },
    { name: "Poetry", levels: [] },
    { name: "Drama", levels: [] },
    { name: "Literary Criticism", levels: [...SECOND_CYCLE] },
  ],
  FRE: [
    { name: "Expression Ecrite", levels: ["Form 4", "Form 5"] },
    { name: "Comprehension", levels: ["Form 4", "Form 5"] },
    { name: "Grammaire", levels: ["Form 4", "Form 5"] },
  ],
  PHY: [
    { name: "Mechanics", levels: [...SECOND_CYCLE] },
    { name: "Electricity & Magnetism", levels: [...SECOND_CYCLE] },
    { name: "Waves & Optics", levels: [...SECOND_CYCLE] },
    { name: "Modern Physics", levels: [...SECOND_CYCLE] },
  ],
  BIO: [
    { name: "Cell Biology", levels: [...SECOND_CYCLE] },
    { name: "Genetics", levels: [...SECOND_CYCLE] },
    { name: "Ecology", levels: [...SECOND_CYCLE] },
    { name: "Physiology", levels: [...SECOND_CYCLE] },
  ],
  MAT: [
    { name: "Pure Mathematics", levels: [...SECOND_CYCLE] },
    { name: "Mechanics", levels: [...SECOND_CYCLE] },
    { name: "Statistics", levels: [...SECOND_CYCLE] },
  ],
  ECO: [
    { name: "Microeconomics", levels: [...SECOND_CYCLE] },
    { name: "Macroeconomics", levels: [...SECOND_CYCLE] },
  ],
  GEO: [
    { name: "Physical Geography", levels: [] },
    { name: "Human Geography", levels: [] },
  ],
  LOG: [
    { name: "Formal Logic", levels: [...SECOND_CYCLE] },
    { name: "Reasoning", levels: [...SECOND_CYCLE] },
    { name: "Applied Logic", levels: [...SECOND_CYCLE] },
  ],
  PHI: [
    { name: "Logic", levels: [...SECOND_CYCLE] },
    { name: "Ethics", levels: [...SECOND_CYCLE] },
    { name: "Metaphysics", levels: [...SECOND_CYCLE] },
  ],
  HIS: [
    { name: "World History", levels: [] },
    { name: "African History", levels: [] },
    { name: "Cameroon History", levels: [] },
  ],
};

export default function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Division setup panel
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newDivName, setNewDivName] = useState("");
  const [newDivLevels, setNewDivLevels] = useState<string[]>([]);
  const [savingDiv, setSavingDiv] = useState(false);
  const [deletingDiv, setDeletingDiv] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/admin/subjects");
      const data = await res.json();
      if (res.ok) {
        setSubjects(data.subjects);
      }
    } catch {
      setError("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSubject(subjectId: string, currentlyLinked: boolean) {
    setToggling(subjectId);
    setError("");

    try {
      if (currentlyLinked) {
        // If it has divisions, warn first (handled in UI)
        const res = await fetch(`/api/admin/subjects?subjectId=${subjectId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, linked: false, divisions: [] } : s
            )
          );
          if (expandedSubject === subjectId) setExpandedSubject(null);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to remove subject");
        }
      } else {
        const res = await fetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
        if (res.ok) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, linked: true } : s
            )
          );
          // Auto-expand to show division setup
          setExpandedSubject(subjectId);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to add subject");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setToggling(null);
    }
  }

  function handleExpandSubject(subjectId: string) {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      setNewDivName("");
      setNewDivLevels([]);
    }
  }

  async function handleAddDivision(subjectId: string) {
    if (!newDivName.trim()) return;
    setSavingDiv(true);
    setError("");

    try {
      const res = await fetch("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          name: newDivName.trim(),
          levels: newDivLevels,
        }),
      });

      if (res.ok) {
        const newDiv = await res.json();
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  divisions: [
                    ...s.divisions,
                    { id: newDiv.id, name: newDiv.name, levels: newDiv.levels },
                  ],
                }
              : s
          )
        );
        setNewDivName("");
        setNewDivLevels([]);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add division");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSavingDiv(false);
    }
  }

  async function handleAddTemplateDivision(
    subjectId: string,
    name: string,
    levels: string[]
  ) {
    setError("");
    try {
      const res = await fetch("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, name, levels }),
      });
      if (res.ok) {
        const newDiv = await res.json();
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  divisions: [
                    ...s.divisions,
                    { id: newDiv.id, name: newDiv.name, levels: newDiv.levels },
                  ],
                }
              : s
          )
        );
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add division");
      }
    } catch {
      setError("Something went wrong");
    }
  }

  async function handleAddAllTemplates(subjectId: string, code: string) {
    const templates = DIVISION_TEMPLATES[code] || [];
    const existing = subjects.find((s) => s.id === subjectId)?.divisions || [];
    const existingNames = new Set(existing.map((d) => d.name));
    const toAdd = templates.filter((t) => !existingNames.has(t.name));

    for (const t of toAdd) {
      await handleAddTemplateDivision(subjectId, t.name, t.levels);
    }
  }

  async function handleDeleteDivision(subjectId: string, divId: string) {
    setDeletingDiv(divId);
    setError("");
    try {
      const res = await fetch(`/api/admin/divisions?id=${divId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? { ...s, divisions: s.divisions.filter((d) => d.id !== divId) }
              : s
          )
        );
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete division");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeletingDiv(null);
    }
  }

  function toggleLevel(level: string) {
    setNewDivLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }

  const linkedCount = subjects.filter((s) => s.linked).length;

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  const groupedSubjects = useMemo(() => {
    const groups: Record<string, SubjectItem[]> = {};
    for (const s of filteredSubjects) {
      const cat = s.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSubjects]);

  function getLevelLabel(levels: string[]) {
    if (levels.length === 0) return "All levels";
    if (
      levels.length === FIRST_CYCLE.length &&
      FIRST_CYCLE.every((l) => levels.includes(l))
    )
      return "First Cycle only";
    if (
      levels.length === SECOND_CYCLE.length &&
      SECOND_CYCLE.every((l) => levels.includes(l))
    )
      return "Second Cycle only";
    return levels.join(", ");
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="page-shell">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              School Subjects
            </h1>
            <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
              {linkedCount} subject{linkedCount !== 1 ? "s" : ""} added &middot; Tap a subject to configure
            </p>
          </div>
        </div>
      </div>

      <div className="page-shell px-5 mt-4 space-y-4">
        {/* Info */}
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Select subjects taught at your school. When you add a subject, you can
            set up <strong>divisions</strong> if it is taught by multiple teachers
            (e.g. Physical Chemistry, Organic Chemistry). For most first-cycle
            subjects, no divisions are needed.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              &times;
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[hsl(var(--surface-elevated))] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
          />
        </div>

        {/* Subjects List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)]">No subjects found in the system</p>
          </div>
        ) : (
          groupedSubjects.map(([category, categorySubjects]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                {category}
              </h3>
              <div className="space-y-1.5">
                {categorySubjects.map((subject) => {
                  const isExpanded = expandedSubject === subject.id && subject.linked;
                  const templates = DIVISION_TEMPLATES[subject.code] || [];
                  const existingNames = new Set(subject.divisions.map((d) => d.name));
                  const availableTemplates = templates.filter(
                    (t) => !existingNames.has(t.name)
                  );

                  return (
                    <div key={subject.id}>
                      {/* Subject row */}
                      <div
                        className={`card p-3 flex items-center justify-between transition-colors ${
                          subject.linked
                            ? "border-[var(--border-secondary)]"
                            : "hover:bg-[hsl(var(--surface-tertiary))]"
                        } ${isExpanded ? "rounded-b-none border-b-0" : ""}`}
                        style={subject.linked ? { background: "var(--accent-soft)" } : undefined}
                      >
                        <button
                          onClick={() =>
                            subject.linked
                              ? handleExpandSubject(subject.id)
                              : toggleSubject(subject.id, false)
                          }
                          className="flex-1 text-left flex items-center gap-2 min-w-0"
                        >
                          <div className="min-w-0">
                            <h4
                              className={`font-medium text-sm ${
                                subject.linked
                                  ? "text-[var(--text-primary)]"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {subject.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[var(--text-tertiary)]">
                                {subject.code}
                              </span>
                              {subject.linked && subject.divisions.length > 0 && (
                                <span className="text-[10px] text-[hsl(var(--accent-strong))] bg-[hsl(var(--accent-soft))] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                  <Layers className="w-3 h-3" />
                                  {subject.divisions.length} division{subject.divisions.length !== 1 ? "s" : ""}
                                </span>
                              )}
                              {subject.linked && subject.divisions.length === 0 && (
                                <span className="text-[10px] text-[var(--text-tertiary)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 rounded font-medium">
                                  No divisions
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5">
                          {subject.linked && (
                            <button
                              onClick={() => handleExpandSubject(subject.id)}
                              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-text)] rounded"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              toggleSubject(subject.id, subject.linked)
                            }
                            disabled={toggling === subject.id}
                          >
                            {toggling === subject.id ? (
                              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                            ) : subject.linked ? (
                              <div className="w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-[var(--border-primary)] rounded-full flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded division setup panel */}
                      {isExpanded && (
                        <div className="bg-[hsl(var(--surface-elevated))] border border-t-0 border-[var(--border-primary)] rounded-b-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[var(--accent-text)]" />
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Division Setup
                            </p>
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Does <strong>{subject.name}</strong> have sections
                            taught by different teachers? Add divisions below.
                            Leave empty if one teacher handles the whole subject.
                          </p>

                          {/* Existing divisions */}
                          {subject.divisions.length > 0 && (
                            <div className="space-y-1.5">
                              {subject.divisions.map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center justify-between bg-[hsl(var(--accent-soft))] rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-[hsl(var(--accent-text))]">
                                      {d.name}
                                    </p>
                                    <p className="text-[10px] text-[hsl(var(--accent-strong))]">
                                      {getLevelLabel(d.levels)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteDivision(subject.id, d.id)
                                    }
                                    disabled={deletingDiv === d.id}
                                    className="p-1 text-[hsl(var(--accent-glow))] hover:text-red-500 rounded"
                                  >
                                    {deletingDiv === d.id ? (
                                      <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Template suggestions */}
                          {availableTemplates.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-semibold uppercase text-blue-500">
                                  Suggested divisions
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddAllTemplates(subject.id, subject.code)
                                  }
                                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 underline"
                                >
                                  Add all
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {availableTemplates.map((t) => (
                                  <button
                                    key={t.name}
                                    type="button"
                                    onClick={() =>
                                      handleAddTemplateDivision(
                                        subject.id,
                                        t.name,
                                        t.levels
                                      )
                                    }
                                    className="text-xs bg-[hsl(var(--surface-elevated))] text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {t.name}
                                    {t.levels.length > 0 && (
                                      <span className="text-[9px] text-blue-400 ml-0.5">
                                        ({t.levels.length === 2 && SECOND_CYCLE.every(l => t.levels.includes(l))
                                          ? "2nd cycle"
                                          : t.levels.length === 2 && t.levels.includes("Form 4") && t.levels.includes("Form 5")
                                          ? "F4/F5"
                                          : `${t.levels.length}L`})
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add custom division */}
                          <div className="border-t border-[var(--border-secondary)] pt-3 space-y-2">
                            <p className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">
                              Add custom division
                            </p>
                            <input
                              type="text"
                              value={newDivName}
                              onChange={(e) => setNewDivName(e.target.value)}
                              placeholder="e.g. Physical Chemistry"
                              className="input-field text-sm"
                            />

                            {/* Level selector */}
                            <div>
                              <p className="text-[10px] font-medium text-[var(--text-tertiary)] mb-1">
                                Applies to (leave empty for all levels):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {VALID_LEVELS.map((level) => (
                                  <button
                                    key={level}
                                    type="button"
                                    onClick={() => toggleLevel(level)}
                                    className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                                      newDivLevels.includes(level)
                                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                        : "bg-[hsl(var(--surface-elevated))] text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-[var(--accent)]"
                                    }`}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setNewDivLevels([...FIRST_CYCLE])}
                                  className="text-[10px] text-[var(--accent-text)] font-medium underline"
                                >
                                  First Cycle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewDivLevels([...SECOND_CYCLE])}
                                  className="text-[10px] text-[var(--accent-text)] font-medium underline"
                                >
                                  Second Cycle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewDivLevels([])}
                                  className="text-[10px] text-[var(--text-tertiary)] font-medium underline"
                                >
                                  All levels
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddDivision(subject.id)}
                              disabled={savingDiv || !newDivName.trim()}
                              className="btn-primary text-sm"
                            >
                              {savingDiv ? "Adding..." : "Add Division"}
                            </button>
                          </div>

                          {/* Close panel */}
                          <button
                            onClick={() => setExpandedSubject(null)}
                            className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] py-1"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
