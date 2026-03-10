"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Users,
  Crown,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
} from "lucide-react";

interface ModuleData {
  module: string;
  schoolCount: number;
  totalEntries: number;
  schools: { name: string; entries: number }[];
}

interface SubjectTeacherData {
  subject: string;
  totalTeachers: number;
  schools: {
    name: string;
    teacherCount: number;
    teachers: string[];
  }[];
}

interface HODData {
  subject: string;
  hodCount: number;
  schools: {
    school: string;
    teacher: string;
    email: string;
  }[];
}

interface AnalysisData {
  moduleCompletion: ModuleData[];
  teachersBySubject: SubjectTeacherData[];
  hodsBySubject: HODData[];
}

export default function RegionalAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"modules" | "teachers" | "hods">(
    "modules"
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/regional/analysis");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            Deep Analysis
          </h1>
          <p className="text-violet-400/70 text-sm mt-0.5">
            Module completion, teachers, and HODs across schools
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Tab switcher */}
        <div className="flex bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] p-1">
          {[
            { key: "modules" as const, label: "Modules", icon: BookOpen },
            { key: "teachers" as const, label: "Teachers", icon: Users },
            { key: "hods" as const, label: "HODs", icon: Crown },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setExpanded(new Set());
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-tertiary)]">Failed to load analysis data</p>
          </div>
        ) : activeTab === "modules" ? (
          /* Module Completion */
          <>
            <p className="text-xs text-[var(--text-tertiary)]">
              {data.moduleCompletion.length} modules tracked across schools
            </p>
            {data.moduleCompletion.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)] text-sm">No module data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.moduleCompletion.map((mod) => {
                  const isOpen = expanded.has(mod.module);
                  return (
                    <div key={mod.module} className="card overflow-hidden">
                      <button
                        onClick={() => toggle(mod.module)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                              {mod.module}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {mod.schoolCount} school{mod.schoolCount !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {mod.totalEntries} entries
                              </span>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-[var(--border-secondary)]">
                          <div className="pt-3 space-y-2">
                            {mod.schools.map((s) => (
                              <div
                                key={s.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-[var(--text-secondary)] truncate">
                                  {s.name}
                                </span>
                                <span className="text-[var(--text-primary)] font-bold tabular-nums flex-shrink-0 ml-2">
                                  {s.entries}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === "teachers" ? (
          /* Teachers per Subject */
          <>
            <p className="text-xs text-[var(--text-tertiary)]">
              {data.teachersBySubject.length} subjects with teacher assignments
            </p>
            {data.teachersBySubject.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)] text-sm">No teacher data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.teachersBySubject.map((sub) => {
                  const isOpen = expanded.has(sub.subject);
                  return (
                    <div key={sub.subject} className="card overflow-hidden">
                      <button
                        onClick={() => toggle(sub.subject)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">
                              {sub.subject}
                            </h4>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {sub.totalTeachers} teacher{sub.totalTeachers !== 1 ? "s" : ""} across{" "}
                              {sub.schools.length} school{sub.schools.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-violet-600 tabular-nums">
                              {sub.totalTeachers}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                            )}
                          </div>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-[var(--border-secondary)]">
                          <div className="pt-3 space-y-3">
                            {sub.schools.map((s) => (
                              <div key={s.name}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                                    {s.name}
                                  </span>
                                  <span className="text-xs text-[var(--text-tertiary)]">
                                    {s.teacherCount} teacher{s.teacherCount !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {s.teachers.map((t) => (
                                    <span
                                      key={t}
                                      className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* HODs */
          <>
            <p className="text-xs text-[var(--text-tertiary)]">
              {data.hodsBySubject.length} subjects with HOD assignments
            </p>
            {data.hodsBySubject.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-[var(--text-tertiary)] text-sm">
                  No HODs assigned yet
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  School admins can assign HODs from their dashboard
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.hodsBySubject.map((sub) => {
                  const isOpen = expanded.has(`hod-${sub.subject}`);
                  return (
                    <div
                      key={sub.subject}
                      className="card overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(`hod-${sub.subject}`)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">
                              {sub.subject}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md">
                              {sub.hodCount} HOD{sub.hodCount !== 1 ? "s" : ""}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                            )}
                          </div>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-[var(--border-secondary)]">
                          <div className="pt-3 space-y-2">
                            {sub.schools.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {h.teacher}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-tertiary)]">
                                    {h.email}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-tertiary)] px-2 py-0.5 rounded border border-[var(--border-primary)]">
                                  {h.school}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
