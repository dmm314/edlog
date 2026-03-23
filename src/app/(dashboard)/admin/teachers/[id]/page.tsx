"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  Phone,
  Layers,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TeacherDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  photoUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  totalEntries: number;
  assignments: {
    id: string;
    className: string;
    classLevel: string;
    subjectName: string;
    subjectCode: string;
    entryCount: number;
    slotCount: number;
  }[];
  entries: {
    id: string;
    date: string;
    period: number | null;
    duration: number;
    notes: string | null;
    objectives: string | null;
    status: string;
    className: string;
    subject: string;
    topics: string[];
    createdAt: string;
  }[];
}

function getStatusColor(status: string) {
  switch (status) {
    case "VERIFIED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "FLAGGED": return "bg-red-50 text-red-700 border-red-100";
    case "DRAFT": return "bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)] border-[var(--border-secondary)]";
    default: return "bg-blue-50 text-blue-700 border-blue-100";
  }
}

function getSubjectColor(index: number): string {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))]",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  return colors[index % colors.length];
}

export default function TeacherDetailPage() {
  const params = useParams();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"entries" | "assignments">("entries");

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const res = await fetch(`/api/admin/teachers/${params.id}`);
        if (res.ok) {
          setTeacher(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTeacher();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-16 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
          <div className="max-w-lg mx-auto relative">
            <div className="skeleton h-4 w-28 !bg-[hsl(var(--surface-elevated))]/10 mb-4" />
            <div className="flex items-center gap-4">
              <div className="skeleton w-16 h-16 rounded-2xl !bg-[hsl(var(--surface-elevated))]/10" />
              <div>
                <div className="skeleton h-6 w-40 !bg-[hsl(var(--surface-elevated))]/15 mb-2" />
                <div className="skeleton h-4 w-24 !bg-[hsl(var(--surface-elevated))]/10" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 -mt-6 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
          <div className="max-w-lg mx-auto relative">
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Teachers
            </Link>
            <h1 className="text-xl font-bold text-white">Teacher Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toUpperCase();
  const verifiedCount = teacher.entries.filter((e) => e.status === "VERIFIED").length;
  const verifiedRate = teacher.entries.length > 0 ? Math.round((verifiedCount / teacher.entries.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header with teacher photo */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-16 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/[0.07] rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />

        <div className="max-w-lg mx-auto relative">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teachers
          </Link>

          <div className="flex items-center gap-4">
            {/* Teacher photo */}
            <div className="relative flex-shrink-0">
              {teacher.photoUrl ? (
                <Image
                  src={teacher.photoUrl}
                  alt={`${teacher.firstName} ${teacher.lastName}`}
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] rounded-2xl object-cover ring-2 ring-white/20 shadow-lg"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              {teacher.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-[hsl(var(--accent))] shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-[var(--header-text-muted)] text-sm mt-0.5 truncate">
                {teacher.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    teacher.isVerified
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-[hsl(var(--accent-soft))]0/20 text-[hsl(var(--accent-glow))]"
                  }`}
                >
                  {teacher.isVerified ? (
                    <><CheckCircle className="w-3 h-3" /> Verified</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Unverified</>
                  )}
                </span>
                {teacher.gender && (
                  <span className="text-[10px] font-medium bg-[hsl(var(--surface-elevated))]/10 text-white/70 rounded-full px-2.5 py-0.5">
                    {teacher.gender === "MALE" ? "Male" : "Female"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 max-w-lg mx-auto space-y-4">
        {/* Stats row */}
        <div className="animate-slide-up grid grid-cols-3 gap-3">
          <div className="card p-3.5 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">{teacher.totalEntries}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider mt-0.5">Entries</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">{teacher.assignments.length}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider mt-0.5">Assignments</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className={`text-xl font-bold ${verifiedRate >= 70 ? "text-emerald-600" : verifiedRate >= 40 ? "text-[hsl(var(--accent-strong))]" : "text-red-500"}`}>
              {verifiedRate}%
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider mt-0.5">Verified</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="animate-slide-up animation-delay-75 card overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Contact Information</h3>
          </div>
          <div className="divide-y divide-[var(--border-secondary)]">
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-[var(--text-secondary)] truncate">{teacher.email}</p>
              </div>
            </div>
            {teacher.phone && (
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{teacher.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Joined</p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{formatDate(teacher.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-slide-up animation-delay-150 flex gap-1 bg-[hsl(var(--surface-tertiary))] rounded-2xl p-1.5 shadow-inner-glow">
          <button
            onClick={() => setTab("entries")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === "entries"
                ? "bg-[hsl(var(--surface-elevated))] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Entries ({teacher.entries.length})
          </button>
          <button
            onClick={() => setTab("assignments")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === "assignments"
                ? "bg-[hsl(var(--surface-elevated))] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Assignments ({teacher.assignments.length})
          </button>
        </div>

        {/* Entries Tab */}
        {tab === "entries" && (
          <>
            {teacher.entries.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <BookOpen className="w-8 h-8 text-[var(--text-quaternary)]" />
                </div>
                <p className="text-[var(--text-secondary)] font-semibold">No logbook entries yet</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">This teacher hasn&apos;t submitted any entries</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {teacher.entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="card p-4 hover:-translate-y-0.5 transition-all duration-200"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          {entry.subject}
                        </span>
                        <span className="text-[10px] font-semibold bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-secondary)]">
                          {entry.className}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    {entry.topics.length > 0 && (
                      <p className="text-sm text-[var(--text-secondary)] font-medium">
                        {entry.topics.join(", ")}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1.5 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </span>
                      {entry.period && (
                        <span className="font-medium text-[var(--text-tertiary)]">Period {entry.period}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Assignments Tab */}
        {tab === "assignments" && (
          <>
            {teacher.assignments.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <GraduationCap className="w-8 h-8 text-[var(--text-quaternary)]" />
                </div>
                <p className="text-[var(--text-secondary)] font-semibold">No assignments yet</p>
                <Link
                  href="/admin/assignments"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-text)] font-semibold mt-2.5 hover:text-[var(--accent-hover)] transition-colors"
                >
                  Assign teacher to classes
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {teacher.assignments.map((a, i) => (
                  <div
                    key={a.id}
                    className="card p-4 hover:-translate-y-0.5 transition-all duration-200"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSubjectColor(i)} flex items-center justify-center shadow-sm`}>
                        <span className="text-xs font-bold text-white">{a.subjectCode.slice(0, 3)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{a.subjectName}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium">{a.className} &middot; Level {a.classLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1.5 bg-[hsl(var(--surface-tertiary))] rounded-lg px-2.5 py-1 border border-[var(--border-secondary)]">
                        <BookOpen className="w-3 h-3 text-[var(--accent-text)]" />
                        <span className="font-semibold text-[var(--text-secondary)]">{a.entryCount}</span> entries
                      </span>
                      <span className="flex items-center gap-1.5 bg-[hsl(var(--surface-tertiary))] rounded-lg px-2.5 py-1 border border-[var(--border-secondary)]">
                        <Clock className="w-3 h-3 text-[var(--accent-text)]" />
                        <span className="font-semibold text-[var(--text-secondary)]">{a.slotCount}</span> slots
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
