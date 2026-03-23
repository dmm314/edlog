"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  BookMarked,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SchoolDetail {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  principalName: string | null;
  principalPhone: string | null;
  profileComplete: boolean;
  region: string;
  regionCode: string;
  division: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  classes: {
    id: string;
    name: string;
    level: string;
    stream: string | null;
    section: string | null;
    year: number;
    entryCount: number;
    teacherCount: number;
  }[];
  teachers: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    entryCount: number;
    subjects: string[];
    classes: string[];
  }[];
  subjects: { id: string; name: string; code: string }[];
  totalEntries: number;
  teacherCount: number;
}

export default function SchoolDetailPage() {
  const { id } = useParams();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "teachers">("overview");

  useEffect(() => {
    async function fetchSchool() {
      try {
        const res = await fetch(`/api/regional/schools/${id}`);
        if (res.ok) {
          setSchool(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchSchool();
  }, [id]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]";
      case "PENDING":
        return "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))] border-[hsl(var(--accent)/0.2)]";
      case "SUSPENDED":
        return "bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.2)]";
      default:
        return "bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)] border-[var(--border-primary)]";
    }
  }

  // Group classes by level
  function groupClassesByLevel(classes: SchoolDetail["classes"]) {
    const groups: Record<string, SchoolDetail["classes"]> = {};
    const levelOrder = [
      "Form 1",
      "Form 2",
      "Form 3",
      "Form 4",
      "Form 5",
      "Lower Sixth",
      "Upper Sixth",
    ];

    for (const cls of classes) {
      if (!groups[cls.level]) groups[cls.level] = [];
      groups[cls.level].push(cls);
    }

    // Sort by level order
    const sorted: [string, SchoolDetail["classes"]][] = [];
    for (const level of levelOrder) {
      if (groups[level]) sorted.push([level, groups[level]]);
    }
    // Add any remaining levels
    for (const [level, items] of Object.entries(groups)) {
      if (!levelOrder.includes(level)) sorted.push([level, items]);
    }
    return sorted;
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg lg:max-w-4xl mx-auto">
            <div className="h-4 bg-[hsl(var(--surface-elevated))]/20 rounded w-1/3 mb-4" />
            <div className="h-6 bg-[hsl(var(--surface-elevated))]/20 rounded w-2/3" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg lg:max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
        <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg lg:max-w-4xl mx-auto">
            <Link
              href="/regional/schools"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Schools
            </Link>
            <h1 className="text-xl font-bold text-white">School Not Found</h1>
          </div>
        </div>
        <div className="px-5 mt-8 max-w-lg lg:max-w-4xl mx-auto text-center">
          <Building2 className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
          <p className="text-[var(--text-tertiary)]">This school could not be found in your region.</p>
        </div>
      </div>
    );
  }

  const classGroups = groupClassesByLevel(school.classes);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg lg:max-w-4xl mx-auto">
          <Link
            href="/regional/schools"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[hsl(var(--surface-elevated))]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {school.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[var(--header-text-muted)] text-sm font-mono">
                  {school.code}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${getStatusBadge(
                    school.status
                  )}`}
                >
                  {school.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 -mt-1 max-w-lg lg:max-w-4xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1 card p-3 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {school.teacherCount}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
              Teachers
            </p>
          </div>
          <div className="flex-1 card p-3 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {school.classes.length}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
              Classes
            </p>
          </div>
          <div className="flex-1 card p-3 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {school.totalEntries}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
              Entries
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="px-5 mt-4 max-w-lg lg:max-w-4xl mx-auto">
        <div className="flex gap-1 bg-[hsl(var(--surface-tertiary))] rounded-xl p-1">
          {(["overview", "classes", "teachers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-[hsl(var(--surface-elevated))] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg lg:max-w-4xl mx-auto space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* School Info */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                School Information
              </h3>
              <div className="space-y-3 text-sm">
                {school.schoolType && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[var(--text-tertiary)] text-xs">School Type</p>
                      <p className="text-[var(--text-primary)] font-medium">
                        {school.schoolType}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[var(--text-tertiary)] text-xs">Location</p>
                    <p className="text-[var(--text-primary)] font-medium">
                      {school.division}, {school.region} Region
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[var(--text-tertiary)] text-xs">Registered</p>
                    <p className="text-[var(--text-primary)] font-medium">
                      {formatDate(school.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Principal */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                Principal
              </h3>
              {school.principalName ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                      <span className="text-[var(--accent-text)] font-bold text-sm">
                        {school.principalName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {school.principalName}
                      </p>
                      {school.principalPhone && (
                        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {school.principalPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  No principal information provided
                </p>
              )}
            </div>

            {/* School Admin */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                School Administrator
              </h3>
              {school.admin ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[hsl(var(--accent-soft))] rounded-full flex items-center justify-center">
                      <span className="text-[hsl(var(--accent-strong))] font-bold text-sm">
                        {school.admin.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {school.admin.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {school.admin.email}
                      </p>
                      {school.admin.phone && (
                        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {school.admin.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  No administrator assigned
                </p>
              )}
            </div>

            {/* Subjects Offered */}
            {school.subjects.length > 0 && (
              <div className="card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                  Subjects Offered ({school.subjects.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {school.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs font-medium bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-strong))] px-2 py-1 rounded-lg"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CLASSES TAB */}
        {activeTab === "classes" && (
          <>
            {school.classes.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)]">No classes registered</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  The school has not set up their classes yet.
                </p>
              </div>
            ) : (
              classGroups.map(([level, classes]) => (
                <div key={level}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                    {level}
                  </h3>
                  <div className="space-y-2">
                    {classes.map((cls) => (
                      <div key={cls.id} className="card p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                              {cls.name}
                            </h4>
                            {cls.stream && (
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {cls.stream}
                                {cls.section ? ` - Section ${cls.section}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {cls.teacherCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {cls.entryCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* TEACHERS TAB */}
        {activeTab === "teachers" && (
          <>
            {school.teachers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)]">No teachers registered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {school.teachers.map((teacher) => (
                  <div key={teacher.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                          {teacher.name}
                        </h4>
                        <p className="text-xs text-[var(--text-tertiary)]">{teacher.email}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                          teacher.isVerified
                            ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                            : "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]"
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
                      </span>
                    </div>

                    {(teacher.subjects.length > 0 ||
                      teacher.classes.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teacher.subjects.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-medium bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))] px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                        {teacher.classes.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-medium bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))] px-1.5 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-tertiary)]">
                      <BookMarked className="w-3 h-3" />
                      <span>{teacher.entryCount} entries</span>
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
