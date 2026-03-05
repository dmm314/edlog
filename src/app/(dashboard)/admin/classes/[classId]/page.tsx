"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function ClassSubjectsPage() {
  const { classId } = useParams<{ classId: string }>();
  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [otherClasses, setOtherClasses] = useState<OtherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCopyFrom, setShowCopyFrom] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSubjects() {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/subjects`);
      if (res.ok) {
        const data = await res.json();
        setClassName(data.className);
        setSubjects(data.subjects);
        setOtherClasses(data.otherClasses || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
                {linkedCount} subject{linkedCount !== 1 ? "s" : ""} assigned
              </p>
            </div>
            {otherClasses.length > 0 && (
              <button
                onClick={() => setShowCopyFrom(!showCopyFrom)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-3 py-1.5"
              >
                <Copy className="w-4 h-4" />
                Copy from
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Info */}
        <div className="card p-4">
          <p className="text-sm text-slate-600">
            Select the subjects taught in this class. Subjects with divisions
            for this level are shown with their sections below. Manage divisions
            in{" "}
            <Link href="/admin/subjects" className="text-brand-600 font-medium">
              School Subjects
            </Link>
            .
          </p>
        </div>

        {/* Copy from another class */}
        {showCopyFrom && (
          <div className="card p-4 border-l-4 border-blue-400 space-y-3">
            <div className="flex items-start gap-2">
              <Copy className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Copy subjects from another class
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will add all subjects from the selected class to {className}.
                  Already-added subjects will be skipped.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {otherClasses.map((oc) => (
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

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Subjects List */}
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
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No subjects found in the system</p>
            <p className="text-sm text-slate-400 mt-1">
              Run the subject seed script to populate subjects
            </p>
          </div>
        ) : (
          groupedSubjects.map(([category, categorySubjects]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
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
                          : "hover:bg-slate-50"
                      } ${subject.divisions.length > 0 && subject.linked ? "rounded-b-none border-b-0" : ""}`}
                    >
                      <div className="text-left">
                        <h4
                          className={`font-medium text-sm ${
                            subject.linked
                              ? "text-brand-900"
                              : "text-slate-900"
                          }`}
                        >
                          {subject.name}
                        </h4>
                        <p className="text-xs text-slate-400">{subject.code}</p>
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
                          <div className="w-6 h-6 border-2 border-slate-200 rounded-full flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5 text-slate-400" />
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
                              className="text-xs bg-white text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium"
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
      </div>
    </div>
  );
}
