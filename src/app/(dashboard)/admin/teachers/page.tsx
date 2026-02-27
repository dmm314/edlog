"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { TeacherWithStats } from "@/types";

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [schoolCode, setSchoolCode] = useState("");

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

        {/* Teachers List */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Teachers ({teachers.length})
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
        ) : teachers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No teachers registered yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Share the school code above with your teachers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {teacher.firstName} {teacher.lastName}
                    </h4>
                    <p className="text-sm text-slate-500">{teacher.email}</p>
                  </div>
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
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{teacher.entryCount} entries</span>
                  {teacher.lastEntry && (
                    <>
                      <span>&middot;</span>
                      <span>Last: {formatDate(teacher.lastEntry)}</span>
                    </>
                  )}
                  <span>&middot;</span>
                  <span>Joined {formatDate(teacher.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
