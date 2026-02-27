"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TeacherDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
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
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <div className="h-4 bg-white/20 rounded w-1/3 mb-3" />
            <div className="h-6 bg-white/20 rounded w-1/2" />
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
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

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teachers
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-brand-400 text-sm mt-0.5">
                {teacher.totalEntries} logbook{" "}
                {teacher.totalEntries === 1 ? "entry" : "entries"}
              </p>
            </div>
            <span
              className={`flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
                teacher.isVerified
                  ? "bg-green-500/20 text-green-300"
                  : "bg-amber-500/20 text-amber-300"
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
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Contact Info */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            {teacher.email}
          </div>
          {teacher.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {teacher.phone}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            Joined {formatDate(teacher.createdAt)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab("entries")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === "entries"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Entries ({teacher.entries.length})
          </button>
          <button
            onClick={() => setTab("assignments")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === "assignments"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Assignments ({teacher.assignments.length})
          </button>
        </div>

        {/* Entries Tab */}
        {tab === "entries" && (
          <>
            {teacher.entries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No logbook entries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teacher.entries.map((entry) => (
                  <div key={entry.id} className="card p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {entry.subject}
                        </span>
                        <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                          {entry.className}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          entry.status === "VERIFIED"
                            ? "bg-green-50 text-green-700"
                            : entry.status === "FLAGGED"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    {entry.topics.length > 0 && (
                      <p className="text-sm text-slate-700 mt-1">
                        {entry.topics.join(", ")}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </span>
                      {entry.period && (
                        <span>Period {entry.period}</span>
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
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No assignments yet</p>
                <Link
                  href="/admin/assignments"
                  className="text-sm text-brand-600 font-medium mt-2 inline-block"
                >
                  Assign teacher to classes
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {teacher.assignments.map((a) => (
                  <div key={a.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {a.subjectName}
                      </span>
                      <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        {a.className}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {a.entryCount} entries
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {a.slotCount} timetable slots
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
