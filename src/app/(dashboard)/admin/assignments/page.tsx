"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UserCheck,
  Search,
  BookOpen,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface DivisionOption {
  id: string;
  name: string;
}

interface AssignmentItem {
  id: string;
  teacher: { id: string; name: string };
  class: { id: string; name: string; level: string };
  subject: { id: string; name: string; code: string };
  division: DivisionOption | null;
  entryCount: number;
  timetableSlots: number;
  createdAt: string;
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
}

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

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsByClass, setSubjectsByClass] = useState<
    Record<string, SubjectOption[]>
  >({});
  const [divisionsBySubject, setDivisionsBySubject] = useState<
    Record<string, DivisionOption[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");

  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
    divisionId: "",
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/admin/assignments");
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments);
        setTeachers(data.teachers);
        setClasses(data.classes);
        setSubjects(data.subjects);
        setSubjectsByClass(data.subjectsByClass || {});
        setDivisionsBySubject(data.divisionsBySubject || {});
      } else {
        console.error("Assignments API error:", data.error);
        setError(data.error || "Failed to load assignments data");
      }
    } catch (e) {
      console.error("Assignments fetch error:", e);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teacherId || !form.classId || !form.subjectId) return;

    // If subject has divisions, a division must be selected
    const subjectDivisions = divisionsBySubject[form.subjectId] || [];
    if (subjectDivisions.length > 0 && !form.divisionId) {
      setError("Please select a division for this subject");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: form.teacherId,
          classId: form.classId,
          subjectId: form.subjectId,
          divisionId: form.divisionId || undefined,
        }),
      });

      if (res.ok) {
        const newAssignment = await res.json();
        setAssignments((prev) => [...prev, newAssignment]);
        setForm({ teacherId: "", classId: "", subjectId: "", divisionId: "" });
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create assignment");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assignmentId: string) {
    setDeleting(assignmentId);
    setError("");
    try {
      const res = await fetch(`/api/admin/assignments?id=${assignmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete assignment");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeleting(null);
    }
  }

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const divisionName = a.division?.name || "";
      const searchMatch =
        !searchQuery ||
        a.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.class.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        divisionName.toLowerCase().includes(searchQuery.toLowerCase());

      const teacherMatch =
        !filterTeacher || a.teacher.id === filterTeacher;

      return searchMatch && teacherMatch;
    });
  }, [assignments, searchQuery, filterTeacher]);

  // Group assignments by teacher
  const groupedByTeacher = useMemo(() => {
    const groups: Record<
      string,
      { name: string; assignments: AssignmentItem[] }
    > = {};
    for (const a of filteredAssignments) {
      if (!groups[a.teacher.id]) {
        groups[a.teacher.id] = { name: a.teacher.name, assignments: [] };
      }
      groups[a.teacher.id].assignments.push(a);
    }
    return Object.entries(groups).sort(([, a], [, b]) =>
      a.name.localeCompare(b.name)
    );
  }, [filteredAssignments]);

  // Subjects available for the selected class
  const availableSubjects = form.classId
    ? subjectsByClass[form.classId] || []
    : [];

  // Divisions available for the selected subject
  const availableDivisions = form.subjectId
    ? divisionsBySubject[form.subjectId] || []
    : [];

  const hasSetup = teachers.length > 0 && classes.length > 0 && subjects.length > 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
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
              <h1 className="text-xl font-bold text-white">
                Assign Teachers
              </h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {assignments.length} assignment
                {assignments.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasSetup && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setError("");
                  }}
                  className="flex items-center gap-1.5 bg-[var(--bg-elevated)]/10 hover:bg-[var(--bg-elevated)]/20 text-white text-sm rounded-lg px-3 py-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Assign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Setup warnings */}
        {!loading && !hasSetup && (
          <div className="card p-4 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-[var(--text-primary)]">
                  Setup required before assigning teachers
                </p>
                {teachers.length === 0 && (
                  <p className="text-[var(--text-tertiary)]">
                    No verified teachers found.{" "}
                    <Link
                      href="/admin/teachers"
                      className="text-brand-600 font-medium"
                    >
                      Verify teachers
                    </Link>
                  </p>
                )}
                {classes.length === 0 && (
                  <p className="text-[var(--text-tertiary)]">
                    No classes created.{" "}
                    <Link
                      href="/admin/classes"
                      className="text-brand-600 font-medium"
                    >
                      Add classes
                    </Link>
                  </p>
                )}
                {subjects.length === 0 && (
                  <p className="text-[var(--text-tertiary)]">
                    No subjects assigned to any class.{" "}
                    <Link
                      href="/admin/classes"
                      className="text-brand-600 font-medium"
                    >
                      Manage class subjects
                    </Link>
                  </p>
                )}
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

        {/* Add Assignment Form */}
        {showForm && hasSetup && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              New Assignment
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Assign a teacher to teach a subject in a specific class.
            </p>

            <div>
              <label className="label-field">Teacher</label>
              <select
                value={form.teacherId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, teacherId: e.target.value }))
                }
                className="input-field"
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Class</label>
              <select
                value={form.classId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    classId: e.target.value,
                    subjectId: "",
                    divisionId: "",
                  }))
                }
                className="input-field"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Subject</label>
              <select
                value={form.subjectId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subjectId: e.target.value,
                    divisionId: "",
                  }))
                }
                className="input-field"
                disabled={!form.classId}
              >
                <option value="">
                  {!form.classId
                    ? "Select a class first"
                    : availableSubjects.length === 0
                    ? "No subjects — add them in Classes"
                    : "Select subject"}
                </option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {form.classId && availableSubjects.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  This class has no subjects.{" "}
                  <Link
                    href={`/admin/classes/${form.classId}`}
                    className="text-brand-600 font-medium"
                  >
                    Add subjects
                  </Link>
                </p>
              )}
            </div>

            {/* Division picker — only shows when subject has divisions */}
            {form.subjectId && availableDivisions.length > 0 && (
              <div>
                <label className="label-field">
                  Division
                  <span className="text-amber-600 ml-1">(required)</span>
                </label>
                <select
                  value={form.divisionId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, divisionId: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select division</option>
                  {availableDivisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  This subject has been divided into sections. Each teacher should be assigned to a specific division.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                saving ||
                !form.teacherId ||
                !form.classId ||
                !form.subjectId ||
                (availableDivisions.length > 0 && !form.divisionId)
              }
              className="btn-primary text-sm"
            >
              {saving ? "Assigning..." : "Create Assignment"}
            </button>
          </form>
        )}

        {/* Search */}
        {assignments.length > 0 && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-secondary)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignments List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)]">No assignments yet</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Assign teachers to classes and subjects to get started
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">No matching assignments</p>
          </div>
        ) : (
          groupedByTeacher.map(([teacherId, group]) => (
            <div key={teacherId}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                {group.name}
              </h3>
              <div className="space-y-2">
                {group.assignments.map((a) => (
                  <div key={a.id} className="card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {a.subject.name}
                          </span>
                          {a.division && (
                            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              {a.division.name}
                            </span>
                          )}
                          <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            {a.class.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-tertiary)]">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {a.entryCount} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {a.timetableSlots} slots
                          </span>
                        </div>
                      </div>
                      {a.entryCount === 0 && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
