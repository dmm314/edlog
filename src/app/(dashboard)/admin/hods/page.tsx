"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  Users,
} from "lucide-react";

interface HODItem {
  id: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string | null;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export default function HODsPage() {
  const [hods, setHods] = useState<HODItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [divisionsBySubject, setDivisionsBySubject] = useState<Record<string, { id: string; name: string }[]>>({});
  const [teacherCountBySubject, setTeacherCountBySubject] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/hods");
      if (res.ok) {
        const data = await res.json();
        setHods(data.hods);
        setTeachers(data.teachers);
        setSubjects(data.subjects);
        setDivisionsBySubject(data.divisionsBySubject || {});
        setTeacherCountBySubject(data.teacherCountBySubject || {});
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!formSubjectId || !formTeacherId) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/hods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: formTeacherId,
          subjectId: formSubjectId,
        }),
      });

      if (res.ok) {
        const newHod = await res.json();
        setHods((prev) => {
          // Replace if same subject, otherwise add
          const filtered = prev.filter(
            (h) => h.subject.id !== newHod.subject.id
          );
          return [...filtered, newHod];
        });
        setFormSubjectId("");
        setFormTeacherId("");
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to assign HOD");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(hodId: string) {
    setDeleting(hodId);
    setError("");
    try {
      const res = await fetch(`/api/admin/hods?id=${hodId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHods((prev) => prev.filter((h) => h.id !== hodId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove HOD");
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setDeleting(null);
    }
  }

  // Subjects without an HOD assigned
  const assignedSubjectIds = new Set(hods.map((h) => h.subject.id));
  const unassignedSubjects = subjects.filter(
    (s) => !assignedSubjectIds.has(s.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Heads of Department
              </h1>
              <p className="text-brand-400/70 text-sm mt-0.5">
                Assign HODs to oversee subject departments
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
              }}
              className="flex items-center gap-1.5 bg-[var(--bg-elevated)]/10 hover:bg-[var(--bg-elevated)]/20 text-white text-sm rounded-lg px-3 py-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Assign
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Info card */}
        {!loading && hods.length === 0 && !showForm && (
          <div className="card p-4 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--text-primary)]">
                  What are Heads of Department?
                </p>
                <p className="text-[var(--text-tertiary)] mt-1">
                  An HOD is a teacher designated to oversee a subject department.
                  They can view logbook entries of all teachers teaching their
                  subject (including all divisions like Physical Chemistry,
                  Organic Chemistry, etc.), helping ensure quality and completeness.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-brand-600 font-medium mt-2 inline-block"
                >
                  Assign your first HOD
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Assign Form */}
        {showForm && (
          <form onSubmit={handleAssign} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Assign HOD
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Select a subject and a verified teacher. One HOD per subject.
            </p>

            <div>
              <label className="label-field">Subject</label>
              <select
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="input-field"
              >
                <option value="">Select subject</option>
                {/* Show unassigned first, then all for reassignment */}
                {unassignedSubjects.length > 0 && (
                  <optgroup label="Unassigned">
                    {unassignedSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                )}
                {hods.length > 0 && (
                  <optgroup label="Reassign existing">
                    {hods.map((h) => (
                      <option key={h.subject.id} value={h.subject.id}>
                        {h.subject.name} ({h.subject.code}) — currently{" "}
                        {h.teacher.firstName} {h.teacher.lastName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="label-field">Teacher</label>
              <select
                value={formTeacherId}
                onChange={(e) => setFormTeacherId(e.target.value)}
                className="input-field"
                disabled={!formSubjectId}
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || !formSubjectId || !formTeacherId}
              className="btn-primary text-sm"
            >
              {saving ? "Assigning..." : "Assign as HOD"}
            </button>
          </form>
        )}

        {/* HODs List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hods.length === 0 && !showForm ? null : (
          <div className="space-y-3">
            {hods.map((hod) => (
              <div
                key={hod.id}
                className="card overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {hod.teacher.firstName[0]}
                        {hod.teacher.lastName[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">
                            {hod.teacher.firstName} {hod.teacher.lastName}
                          </h4>
                          <p className="text-[11px] text-[var(--text-tertiary)]">
                            {hod.teacher.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(hod.id)}
                          disabled={deleting === hod.id}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          HOD
                        </span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          {hod.subject.name}
                        </span>
                        {(teacherCountBySubject[hod.subject.id] || 0) > 0 && (
                          <span className="text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-md border border-[var(--border-primary)] flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {teacherCountBySubject[hod.subject.id]} assigned
                          </span>
                        )}
                      </div>
                      {divisionsBySubject[hod.subject.id] && divisionsBySubject[hod.subject.id].length > 0 && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <Layers className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {divisionsBySubject[hod.subject.id].map((d) => (
                              <span
                                key={d.id}
                                className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100"
                              >
                                {d.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && hods.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Department Coverage
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-emerald-700">
                  {hods.length}
                </p>
                <p className="text-[10px] text-emerald-600 uppercase font-semibold">
                  HODs Assigned
                </p>
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 text-center">
                <p className="text-xl font-black text-[var(--text-secondary)]">
                  {subjects.length - hods.length}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                  Subjects Unassigned
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
