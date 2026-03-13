"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Plus,
  Check,
  X,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

interface CoordinatorRecord {
  id: string;
  title: string;
  levels: string[];
  isActive: boolean;
  canVerify: boolean;
  canRemark: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NewCredentials {
  email: string;
  password: string;
  name: string;
}

// Returns the coordinator for a given level (if one exists and is active)
function getCoordinatorForLevel(
  coordinators: CoordinatorRecord[],
  level: string
): CoordinatorRecord | undefined {
  return coordinators.find((c) => c.isActive && c.levels.includes(level));
}

export default function CoordinatorsPage() {
  const [coordinators, setCoordinators] = useState<CoordinatorRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assign form state — one active expand per level
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [assignTab, setAssignTab] = useState<"existing" | "new">("existing");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // "Select existing" form
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // "Create new" form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Show newly created credentials
  const [newCredentials, setNewCredentials] = useState<NewCredentials | null>(null);

  // Deactivation
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [coordRes, teachersRes] = await Promise.all([
        fetch("/api/admin/coordinators"),
        fetch("/api/admin/teachers"),
      ]);

      if (coordRes.ok) {
        const data = await coordRes.json();
        setCoordinators(data.coordinators || []);
      } else {
        setError("Failed to load coordinators");
      }

      if (teachersRes.ok) {
        const t = await teachersRes.json();
        setTeachers(Array.isArray(t) ? t : []);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  function openAssignForm(level: string) {
    if (expandedLevel === level) {
      setExpandedLevel(null);
      return;
    }
    setExpandedLevel(level);
    setAssignTab("existing");
    setSelectedTeacherId("");
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPassword("");
    setNewTitle(`VP ${level}`);
    setFormError("");
    setNewCredentials(null);
  }

  async function handleAssignExisting(level: string) {
    if (!selectedTeacherId) {
      setFormError("Please select a teacher.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/coordinators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          title: newTitle || `VP ${level}`,
          levels: [level],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchData();
        setExpandedLevel(null);
      } else {
        setFormError(data.error || "Failed to assign VP");
      }
    } catch {
      setFormError("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNew(level: string) {
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/coordinators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          title: newTitle || `VP ${level}`,
          levels: [level],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewCredentials({
          email: newEmail.trim(),
          password: newPassword,
          name: `${newFirstName.trim()} ${newLastName.trim()}`,
        });
        await fetchData();
      } else {
        setFormError(data.error || "Failed to create VP account");
      }
    } catch {
      setFormError("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(coordinatorId: string) {
    setDeactivating(coordinatorId);
    setError("");
    try {
      const res = await fetch(`/api/admin/coordinators/${coordinatorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCoordinators((prev) =>
          prev.map((c) => (c.id === coordinatorId ? { ...c, isActive: false } : c))
        );
      } else {
        const data = await res.json();
        setError(data.error || "Failed to deactivate");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-10 pb-8 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold text-white">Level Coordinators (VPs)</h1>
          </div>
          <p className="text-slate-400 text-sm">Assign one VP per class level</p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Credentials reveal after creating a new account */}
        {newCredentials && (
          <div
            className="card p-4 border-l-4"
            style={{ borderLeftColor: "#7C3AED" }}
          >
            <p className="text-sm font-bold text-[var(--text-primary)] mb-2">
              Account created for {newCredentials.name}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              Share these credentials securely with the VP:
            </p>
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 space-y-1.5 text-sm font-mono">
              <p><span className="text-[var(--text-tertiary)]">Email:</span> <span className="text-[var(--text-primary)] font-bold">{newCredentials.email}</span></p>
              <p><span className="text-[var(--text-tertiary)]">Password:</span> <span className="text-[var(--text-primary)] font-bold">{newCredentials.password}</span></p>
            </div>
            <button
              onClick={() => setNewCredentials(null)}
              className="mt-3 text-xs font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {LEVELS.map((level) => (
              <div key={level} className="card p-4 animate-pulse flex items-center justify-between">
                <div>
                  <div className="skeleton h-4 w-20 mb-1" />
                  <div className="skeleton h-3 w-32" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {LEVELS.map((level) => {
              const coord = getCoordinatorForLevel(coordinators, level);
              const isExpanded = expandedLevel === level;
              const inactiveCoord = coordinators.find(
                (c) => !c.isActive && c.levels.includes(level)
              );

              return (
                <div key={level} className="card overflow-hidden">
                  {/* Level row */}
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                        {level}
                      </p>
                      {coord ? (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {coord.user.firstName} {coord.user.lastName}
                          <span className="text-[var(--text-quaternary)] ml-1">· {coord.title}</span>
                        </p>
                      ) : (
                        <p className="text-xs italic mt-0.5" style={{ color: "var(--text-quaternary)" }}>
                          — Not assigned —
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {coord ? (
                        <>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#DCFCE7", color: "#15803D" }}
                          >
                            Active
                          </span>
                          <button
                            onClick={() => openAssignForm(level)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-tertiary)" }}
                            title="Edit / Deactivate"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openAssignForm(level)}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                          style={{ background: "#EDE9FE", color: "#5B21B6" }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Assign
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: assign / edit form */}
                  {isExpanded && (
                    <div
                      className="border-t px-4 pt-4 pb-4 space-y-4"
                      style={{ borderColor: "var(--border-secondary)", background: "var(--bg-tertiary)" }}
                    >
                      {/* If assigned, show deactivate option */}
                      {coord && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                            Current VP: {coord.user.firstName} {coord.user.lastName}
                          </p>
                          <button
                            onClick={() => handleDeactivate(coord.id)}
                            disabled={deactivating === coord.id}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: "#FEE2E2", color: "#DC2626" }}
                          >
                            {deactivating === coord.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                            Deactivate {coord.user.firstName}
                          </button>
                          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border-secondary)" }}>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              Or reassign this level to a different teacher:
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tabs */}
                      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1">
                        {(["existing", "new"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setAssignTab(tab);
                              setFormError("");
                            }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: assignTab === tab ? "var(--bg-elevated)" : "transparent",
                              color: assignTab === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                              boxShadow: assignTab === tab ? "var(--shadow-card)" : "none",
                            }}
                          >
                            {tab === "existing" ? "Existing Teacher" : "New Account"}
                          </button>
                        ))}
                      </div>

                      {/* Title field (shared) */}
                      <div>
                        <label className="label-field">VP Title</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder={`VP ${level}`}
                          className="input-field"
                        />
                      </div>

                      {assignTab === "existing" ? (
                        <>
                          <div>
                            <label className="label-field">Select Teacher</label>
                            <select
                              value={selectedTeacherId}
                              onChange={(e) => setSelectedTeacherId(e.target.value)}
                              className="input-field"
                            >
                              <option value="">— Choose a teacher —</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.firstName} {t.lastName} ({t.email})
                                </option>
                              ))}
                            </select>
                          </div>
                          {formError && (
                            <p className="text-xs text-red-600">{formError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedLevel(null)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAssignExisting(level)}
                              disabled={saving || !selectedTeacherId}
                              className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                              style={{ background: "#7C3AED" }}
                            >
                              {saving ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Assign VP
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="label-field">First Name</label>
                              <input
                                type="text"
                                value={newFirstName}
                                onChange={(e) => setNewFirstName(e.target.value)}
                                placeholder="John"
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="label-field">Last Name</label>
                              <input
                                type="text"
                                value={newLastName}
                                onChange={(e) => setNewLastName(e.target.value)}
                                placeholder="Tanyi"
                                className="input-field"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="label-field">Email</label>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="vp.form1@school.edu"
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="label-field">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="input-field pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          {formError && (
                            <p className="text-xs text-red-600">{formError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedLevel(null)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleCreateNew(level)}
                              disabled={saving}
                              className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                              style={{ background: "#7C3AED" }}
                            >
                              {saving ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                              Create Account
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Show inactive coordinator info */}
                  {!coord && inactiveCoord && (
                    <div
                      className="px-4 pb-3 text-xs"
                      style={{ color: "var(--text-quaternary)" }}
                    >
                      Previously: {inactiveCoord.user.firstName} {inactiveCoord.user.lastName} (inactive)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="card p-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-emerald-700">
                  {coordinators.filter((c) => c.isActive).length}
                </p>
                <p className="text-[10px] text-emerald-600 uppercase font-semibold">VPs Assigned</p>
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 text-center">
                <p className="text-xl font-black text-[var(--text-secondary)]">
                  {LEVELS.length - coordinators.filter((c) => c.isActive).length}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                  Levels Unassigned
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
