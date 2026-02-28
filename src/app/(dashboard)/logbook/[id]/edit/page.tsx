"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface EntryData {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  notes: string | null;
  objectives: string | null;
  studentAttendance: number | null;
  engagementLevel: string | null;
  isEditable: boolean;
  createdAt: string;
  class: { id: string; name: string };
  topics: { id: string; name: string; subject: { name: string } }[];
  assignment?: { subject: { name: string } } | null;
}

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [objectives, setObjectives] = useState("");
  const [attendance, setAttendance] = useState<string>("");
  const [engagement, setEngagement] = useState("");

  // Time remaining
  const [minutesLeft, setMinutesLeft] = useState(0);

  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/entries/${entryId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load entry");
          return;
        }
        const data = await res.json();
        setEntry(data);
        setNotes(data.notes || "");
        setObjectives(data.objectives || "");
        setAttendance(data.studentAttendance?.toString() || "");
        setEngagement(data.engagementLevel || "");

        if (!data.isEditable) {
          setError("This entry can no longer be edited. Entries can only be edited within 1 hour of submission.");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchEntry();
  }, [entryId]);

  // Update timer
  useEffect(() => {
    if (!entry) return;
    function updateTimer() {
      const elapsed = Date.now() - new Date(entry!.createdAt).getTime();
      const remaining = Math.max(0, Math.floor((60 * 60 * 1000 - elapsed) / 60000));
      setMinutesLeft(remaining);
      if (remaining <= 0) {
        setError("Editing time has expired. Entries can only be edited within 1 hour of submission.");
      }
    }
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [entry]);

  async function handleSave() {
    if (!entry?.isEditable || minutesLeft <= 0) return;
    setSaving(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        notes: notes || null,
        objectives: objectives || null,
        studentAttendance: attendance ? parseInt(attendance) : null,
        engagementLevel: engagement || null,
      };

      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/logbook"), 1500);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
          <div className="max-w-lg mx-auto">
            <Link
              href="/logbook"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">Edit Entry</h1>
          </div>
        </div>
        <div className="px-5 mt-4 max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error || "Entry not found"}
          </div>
        </div>
      </div>
    );
  }

  const subjectName =
    entry.assignment?.subject?.name ??
    entry.topics?.[0]?.subject?.name ??
    "—";
  const topicNames = entry.topics?.map((t) => t.name).join(", ") || "—";

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
          <h1 className="text-xl font-bold text-white">Edit Entry</h1>
          {entry.isEditable && minutesLeft > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""} remaining to edit
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Changes saved! Redirecting...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Entry Info (read-only) */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Entry Details
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subject</span>
              <span className="font-medium text-slate-800">{subjectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Class</span>
              <span className="font-medium text-slate-800">{entry.class.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Topic</span>
              <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">
                {topicNames}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-800">
                {new Date(entry.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {entry.period && (
              <div className="flex justify-between">
                <span className="text-slate-500">Period</span>
                <span className="font-medium text-slate-800">
                  Period {entry.period}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Editable Fields */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Editable Fields
          </h3>

          <div>
            <label className="label-field">Notes / Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!entry.isEditable || minutesLeft <= 0}
              rows={4}
              className="input-field resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="What was covered in this lesson?"
            />
          </div>

          <div>
            <label className="label-field">Objectives</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              disabled={!entry.isEditable || minutesLeft <= 0}
              rows={3}
              className="input-field resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="What were the learning objectives?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Student Attendance</label>
              <input
                type="number"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                disabled={!entry.isEditable || minutesLeft <= 0}
                min="0"
                className="input-field disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="# students"
              />
            </div>
            <div>
              <label className="label-field">Engagement Level</label>
              <select
                value={engagement}
                onChange={(e) => setEngagement(e.target.value)}
                disabled={!entry.isEditable || minutesLeft <= 0}
                className="input-field disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {entry.isEditable && minutesLeft > 0 && (
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
