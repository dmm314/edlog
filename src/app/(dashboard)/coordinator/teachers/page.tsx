"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen, TrendingUp } from "lucide-react";

interface TeacherRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
  subjects: { id: string; name: string; code: string }[];
  classes: { id: string; name: string; level: string }[];
  entryCountThisMonth: number;
}

interface CoordinatorInfo {
  title: string;
  levels: string[];
}

function TeacherInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
      style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}
    >
      {firstName[0]}{lastName[0]}
    </div>
  );
}

export default function CoordinatorTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [teachersRes, checkRes] = await Promise.all([
          fetch("/api/coordinator/teachers"),
          fetch("/api/coordinator/check"),
        ]);

        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setTeachers(data.teachers || []);
        } else {
          const err = await teachersRes.json();
          setError(err.error || "Failed to load teachers");
        }

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCoordinator({
            title: checkData.title || "Level Coordinator",
            levels: checkData.levels || [],
          });
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const levelSummary = coordinator?.levels.join(", ") || "";

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-8 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Coordinator
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[hsl(var(--accent)/0.7)]" />
            <h1 className="text-xl font-bold text-white">Teachers</h1>
          </div>
          <p className="text-white/60 text-sm">
            {levelSummary ? `Teaching at ${levelSummary}` : "At your assigned levels"}
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 bg-[hsl(var(--danger)/0.1)] border border-[hsl(var(--danger)/0.2)] text-[hsl(var(--danger))] text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--skeleton-base)]" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-quaternary)" }} />
            <p className="font-bold text-[var(--text-primary)]">No teachers found</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              No teachers have assignments at your assigned levels yet.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 px-1">
              {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} — entries this month
            </p>
            <div className="space-y-3">
              {teachers.map((teacher) => {
                const subjectNames = teacher.subjects.map((s) => s.name).join(", ");
                const classNames = teacher.classes.map((c) => c.name).join(", ");
                const entryCount = teacher.entryCountThisMonth;

                // Simple compliance indicator: more entries = better
                const indicatorColor = entryCount >= 15
                  ? "hsl(var(--success))"
                  : entryCount >= 5
                  ? "hsl(var(--accent-glow))"
                  : "hsl(var(--danger))";

                return (
                  <div key={teacher.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <TeacherInitials
                        firstName={teacher.firstName}
                        lastName={teacher.lastName}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                              {teacher.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <TrendingUp className="w-3 h-3" style={{ color: indicatorColor }} />
                            <span
                              className="text-xs font-bold tabular-nums"
                              style={{ color: indicatorColor }}
                            >
                              {entryCount}
                            </span>
                          </div>
                        </div>

                        {subjectNames && (
                          <div className="flex items-start gap-1.5 mt-2">
                            <BookOpen className="w-3 h-3 text-[var(--text-quaternary)] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                              {subjectNames}
                            </p>
                          </div>
                        )}

                        {classNames && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {teacher.classes.slice(0, 4).map((cls) => (
                              <span
                                key={cls.id}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{
                                  background: "hsl(var(--accent-soft))",
                                  color: "hsl(var(--accent-text))",
                                }}
                              >
                                {cls.name}
                              </span>
                            ))}
                            {teacher.classes.length > 4 && (
                              <span className="text-[10px] text-[var(--text-quaternary)]">
                                +{teacher.classes.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
