// ============================================================
// CLASS DETAIL PAGE — Subjects & Divisions management
// ============================================================
//
// This page has TWO tabs:
//
// 1. SUBJECTS TAB — Toggle which subjects are taught in this class.
//    - Subjects come from the global Subject table (seeded via prisma/seed)
//    - Toggling links/unlinks a ClassSubject record
//    - "Copy from" copies another class's subject list
//    - "Sync" pushes subjects to the counterpart class
//      (Lower Sixth <-> Upper Sixth)
//
// 2. DIVISIONS TAB — Split a subject into parts taught by
//    different teachers (e.g. Chemistry -> Physical / Organic).
//    - DIVISION_TEMPLATES: pre-defined suggestions per subject code
//    - Custom divisions can be added with level restrictions
//    - Divisions are stored in SubjectDivision (school-specific)
//    - API: /api/admin/divisions (POST, DELETE, PATCH)
//
// HOW TO ADD DIVISION TEMPLATES FOR A NEW SUBJECT:
//   1. Find DIVISION_TEMPLATES below (~line 51)
//   2. Add a new key matching the subject code (e.g. "ICT")
//   3. Each template: { name: "Part Name", levels: [...] }
//      - levels: [] means all levels, or specify e.g. ["Lower Sixth"]
//
// RELATED FILES:
//   - API (subjects):  api/admin/classes/[classId]/subjects/route.ts
//   - API (divisions): api/admin/divisions/route.ts
//   - Schema:          prisma/schema.prisma (ClassSubject, SubjectDivision)
//   - Curriculum:      prisma/seed/curriculum-other.ts (subject definitions)
// ============================================================

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Plus,
  Search,
  Copy,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
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

interface OtherClass {
  id: string;
  name: string;
  subjectCount: number;
  subjectIds: string[];
}

const VALID_LEVELS = [
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
  "Lower Sixth", "Upper Sixth",
];

const FIRST_CYCLE = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];
const SECOND_CYCLE = ["Lower Sixth", "Upper Sixth"];

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

type Tab = "subjects" | "divisions";

