"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  Clock,
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

export default function MyAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/teacher/assignments");
        if (res.ok) {
          setAssignments(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
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
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No assignments yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Your school administrator will assign you to classes and subjects.
            </p>
          </div>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-brand-950">
                      {a.subject.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    {a.class.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  {a.entryCount} entries
                </div>
              </div>

              {/* Timetable slots */}
              {a.timetableSlots.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Schedule
                  </p>
                  <div className="space-y-1">
                    {a.timetableSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600 font-medium">
                          {DAY_NAMES[slot.day] || `Day ${slot.day}`}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.period} ({slot.time})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {a.timetableSlots.length === 0 && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  No timetable slots scheduled yet
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
