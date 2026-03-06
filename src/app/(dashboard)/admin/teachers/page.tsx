"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Search,
  Filter,
  X,
  User,
  BookOpen,
  Calendar,
  Users,
  Share2,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface TeacherWithStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  photoUrl: string | null;
  isVerified: boolean;
  membershipStatus: "PENDING" | "ACTIVE";
  membershipId: string | null;
  createdAt: string;
  entryCount: number;
  lastEntry: string | null;
  subjects: string[];
  classes: string[];
  subjectClasses: { subject: string; classes: string[] }[];
}

function TeacherAvatar({
  teacher,
  size = "md",
}: {
  teacher: { firstName: string; lastName: string; photoUrl?: string | null };
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const radius = "rounded-xl";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";
  const imgDim = size === "lg" ? 56 : size === "sm" ? 32 : 40;
  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toUpperCase();

  if (teacher.photoUrl) {
    return (
      <Image
        src={teacher.photoUrl}
        alt={`${teacher.firstName} ${teacher.lastName}`}
        width={imgDim}
        height={imgDim}
        className={`${dims} ${radius} object-cover ring-2 ring-white shadow-sm flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dims} ${radius} bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0`}
    >
      <span className={`${textSize} font-bold text-white`}>{initials}</span>
    </div>
  );
}

function getSubjectBg(index: number): string {
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-100",
    "bg-emerald-50 text-emerald-700 border-emerald-100",
    "bg-violet-50 text-violet-700 border-violet-100",
    "bg-amber-50 text-amber-700 border-amber-100",
    "bg-rose-50 text-rose-700 border-rose-100",
    "bg-cyan-50 text-cyan-700 border-cyan-100",
  ];
  return colors[index % colors.length];
}

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [schoolCode, setSchoolCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

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

  async function handleApproveReject(teacherId: string, action: "approve" | "reject") {
    setApproving(teacherId);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "approve") {
          setTeachers((prev) =>
            prev.map((t) =>
              t.id === teacherId
                ? { ...t, membershipStatus: "ACTIVE", isVerified: true }
                : t
            )
          );
        } else {
          // Remove rejected teacher from list
          setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
        }
      }
    } catch {
      // silently fail
    } finally {
      setApproving(null);
    }
  }

  function copySchoolCode() {
    if (!schoolCode) return;
    navigator.clipboard.writeText(schoolCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleInviteByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg({ type: "ok", text: `Invitation sent to ${data.teacher.firstName} ${data.teacher.lastName}!` });
        setInviteCode("");
      } else {
        setInviteMsg({ type: "err", text: data.error || "Failed to invite" });
      }
    } catch {
      setInviteMsg({ type: "err", text: "Connection error" });
    } finally {
      setInviting(false);
    }
  }

  // Split teachers by status
  const pendingTeachers = useMemo(() =>
    teachers.filter((t) => t.membershipStatus === "PENDING"),
    [teachers]
  );
  const activeTeachers = useMemo(() =>
    teachers.filter((t) => t.membershipStatus === "ACTIVE"),
    [teachers]
  );

  // Extract unique subjects and classes from active teachers
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    activeTeachers.forEach((t) => t.subjects?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [activeTeachers]);

  const allClasses = useMemo(() => {
    const set = new Set<string>();
    activeTeachers.forEach((t) => t.classes?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [activeTeachers]);

  // Dynamic classes based on selected subject
  const filteredClassOptions = useMemo(() => {
    if (!filterSubject) return allClasses;
    const set = new Set<string>();
    activeTeachers.forEach((t) => {
      t.subjectClasses?.forEach((sc) => {
        if (sc.subject === filterSubject) {
          sc.classes.forEach((c) => set.add(c));
        }
      });
    });
    return Array.from(set).sort();
  }, [activeTeachers, filterSubject, allClasses]);

  // Filter active teachers
  const filteredTeachers = useMemo(() => {
    return activeTeachers.filter((t) => {
      const nameMatch =
        !searchQuery ||
        `${t.firstName} ${t.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterSubject && filterClass) {
        const comboMatch = t.subjectClasses?.some(
          (sc) => sc.subject === filterSubject && sc.classes.includes(filterClass)
        );
        return nameMatch && comboMatch;
      }
      if (filterSubject) {
        return nameMatch && t.subjects?.includes(filterSubject);
      }
      if (filterClass) {
        return nameMatch && t.classes?.includes(filterClass);
      }
      return nameMatch;
    });
  }, [activeTeachers, searchQuery, filterSubject, filterClass]);

  const hasActiveFilters = filterSubject || filterClass;

  function clearFilters() {
    setFilterSubject("");
    setFilterClass("");
    setSearchQuery("");
  }

  const subjectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    allSubjects.forEach((s) => map.set(s, idx++));
    return map;
  }, [allSubjects]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />

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
                <Users className="w-5 h-5 text-brand-400" />
                Manage Teachers
              </h1>
              <p className="text-brand-400/70 text-sm mt-0.5">
                {activeTeachers.length} active
                {pendingTeachers.length > 0 && ` / ${pendingTeachers.length} pending`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* School Code */}
        <div className="animate-slide-up card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50 to-transparent rounded-bl-3xl -translate-y-4 translate-x-4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-brand-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                Invite Teachers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gradient-to-r from-brand-50 to-slate-50 border border-brand-100 rounded-xl px-4 py-2.5 font-mono text-lg text-brand-950 font-black tracking-widest">
                {schoolCode || "Loading..."}
              </code>
              <button
                onClick={copySchoolCode}
                className={`p-3 rounded-xl transition-all active:scale-95 shadow-sm ${
                  copiedCode
                    ? "bg-emerald-500 text-white"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-2.5">
              Share this code with teachers to let them register under your school
            </p>
          </div>
        </div>

        {/* Invite by Teacher Code */}
        <form onSubmit={handleInviteByCode} className="animate-slide-up card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Add Existing Teacher
            </p>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3">
            Enter a teacher&apos;s unique ID to invite them to your school
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. TCH-A1B2C3"
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent tracking-wider"
            />
            <button
              type="submit"
              disabled={inviting || !inviteCode.trim()}
              className="px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors active:scale-95 disabled:opacity-50"
            >
              {inviting ? "..." : "Invite"}
            </button>
          </div>
          {inviteMsg && (
            <p className={`text-xs mt-2 font-medium ${
              inviteMsg.type === "ok" ? "text-emerald-600" : "text-red-500"
            }`}>
              {inviteMsg.text}
            </p>
          )}
        </form>

        {/* ── PENDING TEACHERS SECTION ── */}
        {pendingTeachers.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Pending Approval ({pendingTeachers.length})
              </h3>
            </div>
            <div className="space-y-2">
              {pendingTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="card overflow-hidden border-l-4 border-amber-400"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <TeacherAvatar teacher={teacher} size="md" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">
                          {teacher.firstName} {teacher.lastName}
                        </h4>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                          {teacher.email}
                        </p>
                        <p className="text-[10px] text-amber-600 font-medium mt-1">
                          Registered {formatDate(teacher.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleApproveReject(teacher.id, "approve")}
                        disabled={approving === teacher.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {approving === teacher.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleApproveReject(teacher.id, "reject")}
                        disabled={approving === teacher.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--bg-elevated)] text-red-600 text-xs font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVE TEACHERS SECTION ── */}
        {(activeTeachers.length > 0 || pendingTeachers.length > 0) && (
          <div className="flex items-center gap-2 mt-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Active Teachers ({activeTeachers.length})
            </h3>
          </div>
        )}

        {/* Search Bar */}
        {activeTeachers.length > 0 && (
          <div className="animate-slide-up animation-delay-75 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 shadow-sm ${
                hasActiveFilters
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-[var(--bg-elevated)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && <span className="w-2 h-2 bg-brand-600 rounded-full" />}
            </button>
          </div>
        )}

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="animate-slide-down card p-5 space-y-3 border-brand-100/50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-secondary)]">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline"
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
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  if (filterClass && e.target.value) {
                    const validClasses = new Set<string>();
                    activeTeachers.forEach((t) => {
                      t.subjectClasses?.forEach((sc) => {
                        if (sc.subject === e.target.value) {
                          sc.classes.forEach((c) => validClasses.add(c));
                        }
                      });
                    });
                    if (!validClasses.has(filterClass)) setFilterClass("");
                  }
                }}
                className="input-field"
              >
                <option value="">All subjects</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                {filteredClassOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {filterSubject && filterClass && (
              <p className="text-xs text-brand-700 bg-brand-50 rounded-xl px-3.5 py-2.5 border border-brand-100 font-medium">
                Showing teachers who teach <strong>{filterSubject}</strong> in{" "}
                <strong>{filterClass}</strong>
              </p>
            )}
          </div>
        )}

        {/* Results count */}
        {(searchQuery || hasActiveFilters) && (
          <p className="text-xs text-[var(--text-tertiary)] font-medium px-1">
            Showing {filteredTeachers.length} of {activeTeachers.length} teacher
            {activeTeachers.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Teachers List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="skeleton w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2" />
                    <div className="skeleton h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <User className="w-8 h-8 text-[var(--text-quaternary)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-semibold">
              {teachers.length === 0
                ? "No teachers registered yet"
                : activeTeachers.length === 0
                ? "No active teachers yet"
                : "No teachers match your search"}
            </p>
            {teachers.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
                Share the school code above with your teachers
              </p>
            ) : activeTeachers.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
                Approve pending teachers above to get started
              </p>
            ) : (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-600 font-semibold mt-2.5"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeachers.map((teacher, i) => (
              <div
                key={teacher.id}
                className="animate-slide-up card overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3.5">
                    <Link href={`/admin/teachers/${teacher.id}`} className="flex-shrink-0">
                      <TeacherAvatar teacher={teacher} size="lg" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/teachers/${teacher.id}`}
                          className="group flex-1 min-w-0"
                        >
                          <h4 className="font-bold text-[var(--text-primary)] group-hover:text-brand-700 transition-colors truncate">
                            {teacher.firstName} {teacher.lastName}
                          </h4>
                          <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                            {teacher.email}
                          </p>
                        </Link>
                        <button
                          onClick={() => toggleVerify(teacher.id)}
                          disabled={verifying === teacher.id}
                          className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 transition-all active:scale-95 flex-shrink-0 border ${
                            teacher.isVerified
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                          }`}
                        >
                          {teacher.isVerified ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Unverified
                            </>
                          )}
                        </button>
                      </div>

                      {/* Subject -> Classes mapping */}
                      {teacher.subjectClasses && teacher.subjectClasses.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {teacher.subjectClasses.map((sc) => {
                            const colorIdx = subjectColorMap.get(sc.subject) ?? 0;
                            return (
                              <div key={sc.subject} className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSubjectBg(colorIdx)}`}>
                                  {sc.subject}
                                </span>
                                <span className="text-[var(--text-quaternary)] text-[10px]">&rarr;</span>
                                {sc.classes.map((c) => (
                                  <span
                                    key={c}
                                    className="text-[10px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-secondary)]"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1 text-brand-600 font-semibold bg-brand-50 rounded-md px-2 py-0.5">
                          <BookOpen className="w-3 h-3" />
                          {teacher.entryCount} entries
                        </span>
                        {teacher.lastEntry && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(teacher.lastEntry)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
