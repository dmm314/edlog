"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Search,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { TeacherWithStats } from "@/types";

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [schoolCode, setSchoolCode] = useState("");

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchSchoolCode();
  }, []);

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/admin/teachers");
      if (res.ok) {
        setTeachers(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchoolCode() {
    try {
      const res = await fetch("/api/admin/school");
      if (res.ok) {
        const data = await res.json();
        setSchoolCode(data.code);
      }
    } catch {
      // silently fail
    }
  }

  async function toggleVerify(teacherId: string) {
    setVerifying(teacherId);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/verify`, {
        method: "POST",
      });
      if (res.ok) {
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === teacherId ? { ...t, isVerified: !t.isVerified } : t
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setVerifying(null);
    }
  }

  function copySchoolCode() {
    if (!schoolCode) return;
    navigator.clipboard.writeText(schoolCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Extract unique subjects and classes from all teachers
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => t.subjects?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [teachers]);

  const allClasses = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => t.classes?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [teachers]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const nameMatch =
        !searchQuery ||
        `${t.firstName} ${t.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase());

      const subjectMatch =
        !filterSubject || (t.subjects && t.subjects.includes(filterSubject));

      const classMatch =
        !filterClass || (t.classes && t.classes.includes(filterClass));

      return nameMatch && subjectMatch && classMatch;
    });
  }, [teachers, searchQuery, filterSubject, filterClass]);

  const hasActiveFilters = filterSubject || filterClass;

  function clearFilters() {
    setFilterSubject("");
    setFilterClass("");
    setSearchQuery("");
  }

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
          <h1 className="text-xl font-bold text-white">Manage Teachers</h1>
          <p className="text-brand-400 text-sm mt-0.5">
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* School Code */}
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Invite Teachers — Share this code
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-lg text-brand-950 font-bold tracking-wider">
              {schoolCode || "Loading..."}
            </code>
            <button
              onClick={copySchoolCode}
              className="p-2 bg-brand-100 rounded-lg text-brand-700 hover:bg-brand-200"
            >
              {copiedCode ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Teachers enter this code when registering to join your school.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              hasActiveFilters
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 bg-brand-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div>
              <label className="label-field">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="input-field"
              >
                <option value="">All subjects</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="input-field"
              >
                <option value="">All classes</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results count */}
        {(searchQuery || hasActiveFilters) && (
          <p className="text-xs text-slate-400">
            Showing {filteredTeachers.length} of {teachers.length} teacher
            {teachers.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Teachers List */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Teachers ({filteredTeachers.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {teachers.length === 0
                ? "No teachers registered yet"
                : "No teachers match your search"}
            </p>
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-400 mt-1">
                Share the school code above with your teachers
              </p>
            ) : (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-600 font-medium mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/admin/teachers/${teacher.id}`}
                    className="flex-1 hover:opacity-80 transition-opacity"
                  >
                    <h4 className="font-semibold text-slate-900">
                      {teacher.firstName} {teacher.lastName}
                    </h4>
                    <p className="text-sm text-slate-500">{teacher.email}</p>
                  </Link>
                  <button
                    onClick={() => toggleVerify(teacher.id)}
                    disabled={verifying === teacher.id}
                    className={`flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
                      teacher.isVerified
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {teacher.isVerified ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Unverified
                      </>
                    )}
                  </button>
                </div>

                <Link href={`/admin/teachers/${teacher.id}`}>
                  {/* Subject → Classes mapping */}
                  {teacher.subjectClasses && teacher.subjectClasses.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {teacher.subjectClasses.map((sc: { subject: string; classes: string[] }) => (
                        <div key={sc.subject} className="flex items-start gap-1.5">
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                            {sc.subject}
                          </span>
                          <span className="text-slate-300 text-[10px] mt-0.5">&rarr;</span>
                          <div className="flex flex-wrap gap-1">
                            {sc.classes.map((c: string) => (
                              <span
                                key={c}
                                className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="text-brand-600 font-medium">{teacher.entryCount} entries</span>
                    {teacher.lastEntry && (
                      <>
                        <span>&middot;</span>
                        <span>Last: {formatDate(teacher.lastEntry)}</span>
                      </>
                    )}
                    <span>&middot;</span>
                    <span>Joined {formatDate(teacher.createdAt)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
