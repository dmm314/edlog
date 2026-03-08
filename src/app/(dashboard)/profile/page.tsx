"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Camera,
  Edit3,
  Save,
  X,
  Copy,
  Check,
  ChevronRight,
  Palette,
  LogOut,
  Flame,
  BookOpen,
  CalendarCheck,
  ShieldCheck,
  Star,
  BarChart3,
  Building2,
  Users,
  Layers,
  GraduationCap,
  Key,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────

interface TeacherSchoolData {
  id: string;
  status: string;
  isPrimary: boolean;
  school: { id: string; name: string; code: string };
}

interface SchoolData {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  principalName: string | null;
  principalPhone: string | null;
  status: string;
  foundingDate: string | null;
  region: { name: string; code: string } | null;
  division: { name: string } | null;
}

interface RegionData {
  id: string;
  name: string;
  code: string;
  capital: string;
}

interface AssignmentData {
  id: string;
  subject: { name: string };
  class: { name: string; level: string };
  division: { name: string } | null;
}

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  dateOfBirth: string | null;
  gender: string | null;
  photoUrl: string | null;
  createdAt: string;
  teacherCode: string | null;
  school: SchoolData | null;
  teacherSchools?: TeacherSchoolData[];
  regionAdmin?: RegionData | null;
  teacherStats?: {
    streak: number;
    totalEntries: number;
    entriesThisMonth: number;
    verificationRate: number;
    topSubject: string | null;
    syllabusCoverage: number;
  };
  assignments?: AssignmentData[];
  schoolStats?: {
    totalTeachers: number;
    entriesThisMonth: number;
    complianceRate: number;
    subjectCount: number;
    classCount: number;
  };
  regionStats?: {
    totalSchools: number;
    totalTeachers: number;
    entriesThisMonth: number;
    complianceRate: number;
    codesIssued: number;
    codesUsed: number;
  };
}

// ── Helpers ──────────────────────────────────────────────

function getRoleBadgeLabel(role: string) {
  switch (role) {
    case "TEACHER": return "Teacher";
    case "SCHOOL_ADMIN": return "School Admin";
    case "REGIONAL_ADMIN": return "Regional Inspector";
    default: return role;
  }
}

function getInitialsBg(role: string) {
  switch (role) {
    case "TEACHER": return "#f59e0b";
    case "SCHOOL_ADMIN": return "#6366f1";
    case "REGIONAL_ADMIN": return "#14b8a6";
    default: return "#f59e0b";
  }
}

function getHeaderGradient(role: string) {
  switch (role) {
    case "TEACHER":
      return "linear-gradient(135deg, #292524, #44403C, #57534E)";
    case "SCHOOL_ADMIN":
      return "linear-gradient(135deg, #1e293b, #334155, #475569)";
    case "REGIONAL_ADMIN":
      return "linear-gradient(135deg, #0f172a, #1e293b, #1e3a5f)";
    default:
      return "linear-gradient(135deg, var(--header-from), var(--header-via), var(--header-to))";
  }
}

