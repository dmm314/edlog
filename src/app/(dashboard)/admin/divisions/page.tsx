"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Layers,
  Search,
  X,
} from "lucide-react";

interface DivisionItem {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  assignmentCount: number;
  createdAt: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  category: string | null;
  linked: boolean;
}

// Pre-defined division templates for common subjects
const DIVISION_TEMPLATES: Record<string, string[]> = {
  CHE: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
  ENG: ["Directed Writing", "Composition", "Summary & Comprehension", "Grammar & Vocabulary"],
  LIT: ["Prose", "Poetry", "Drama", "Literary Criticism"],
  FRE: ["Expression Écrite", "Compréhension", "Grammaire", "Expression Orale"],
  PHY: ["Mechanics", "Electricity & Magnetism", "Waves & Optics", "Modern Physics"],
  BIO: ["Cell Biology", "Genetics", "Ecology", "Physiology"],
  MAT: ["Pure Mathematics", "Mechanics", "Statistics"],
  ECO: ["Microeconomics", "Macroeconomics"],
  GEO: ["Physical Geography", "Human Geography"],
};

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formSubjectId, setFormSubjectId] = useState("");
  const [formName, setFormName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [divRes, subRes] = await Promise.all([
        fetch("/api/admin/divisions"),
        fetch("/api/admin/subjects"),
      ]);
      const [divData, subData] = await Promise.all([divRes.json(), subRes.json()]);

      if (divRes.ok) setDivisions(divData.divisions);
      if (subRes.ok) {
        // Show ALL subjects (divisions can be created for any subject)
        setSubjects(subData.subjects || []);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formSubjectId || !formName.trim()) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: formSubjectId, name: formName.trim() }),
      });

      if (res.ok) {
        const newDiv = await res.json();
        setDivisions((prev) => [...prev, newDiv]);
        setFormName("");
        // Keep subject selected so user can add multiple divisions
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create division");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(divId: string) {
    setDeleting(divId);
    setError("");
    try {
      const res = await fetch(`/api/admin/divisions?id=${divId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDivisions((prev) => prev.filter((d) => d.id !== divId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete division");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeleting(null);
    }
  }

  // Group divisions by subject
  const groupedBySubject = useMemo(() => {
    const filtered = divisions.filter(
      (d) =>
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, { subjectName: string; subjectCode: string; items: DivisionItem[] }> = {};
    for (const d of filtered) {
      if (!groups[d.subjectId]) {
        groups[d.subjectId] = { subjectName: d.subjectName, subjectCode: d.subjectCode, items: [] };
      }
      groups[d.subjectId].items.push(d);
    }
    return Object.entries(groups).sort(([, a], [, b]) =>
      a.subjectName.localeCompare(b.subjectName)
    );
  }, [divisions, searchQuery]);

  // Existing divisions for the selected subject (to show inline list)
  const existingForSubject = formSubjectId
    ? divisions.filter((d) => d.subjectId === formSubjectId)
    : [];

  // Template suggestions for the selected subject
  const selectedSubjectCode = formSubjectId
    ? subjects.find((s) => s.id === formSubjectId)?.code || ""
    : "";
  const templateSuggestions = DIVISION_TEMPLATES[selectedSubjectCode] || [];
  const existingNames = new Set(existingForSubject.map((d) => d.name));
  const availableTemplates = templateSuggestions.filter((t) => !existingNames.has(t));

  const [addingTemplates, setAddingTemplates] = useState(false);

  async function handleAddAllTemplates() {
    if (!formSubjectId || availableTemplates.length === 0) return;
    setAddingTemplates(true);
    setError("");

    for (const name of availableTemplates) {
      try {
        const res = await fetch("/api/admin/divisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId: formSubjectId, name }),
        });
        if (res.ok) {
          const newDiv = await res.json();
          setDivisions((prev) => [...prev, newDiv]);
        }
      } catch {
        // continue with others
      }
    }
    setAddingTemplates(false);
  }

  async function handleAddOneTemplate(name: string) {
    if (!formSubjectId) return;
    setError("");
    try {
      const res = await fetch("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: formSubjectId, name }),
      });
      if (res.ok) {
        const newDiv = await res.json();
        setDivisions((prev) => [...prev, newDiv]);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add division");
      }
    } catch {
      setError("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin/assignments"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignments
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Subject Divisions
              </h1>
              <p className="text-brand-400 text-sm mt-0.5">
                Split subjects into sections taught by different teachers
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Close" : "Add"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Info card */}
        {!loading && divisions.length === 0 && !showForm && (
          <div className="card p-4 border-l-4 border-blue-400">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-slate-900">
                  What are subject divisions?
                </p>
                <p className="text-slate-500 mt-1">
                  Some subjects like Chemistry (A-Level) are taught in parts —
                  Physical Chemistry, Organic Chemistry, Inorganic Chemistry —
                  each by a different teacher. Create divisions here, then
                  assign teachers to specific divisions.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-brand-600 font-medium mt-2 inline-block"
                >
                  Create your first division
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Add Division Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Division
            </h3>
            <p className="text-xs text-slate-400">
              Choose a parent subject and name the division (e.g. &quot;Physical Chemistry&quot; under Chemistry).
            </p>

            <div>
              <label className="label-field">Parent Subject</label>
              <select
                value={formSubjectId}
                onChange={(e) => {
                  setFormSubjectId(e.target.value);
                  setFormName("");
                }}
                className="input-field"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Show existing divisions for this subject */}
            {formSubjectId && existingForSubject.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
                  Existing divisions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {existingForSubject.map((d) => (
                    <span
                      key={d.id}
                      className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Template suggestions */}
            {formSubjectId && availableTemplates.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase text-blue-500">
                    Suggested divisions
                  </p>
                  <button
                    type="button"
                    onClick={handleAddAllTemplates}
                    disabled={addingTemplates}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    {addingTemplates ? "Adding..." : "Add all"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTemplates.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddOneTemplate(t)}
                      className="text-xs bg-white text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-x-0 top-0 border-t border-slate-200" />
              <p className="text-[10px] text-slate-400 text-center pt-2 pb-1">or add a custom division</p>
            </div>

            <div>
              <label className="label-field">Division Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Physical Chemistry"
                className="input-field"
                disabled={!formSubjectId}
              />
            </div>

            <button
              type="submit"
              disabled={saving || !formSubjectId || !formName.trim()}
              className="btn-primary text-sm"
            >
              {saving ? "Adding..." : "Add Custom Division"}
            </button>
          </form>
        )}

        {/* Search */}
        {divisions.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search divisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Divisions List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : divisions.length > 0 && groupedBySubject.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No matching divisions</p>
          </div>
        ) : (
          groupedBySubject.map(([subjectId, group]) => (
            <div key={subjectId}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                {group.subjectName} ({group.subjectCode})
              </h3>
              <div className="space-y-2">
                {group.items.map((d) => (
                  <div key={d.id} className="card p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {d.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.assignmentCount} teacher assignment{d.assignmentCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {d.assignmentCount === 0 && (
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deleting === d.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
