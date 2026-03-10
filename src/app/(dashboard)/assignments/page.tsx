"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  Clock,
  ChevronRight,
  ChevronDown,
  Search,
  Folder,
} from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface TimetableSlot {
  id: string;
  day: number;
  period: string;
  time: string;
}

interface AssignmentItem {
  id: string;
  class: { id: string; name: string; level: string; stream: string | null };
  subject: { id: string; name: string; code: string };
  entryCount: number;
  timetableSlots: TimetableSlot[];
}

interface FormGroup {
  level: string;
  assignments: AssignmentItem[];
  totalEntries: number;
  totalSlots: number;
}

export default function MyAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/teacher/assignments");
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
          // Auto-expand all levels if 3 or fewer
          const levels = new Set(data.map((a: AssignmentItem) => a.class.level));
          if (levels.size <= 3) {
            setExpandedLevels(levels as Set<string>);
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  // Filter assignments by search
  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.class.name.toLowerCase().includes(q) ||
        a.subject.name.toLowerCase().includes(q) ||
        a.class.level.toLowerCase().includes(q)
    );
  }, [assignments, searchQuery]);

  // Group by form level
  const formGroups = useMemo(() => {
    const groups: Record<string, FormGroup> = {};
    for (const a of filteredAssignments) {
      const level = a.class.level;
      if (!groups[level]) {
        groups[level] = { level, assignments: [], totalEntries: 0, totalSlots: 0 };
      }
      groups[level].assignments.push(a);
      groups[level].totalEntries += a.entryCount;
      groups[level].totalSlots += a.timetableSlots.length;
    }
    // Sort by level name (Form 1, Form 2, ... Lower Sixth, Upper Sixth)
    const levelOrder = [
      "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
      "Lower Sixth", "Upper Sixth",
    ];
    return Object.values(groups).sort((a, b) => {
      const ai = levelOrder.indexOf(a.level);
      const bi = levelOrder.indexOf(b.level);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.level.localeCompare(b.level);
    });
  }, [filteredAssignments]);

  function toggleLevel(level: string) {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Logbook
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--bg-elevated)]/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">My Assignments</h1>
              <p className="text-brand-400 text-sm">
                {assignments.length} class
                {assignments.length !== 1 ? "es" : ""} assigned
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Search / Filter */}
        {!loading && assignments.length > 2 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Filter by class or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
            <p className="text-[var(--text-tertiary)] font-medium">No assignments yet</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Your school administrator will assign you to classes and subjects.
            </p>
          </div>
        ) : formGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">No matching assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formGroups.map((group) => {
              const isExpanded = expandedLevels.has(group.level);
              return (
                <div key={group.level} className="card overflow-hidden">
                  {/* Folder header — clickable */}
                  <button
                    onClick={() => toggleLevel(group.level)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                        {group.level}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-0.5">
                        <span>
                          {group.assignments.length} class
                          {group.assignments.length !== 1 ? "es" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {group.totalEntries} entries
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded contents */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-secondary)]">
                      {group.assignments.map((a, idx) => (
                        <Link
                          key={a.id}
                          href={`/logbook/new?classId=${a.class.id}&subjectId=${a.subject.id}`}
                          className={`block p-4 hover:bg-[var(--bg-tertiary)] transition-colors ${
                            idx > 0 ? "border-t border-[var(--border-secondary)]" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
                                  {a.subject.name}
                                </span>
                                <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                  {a.class.name}
                                </span>
                              </div>

                              {/* Timetable slots */}
                              {a.timetableSlots.length > 0 && (
                                <div className="mt-2 space-y-0.5">
                                  {a.timetableSlots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]"
                                    >
                                      <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                                      <span className="font-medium">
                                        {DAY_NAMES[slot.day] || `Day ${slot.day}`}
                                      </span>
                                      <span className="text-[var(--text-tertiary)] flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {slot.period} ({slot.time})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {a.timetableSlots.length === 0 && (
                                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 italic">
                                  No timetable slots
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] flex-shrink-0 ml-2">
                              <BookOpen className="w-3.5 h-3.5" />
                              {a.entryCount}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