// Helper to find the matching counterpart class name
// e.g. "Lower Sixth Science A" <-> "Upper Sixth Science A"
function getCounterpartClassName(className: string): string | null {
  if (className.startsWith("Lower Sixth")) {
    return className.replace("Lower Sixth", "Upper Sixth");
  }
  if (className.startsWith("Upper Sixth")) {
    return className.replace("Upper Sixth", "Lower Sixth");
  }
  return null;
}

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [otherClasses, setOtherClasses] = useState<OtherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCopyFrom, setShowCopyFrom] = useState(false);
  const [copying, setCopying] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("subjects");
  const [syncing, setSyncing] = useState(false);

  // Division state
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newDivName, setNewDivName] = useState("");
  const [newDivLevels, setNewDivLevels] = useState<string[]>([]);
  const [savingDiv, setSavingDiv] = useState(false);
  const [deletingDiv, setDeletingDiv] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/subjects`);
      if (res.ok) {
        const data = await res.json();
        setClassName(data.className);
        setSubjects(data.subjects);
        setOtherClasses(data.otherClasses || []);
      }
    } catch {
      setError("Failed to load class data");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  async function toggleSubject(subjectId: string, currentlyLinked: boolean) {
    setToggling(subjectId);
    setError("");

    try {
      if (currentlyLinked) {
        const res = await fetch(
          `/api/admin/classes/${classId}/subjects?subjectId=${subjectId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, linked: false } : s
            )
          );
        } else {
          const data = await res.json();
          setError(data.error || "Failed to remove subject");
        }
      } else {
        const res = await fetch(`/api/admin/classes/${classId}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectIds: [subjectId] }),
        });
        if (res.ok) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, linked: true } : s
            )
          );
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

  async function handleCopyFrom(sourceClass: OtherClass) {
    setCopying(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectIds: sourceClass.subjectIds }),
      });
      if (res.ok) {
        const copiedIds = new Set(sourceClass.subjectIds);
        setSubjects((prev) =>
          prev.map((s) =>
            copiedIds.has(s.id) ? { ...s, linked: true } : s
          )
        );
        setShowCopyFrom(false);
        setSuccessMsg(`Copied ${sourceClass.subjectIds.length} subjects from ${sourceClass.name}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to copy subjects");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCopying(false);
    }
  }

  // Sync subjects to counterpart class (Lower Sixth <-> Upper Sixth)
  async function handleSyncCounterpart() {
    const counterpartName = getCounterpartClassName(className);
    if (!counterpartName) return;

    const counterpart = otherClasses.find((c) => c.name === counterpartName);
    if (!counterpart) {
      setError(`Counterpart class "${counterpartName}" not found. Create it first.`);
      return;
    }

    setSyncing(true);
    setError("");

    try {
      const linkedSubjectIds = subjects.filter((s) => s.linked).map((s) => s.id);
      const res = await fetch(`/api/admin/classes/${counterpart.id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectIds: linkedSubjectIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Synced ${data.added || linkedSubjectIds.length} subjects to ${counterpartName}`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to sync subjects");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSyncing(false);
    }
  }

  // Division handlers
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

  const linkedCount = subjects.filter((s) => s.linked).length;
  const linkedSubjects = subjects.filter((s) => s.linked);
  const totalDivisions = linkedSubjects.reduce((sum, s) => sum + s.divisions.length, 0);

  // Check if this is a Lower/Upper Sixth class that can sync
  const counterpartName = getCounterpartClassName(className);
  const hasCounterpart = counterpartName ? otherClasses.some((c) => c.name === counterpartName) : false;

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
    const list = activeTab === "subjects" ? filteredSubjects : filteredSubjects.filter((s) => s.linked);
    for (const s of list) {
      const cat = s.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSubjects, activeTab]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {loading ? "Loading..." : className}
              </h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {linkedCount} subject{linkedCount !== 1 ? "s" : ""} &middot; {totalDivisions} division{totalDivisions !== 1 ? "s" : ""}
              </p>
            </div>
            {activeTab === "subjects" && otherClasses.length > 0 && (
              <button
                onClick={() => setShowCopyFrom(!showCopyFrom)}
                className="flex items-center gap-1.5 bg-[var(--bg-elevated)]/10 hover:bg-[var(--bg-elevated)]/20 text-white text-sm rounded-lg px-3 py-1.5"
              >
                <Copy className="w-4 h-4" />
                Copy from
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="px-5 mt-4 max-w-lg mx-auto">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["subjects", "divisions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(""); setExpandedSubject(null); }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab === "subjects" ? (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  Subjects ({linkedCount})
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  Divisions ({totalDivisions})
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Success message */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Copy from another class */}
        {showCopyFrom && activeTab === "subjects" && (
          <div className="card p-4 border-l-4 border-blue-400 space-y-3">
            <div className="flex items-start gap-2">
              <Copy className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Copy subjects from another class
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  This will add all subjects from the selected class to {className}.
                  Already-added subjects will be skipped.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {otherClasses.filter((oc) => oc.subjectCount > 0).map((oc) => (
                <button
                  key={oc.id}
                  onClick={() => handleCopyFrom(oc)}
                  disabled={copying}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2.5 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {oc.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {oc.subjectCount} subject{oc.subjectCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Copy className="w-4 h-4 text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sync counterpart (Lower Sixth <-> Upper Sixth) */}
        {activeTab === "subjects" && hasCounterpart && linkedCount > 0 && (
          <div className="card p-3 border-l-4 border-violet-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  Sync these {linkedCount} subjects to <strong>{counterpartName}</strong>
                </p>
              </div>
              <button
                onClick={handleSyncCounterpart}
                disabled={syncing}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                {syncing ? "Syncing..." : "Sync"}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder={activeTab === "subjects" ? "Search all subjects..." : "Search subjects with divisions..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* SUBJECTS TAB */}
        {activeTab === "subjects" && (
          <>
            {/* Info */}
            <div className="card p-3">
              <p className="text-xs text-[var(--text-tertiary)]">
                Toggle subjects taught in <strong>{className}</strong>. Each class has its own subject list.
                Manage divisions in the Divisions tab.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)]">No subjects found in the system</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Add subjects to your school first in{" "}
                  <Link href="/admin/subjects" className="text-brand-600 font-medium">
                    School Subjects
                  </Link>
                </p>
              </div>
            ) : (
              groupedSubjects.map(([category, categorySubjects]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1.5">
                    {categorySubjects.map((subject) => (
                      <div key={subject.id}>
                        <button
                          onClick={() =>
                            toggleSubject(subject.id, subject.linked)
                          }
                          disabled={toggling === subject.id}
                          className={`w-full card p-3 flex items-center justify-between transition-colors ${
                            subject.linked
                              ? "bg-brand-50 border-brand-200"
                              : "hover:bg-[var(--bg-tertiary)]"
                          } ${subject.divisions.length > 0 && subject.linked ? "rounded-b-none border-b-0" : ""}`}
                        >
                          <div className="text-left">
                            <h4
                              className={`font-medium text-sm ${
                                subject.linked
                                  ? "text-brand-900"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {subject.name}
                            </h4>
                            <p className="text-xs text-[var(--text-tertiary)]">{subject.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {subject.divisions.length > 0 && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                <Layers className="w-3 h-3" />
                                {subject.divisions.length} div.
                              </span>
                            )}
                            {toggling === subject.id ? (
                              <div className="w-6 h-6 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
                            ) : subject.linked ? (
                              <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-[var(--border-primary)] rounded-full flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              </div>
                            )}
                          </div>
                        </button>
                        {/* Show divisions when subject is linked and has divisions */}
                        {subject.linked && subject.divisions.length > 0 && (
                          <div className="bg-amber-50/50 border border-t-0 border-amber-200 rounded-b-xl px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-1.5 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              Divisions (taught by different teachers)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {subject.divisions.map((d) => (
                                <span
                                  key={d.id}
                                  className="text-xs bg-[var(--bg-elevated)] text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium"
                                >
                                  {d.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* DIVISIONS TAB */}
        {activeTab === "divisions" && (
          <>
            {/* Info */}
            <div className="card p-3">
              <p className="text-xs text-[var(--text-tertiary)]">
                Set up <strong>divisions</strong> for subjects in <strong>{className}</strong>.
                Divisions let you split a subject into parts taught by different teachers
                (e.g. Physical Chemistry, Organic Chemistry).
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : linkedSubjects.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)]">No subjects added yet</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Add subjects in the Subjects tab first
                </p>
                <button
                  onClick={() => setActiveTab("subjects")}
                  className="text-sm text-brand-600 font-semibold mt-3"
                >
                  Go to Subjects
                </button>
              </div>
            ) : groupedSubjects.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)]">No matching subjects</p>
              </div>
            ) : (
              groupedSubjects.map(([category, categorySubjects]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1.5">
                    {categorySubjects.map((subject) => {
                      const isExpanded = expandedSubject === subject.id;
                      const templates = DIVISION_TEMPLATES[subject.code] || [];
                      const existingNames = new Set(subject.divisions.map((d) => d.name));
                      const availableTemplates = templates.filter(
                        (t) => !existingNames.has(t.name)
                      );

                      return (
                        <div key={subject.id}>
                          {/* Subject row */}
                          <div
                            className={`card p-3 flex items-center justify-between transition-colors bg-brand-50 border-brand-200 ${
                              isExpanded ? "rounded-b-none border-b-0" : ""
                            }`}
                          >
                            <button
                              onClick={() => handleExpandSubject(subject.id)}
                              className="flex-1 text-left flex items-center gap-2 min-w-0"
                            >
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm text-brand-900">
                                  {subject.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-[var(--text-tertiary)]">
                                    {subject.code}
                                  </span>
                                  {subject.divisions.length > 0 ? (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                      <Layers className="w-3 h-3" />
                                      {subject.divisions.length} division{subject.divisions.length !== 1 ? "s" : ""}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[var(--text-tertiary)] bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                      No divisions
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => handleExpandSubject(subject.id)}
                              className="p-1 text-[var(--text-tertiary)] hover:text-brand-600 rounded"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Expanded division setup panel */}
                          {isExpanded && (
                            <div className="bg-[var(--bg-elevated)] border border-t-0 border-brand-200 rounded-b-xl p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-600" />
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
                                      className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-amber-900">
                                          {d.name}
                                        </p>
                                        <p className="text-[10px] text-amber-600">
                                          {getLevelLabel(d.levels)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDeleteDivision(subject.id, d.id)
                                        }
                                        disabled={deletingDiv === d.id}
                                        className="p-1 text-amber-400 hover:text-red-500 rounded"
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
                                        className="text-xs bg-[var(--bg-elevated)] text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
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
                                            ? "bg-brand-600 text-white border-brand-600"
                                            : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-brand-300"
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
                                      className="text-[10px] text-brand-600 font-medium underline"
                                    >
                                      First Cycle
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewDivLevels([...SECOND_CYCLE])}
                                      className="text-[10px] text-brand-600 font-medium underline"
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
          </>
        )}
      </div>
    </div>
  );
}