// ── Skeleton Components ──────────────────────────────────

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-3 rounded" style={{ width: "30%", backgroundColor: "var(--skeleton-base)" }} />
          <div className="h-3 rounded" style={{ width: "40%", backgroundColor: "var(--skeleton-base)" }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonStatGrid() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <div className="h-6 rounded w-12 mb-1" style={{ backgroundColor: "var(--skeleton-base)" }} />
            <div className="h-2.5 rounded w-16" style={{ backgroundColor: "var(--skeleton-base)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="px-5 pt-10 pb-8 rounded-b-2xl animate-pulse" style={{ background: "var(--bg-tertiary)" }}>
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="w-20 h-20 rounded-full" style={{ backgroundColor: "var(--skeleton-base)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-5 rounded w-40" style={{ backgroundColor: "var(--skeleton-base)" }} />
          <div className="h-4 rounded-full w-20" style={{ backgroundColor: "var(--skeleton-base)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Stat Cell Component ──────────────────────────────────

function StatCell({
  value,
  label,
  highlight,
  icon,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="p-3 rounded-xl text-center"
      style={{
        backgroundColor: highlight ? "rgba(245, 158, 11, 0.08)" : "var(--bg-secondary)",
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span
          className="font-mono text-xl font-bold"
          style={{ color: highlight ? "var(--accent-text)" : "var(--text-primary)" }}
        >
          {value}
        </span>
      </div>
      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </div>
  );
}

// ── Info Row Component ───────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Quick Link Component ─────────────────────────────────

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-3 group"
    >
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
      </div>
      <ChevronRight
        className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
        style={{ color: "var(--text-tertiary)" }}
      />
    </Link>
  );
}

// ── Main Component ───────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedTC, setCopiedTC] = useState(false);

  // Edit form state
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editPrincipalName, setEditPrincipalName] = useState("");
  const [editPrincipalPhone, setEditPrincipalPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as Record<string, unknown> | undefined;
  const role = (profile?.role || (user?.role as string)) || "TEACHER";

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditPhone(data.phone || "");
          setEditDob(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
          setEditGender(data.gender || "");
          setEditPrincipalName(data.school?.principalName || "");
          setEditPrincipalPhone(data.school?.principalPhone || "");
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, unknown> = { phone: editPhone || null };

      if (role === "SCHOOL_ADMIN") {
        body.principalName = editPrincipalName || null;
        body.principalPhone = editPrincipalPhone || null;
      } else {
        body.dateOfBirth = editDob || null;
        body.gender = editGender || null;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => {
          if (!prev) return prev;
          const newProfile = {
            ...prev,
            phone: updated.phone,
            dateOfBirth: updated.dateOfBirth,
            gender: updated.gender,
          };
          if (updated.school && prev.school) {
            newProfile.school = {
              ...prev.school,
              principalName: updated.school.principalName ?? prev.school.principalName,
              principalPhone: updated.school.principalPhone ?? prev.school.principalPhone,
            };
          }
          return newProfile;
        });
        setEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save profile");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: base64 }),
        });
        if (res.ok) {
          const updated = await res.json();
          setProfile((prev) => (prev ? { ...prev, photoUrl: updated.photoUrl } : prev));
        }
      } catch {
        // silently fail
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleInvitation(membershipId: string, action: "accept" | "decline") {
    try {
      const res = await fetch("/api/teacher/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, action }),
      });
      if (res.ok) {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            teacherSchools: prev.teacherSchools?.map((ts) =>
              ts.id === membershipId
                ? { ...ts, status: action === "accept" ? "ACTIVE" : "REMOVED" }
                : ts
            ).filter((ts) => ts.status !== "REMOVED"),
          };
        });
      }
    } catch {
      // silently fail
    }
  }

  if (!user) return null;

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${user.firstName as string} ${user.lastName as string}`;

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : `${(user.firstName as string)?.[0] || ""}${(user.lastName as string)?.[0] || ""}`;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* ═══ HEADER SECTION ═══ */}
      {loading ? (
        <SkeletonHeader />
      ) : (
        <div
          className="px-5 pt-10 pb-8 rounded-b-2xl relative overflow-hidden"
          style={{ background: getHeaderGradient(role) }}
        >
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 max-w-lg mx-auto flex items-center gap-4">
            {/* Photo / Initials */}
            <div className="relative flex-shrink-0">
              {profile?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-[3px] border-white/20"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: getInitialsBg(role) }}
                >
                  {initials.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name + Role + Teacher Code */}
            <div className="flex-1 min-w-0">
              <h1
                className="font-display text-[22px] font-bold text-white leading-tight truncate"
              >
                {displayName}
              </h1>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center bg-white/10 text-white text-xs rounded-full px-3 py-1 font-medium">
                  {getRoleBadgeLabel(role)}
                </span>
              </div>

              {role === "TEACHER" && profile?.teacherCode && (
                <div className="flex items-center gap-1.5 mt-2">
                  <code className="font-mono text-sm text-white/70">
                    {profile.teacherCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.teacherCode!);
                      setCopiedTC(true);
                      setTimeout(() => setCopiedTC(false), 2000);
                    }}
                    className="p-1 rounded transition-colors hover:bg-white/10"
                  >
                    {copiedTC ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/50" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 -mt-3 max-w-lg mx-auto space-y-3">
        {/* ═══ INFO CARD (shared) ═══ */}
        {loading ? (
          <SkeletonCard lines={6} />
        ) : (
          <div className="card p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                Personal Information
              </h3>
              {!editing ? (
                <button
                  onClick={() => { setEditing(true); setSaveError(""); }}
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--accent-text)" }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(false); setSaveError(""); }}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "var(--accent-text)" }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {saveError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
              <InfoRow label="Full Name" value={displayName} />
              <InfoRow label="Email" value={profile?.email} />

              {/* Phone - editable */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Phone</span>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input-field py-1.5 px-2 text-sm text-right w-44"
                    placeholder="+237 6XX XXX XXX"
                  />
                ) : (
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {profile?.phone || "—"}
                  </span>
                )}
              </div>

              {/* Gender - editable (teacher/regional) */}
              {role !== "SCHOOL_ADMIN" && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Gender</span>
                  {editing ? (
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="input-field py-1.5 px-2 text-sm text-right w-32"
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : "—"}
                    </span>
                  )}
                </div>
              )}

              {/* Date of Birth - editable (teacher/regional) */}
              {role !== "SCHOOL_ADMIN" && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Date of Birth</span>
                  {editing ? (
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="input-field py-1.5 px-2 text-sm text-right w-44"
                    />
                  ) : (
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"}
                    </span>
                  )}
                </div>
              )}

              <InfoRow
                label="Member Since"
                value={profile?.createdAt ? formatDate(profile.createdAt) : "—"}
              />

              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Verification</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {profile?.isVerified ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600">Pending</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TEACHER-SPECIFIC SECTIONS ═══ */}
        {role === "TEACHER" && (
          <>
            {/* School Membership Card */}
            {loading ? (
              <SkeletonCard lines={3} />
            ) : (
              <div className="card p-4 animate-slide-up animation-delay-75">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  School Membership
                </h3>
                {profile?.teacherSchools && profile.teacherSchools.length > 0 ? (
                  <div className="space-y-2.5">
                    {profile.teacherSchools.map((ts) => (
                      <div key={ts.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                          <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {ts.school.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {ts.isPrimary && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)" }}>
                              Primary
                            </span>
                          )}
                          {ts.status === "ACTIVE" ? (
                            <span className="badge-verified text-[10px]">Active</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="badge-submitted text-[10px]">Pending</span>
                              <button
                                onClick={() => handleInvitation(ts.id, "accept")}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Accept"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleInvitation(ts.id, "decline")}
                                className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                title="Decline"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    No school memberships yet.
                  </p>
                )}
              </div>
            )}

            {/* My Stats Card */}
            {loading ? (
              <SkeletonStatGrid />
            ) : profile?.teacherStats && (
              <div className="card p-4 animate-slide-up animation-delay-150">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  My Stats
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCell
                    value={profile.teacherStats.streak}
                    label="Day Streak"
                    highlight
                    icon={<Flame className="w-4 h-4" style={{ color: "var(--accent-text)" }} />}
                  />
                  <StatCell
                    value={profile.teacherStats.totalEntries}
                    label="Total Entries"
                    icon={<BookOpen className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.teacherStats.entriesThisMonth}
                    label="This Month"
                    icon={<CalendarCheck className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.teacherStats.verificationRate}%`}
                    label="Verified"
                    icon={<ShieldCheck className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.teacherStats.topSubject || "—"}
                    label="Top Subject"
                    icon={<Star className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.teacherStats.syllabusCoverage}%`}
                    label="Syllabus Coverage"
                    icon={<BarChart3 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                </div>
              </div>
            )}

            {/* My Assignments Card */}
            {loading ? (
              <SkeletonCard lines={4} />
            ) : profile?.assignments && profile.assignments.length > 0 && (
              <div className="card p-4 animate-slide-up animation-delay-225">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  My Assignments
                </h3>
                <div className="space-y-1.5">
                  {profile.assignments.map((a) => (
                    <div key={a.id} className="flex items-center py-1.5">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {a.subject.name}
                        {a.division ? ` (${a.division.name})` : ""}
                      </span>
                      <span className="mx-2 text-[13px]" style={{ color: "var(--text-quaternary)" }}>—</span>
                      <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {a.class.name} ({a.class.level})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ SCHOOL ADMIN-SPECIFIC SECTIONS ═══ */}
        {role === "SCHOOL_ADMIN" && (
          <>
            {/* School Info Card */}
            {loading ? (
              <SkeletonCard lines={7} />
            ) : profile?.school && (
              <div className="card p-4 animate-slide-up animation-delay-75">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                    School Info
                  </h3>
                  {editing && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)" }}>
                      Editing
                    </span>
                  )}
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  <InfoRow label="School Name" value={profile.school.name} />
                  <InfoRow label="School Code" value={profile.school.code} />
                  <InfoRow label="Type" value={profile.school.schoolType} />
                  <InfoRow label="Region" value={profile.school.region?.name} />
                  <InfoRow label="Division" value={profile.school.division?.name} />

                  {/* Principal Name - editable */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Principal</span>
                    {editing ? (
                      <input
                        type="text"
                        value={editPrincipalName}
                        onChange={(e) => setEditPrincipalName(e.target.value)}
                        className="input-field py-1.5 px-2 text-sm text-right w-44"
                        placeholder="Principal name"
                      />
                    ) : (
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {profile.school.principalName || "—"}
                      </span>
                    )}
                  </div>

                  {/* Principal Phone - editable */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Principal Phone</span>
                    {editing ? (
                      <input
                        type="tel"
                        value={editPrincipalPhone}
                        onChange={(e) => setEditPrincipalPhone(e.target.value)}
                        className="input-field py-1.5 px-2 text-sm text-right w-44"
                        placeholder="+237 6XX XXX XXX"
                      />
                    ) : (
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {profile.school.principalPhone || "—"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Status</span>
                    <span className={
                      profile.school.status === "ACTIVE" ? "badge-verified text-[11px]"
                        : profile.school.status === "SUSPENDED" ? "badge-flagged text-[11px]"
                        : "badge-submitted text-[11px]"
                    }>
                      {profile.school.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* School Overview Card */}
            {loading ? (
              <SkeletonStatGrid />
            ) : profile?.schoolStats && (
              <div className="card p-4 animate-slide-up animation-delay-150">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  School Overview
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCell
                    value={profile.schoolStats.totalTeachers}
                    label="Active Teachers"
                    icon={<Users className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.schoolStats.entriesThisMonth}
                    label="Entries This Month"
                    icon={<BookOpen className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.schoolStats.complianceRate}%`}
                    label="Compliance Rate"
                    icon={<ShieldCheck className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.schoolStats.subjectCount}
                    label="Subjects Offered"
                    icon={<Layers className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.schoolStats.classCount}
                    label="Classes"
                    icon={<GraduationCap className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                </div>
              </div>
            )}

            {/* Quick Links Card */}
            <div className="card p-4 animate-slide-up animation-delay-225">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                Quick Links
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                <QuickLink href="/admin/teachers" icon={<Users className="w-4.5 h-4.5" />} label="Manage Teachers" />
                <QuickLink href="/admin/reports/teachers" icon={<BarChart3 className="w-4.5 h-4.5" />} label="View Reports" />
                <QuickLink href="/admin/timetable" icon={<CalendarCheck className="w-4.5 h-4.5" />} label="Timetable" />
              </div>
            </div>
          </>
        )}

        {/* ═══ REGIONAL ADMIN-SPECIFIC SECTIONS ═══ */}
        {role === "REGIONAL_ADMIN" && (
          <>
            {/* Region Info Card */}
            {loading ? (
              <SkeletonCard lines={3} />
            ) : profile?.regionAdmin && (
              <div className="card p-4 animate-slide-up animation-delay-75">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  Region Info
                </h3>
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  <InfoRow label="Region Name" value={profile.regionAdmin.name} />
                  <InfoRow label="Region Code" value={profile.regionAdmin.code} />
                  <InfoRow
                    label="Capital"
                    value={
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                        {profile.regionAdmin.capital}
                      </span>
                    }
                  />
                </div>
              </div>
            )}

            {/* Region Overview Card */}
            {loading ? (
              <SkeletonStatGrid />
            ) : profile?.regionStats && (
              <div className="card p-4 animate-slide-up animation-delay-150">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  Region Overview
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCell
                    value={profile.regionStats.totalSchools}
                    label="Active Schools"
                    icon={<Building2 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.regionStats.totalTeachers}
                    label="Total Teachers"
                    icon={<Users className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={profile.regionStats.entriesThisMonth}
                    label="Entries This Month"
                    icon={<BookOpen className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.regionStats.complianceRate}%`}
                    label="Avg Compliance"
                    icon={<ShieldCheck className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.regionStats.codesIssued}`}
                    label="Codes Issued"
                    icon={<Key className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                  <StatCell
                    value={`${profile.regionStats.codesUsed}`}
                    label="Codes Used"
                    icon={<CheckCircle className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />}
                  />
                </div>
              </div>
            )}

            {/* Quick Links Card */}
            <div className="card p-4 animate-slide-up animation-delay-225">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                Quick Links
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                <QuickLink href="/regional/schools" icon={<Building2 className="w-4.5 h-4.5" />} label="View Schools" />
                <QuickLink href="/regional/reports/schools" icon={<BarChart3 className="w-4.5 h-4.5" />} label="Reports" />
                <QuickLink href="/regional/reports/coverage" icon={<Layers className="w-4.5 h-4.5" />} label="Curriculum Coverage" />
                <QuickLink href="/regional/codes" icon={<Key className="w-4.5 h-4.5" />} label="Registration Codes" />
              </div>
            </div>
          </>
        )}

        {/* ═══ QUICK ACTIONS CARD (shared) ═══ */}
        <div className="card p-4 animate-slide-up animation-delay-300">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
            Quick Actions
          </h3>
          <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
            <QuickLink
              href="/appearance"
              icon={<Palette className="w-4.5 h-4.5" />}
              label="Appearance / Theme"
            />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
            style={{ border: "1px solid var(--border-primary)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
