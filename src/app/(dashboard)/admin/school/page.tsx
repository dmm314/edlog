"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Building2, CheckCircle } from "lucide-react";
import Link from "next/link";

const SCHOOL_TYPES = [
  "GHS",
  "GBHS",
  "GTHS",
  "CSS",
  "Baptist",
  "Lay Private",
  "Other",
];

interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  principalName: string | null;
  principalPhone: string | null;
  status: string;
  profileComplete: boolean;
  region: string;
  regionCode: string;
  division: string;
  createdAt: string;
}

export default function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    schoolType: "",
    principalName: "",
    principalPhone: "",
  });

  useEffect(() => {
    async function fetchSchool() {
      try {
        const res = await fetch("/api/admin/school");
        if (res.ok) {
          const data = await res.json();
          setSchool(data);
          setForm({
            schoolType: data.schoolType || "",
            principalName: data.principalName || "",
            principalPhone: data.principalPhone || "",
          });
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchSchool();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setSchool((prev) => prev ? { ...prev, ...data } : prev);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-xl font-bold text-white">School Profile</h1>
          <p className="text-brand-400 text-sm mt-0.5">
            Manage your school information
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : !school ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Unable to load school information</p>
          </div>
        ) : (
          <>
            {/* School Info (read-only) */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                School Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="text-slate-900 font-medium">{school.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Code</span>
                  <span className="text-slate-900 font-mono font-medium">{school.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Region</span>
                  <span className="text-slate-900">{school.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Division</span>
                  <span className="text-slate-900">{school.division}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`text-xs font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                      school.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : school.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {school.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Profile */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  School Profile
                </h3>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    Profile saved successfully!
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="label-field">School Type</label>
                    <select
                      value={form.schoolType}
                      onChange={(e) => updateField("schoolType", e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select school type</option>
                      {SCHOOL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-field">Principal&apos;s Name</label>
                    <input
                      type="text"
                      value={form.principalName}
                      onChange={(e) => updateField("principalName", e.target.value)}
                      className="input-field"
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>

                  <div>
                    <label className="label-field">Principal&apos;s Phone</label>
                    <input
                      type="tel"
                      value={form.principalPhone}
                      onChange={(e) => updateField("principalPhone", e.target.value)}
                      className="input-field"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Profile
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
