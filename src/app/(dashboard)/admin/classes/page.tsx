"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  abbreviation: string | null;
  level: string;
  stream: string | null;
  section: string | null;
  year: number;
  entryCount: number;
  teacherCount: number;
  subjectCount: number;
}

const LEVEL_ORDER = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    level: "",
    stream: "General",
    section: "",
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const res = await fetch("/api/admin/classes");
      const data = await res.json();
      if (res.ok) {
        setClasses(data.classes);
        setLevels(data.levels);
        setStreams(data.streams);
        setSections(data.sections);
      } else {
        console.error("Classes API error:", data.error);
        setError(data.error || "Failed to load classes");
      }
    } catch (e) {
      console.error("Classes fetch error:", e);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.level) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [...prev, newClass]);
        setForm({ level: "", stream: "General", section: "" });
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create class");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(classId: string) {
    setDeleting(classId);
    try {
      const res = await fetch(`/api/admin/classes?id=${classId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete class");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeleting(null);
    }
  }

  // Group classes by level
  const groupedClasses = useMemo(() => {
    const groups: [string, ClassItem[]][] = [];
    const grouped: Record<string, ClassItem[]> = {};

    for (const cls of classes) {
      if (!grouped[cls.level]) grouped[cls.level] = [];
      grouped[cls.level].push(cls);
    }

    for (const level of LEVEL_ORDER) {
      if (grouped[level]) {
        groups.push([level, grouped[level]]);
      }
    }
    // Add any remaining
    for (const [level, items] of Object.entries(grouped)) {
      if (!LEVEL_ORDER.includes(level)) {
        groups.push([level, items]);
      }
    }
    return groups;
  }, [classes]);

  // Show stream options only for Lower/Upper Sixth
  const showStreamOption =
    form.level === "Lower Sixth" || form.level === "Upper Sixth";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Manage Classes</h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {classes.length} class{classes.length !== 1 ? "es" : ""}{" "}
                registered
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Add Class Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add New Class
            </h3>

            <div>
              <label className="label-field">Level</label>
              <select
                value={form.level}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    level: e.target.value,
                    stream:
                      e.target.value === "Lower Sixth" ||
                      e.target.value === "Upper Sixth"
                        ? prev.stream
                        : "General",
                  }))
                }
                className="input-field"
              >
                <option value="">Select level</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {showStreamOption && (
              <div>
                <label className="label-field">Stream</label>
                <select
                  value={form.stream}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stream: e.target.value }))
                  }
                  className="input-field"
                >
                  {streams.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-field">Section (optional)</label>
              <select
                value={form.section}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, section: e.target.value }))
                }
                className="input-field"
              >
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Use sections if you have multiple classes at the same level
                (e.g., Form 1 A, Form 1 B)
              </p>
            </div>

            {/* Preview */}
            {form.level && (
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">Preview</p>
                <p className="font-semibold text-slate-900">
                  {form.level}
                  {form.stream && form.stream !== "General"
                    ? ` ${form.stream}`
                    : ""}
                  {form.section ? ` ${form.section}` : ""}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !form.level}
              className="btn-primary text-sm"
            >
              {saving ? "Adding..." : "Add Class"}
            </button>
          </form>
        )}

        {/* Classes List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No classes set up yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Tap &quot;Add Class&quot; to get started
            </p>
          </div>
        ) : (
          groupedClasses.map(([level, levelClasses]) => (
            <div key={level}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                {level}
              </h3>
              <div className="space-y-2">
                {levelClasses.map((cls) => (
                  <div key={cls.id} className="card p-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="flex-1 min-w-0"
                      >
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {cls.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {cls.subjectCount} subject{cls.subjectCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {cls.teacherCount} assigned
                          </span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1">
                        {cls.entryCount === 0 && (
                          <button
                            onClick={() => handleDelete(cls.id)}
                            disabled={deleting === cls.id}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <Link href={`/admin/classes/${cls.id}`}>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>
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
