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
  ChevronDown,
  LogOut,
  CalendarCheck,
  Phone,
  User,
  Calendar,
  Building2,
  Users,
  Layers,
  Key,
  MapPin,
  CheckCircle,
  XCircle,
  Megaphone,
  BarChart3,
  Moon,
  Sun,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useCoordinatorMode } from "@/contexts/CoordinatorModeContext";

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

function getBannerGradient(role: string) {
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

// ── Skeleton ─────────────────────────────────────────────

function SkeletonBanner() {
  return (
    <div className="animate-pulse">
      <div className="w-full" style={{ height: 140, backgroundColor: "var(--bg-tertiary)" }} />
      <div className="max-w-lg mx-auto px-5 -mt-11 flex flex-col items-center">
        <div className="w-[88px] h-[88px] rounded-full" style={{ backgroundColor: "var(--skeleton-base)", border: "4px solid var(--bg-primary)" }} />
        <div className="h-5 rounded w-40 mt-3" style={{ backgroundColor: "var(--skeleton-base)" }} />
        <div className="h-3 rounded w-48 mt-2" style={{ backgroundColor: "var(--skeleton-base)" }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
    >
      <div className="h-3 rounded w-24 mb-3" style={{ backgroundColor: "var(--skeleton-base)" }} />
      <div className="space-y-2.5">
        <div className="h-3 rounded w-full" style={{ backgroundColor: "var(--skeleton-base)" }} />
        <div className="h-3 rounded w-3/4" style={{ backgroundColor: "var(--skeleton-base)" }} />
      </div>
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────

function SectionCard({
  title,
  children,
  expandable,
  expanded,
  onToggle,
  rightBadge,
}: {
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  rightBadge?: React.ReactNode;
}) {
  const cardStyle = {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-primary)",
  };

  return (
    <div className="rounded-2xl transition-colors" style={cardStyle}>
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        >
          <span
            className="text-xs font-semibold uppercase tracking-[0.04em]"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          >
            {title}
          </span>
          <span className="flex items-center gap-2">
            {rightBadge}
            <ChevronDown
              className="w-4 h-4 transition-transform duration-300"
              style={{
                color: "var(--text-tertiary)",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </span>
        </button>
      ) : (
        <div className="px-4 pt-3">
          <span
            className="text-xs font-semibold uppercase tracking-[0.04em]"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          >
            {title}
          </span>
        </div>
      )}

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: expandable ? (expanded ? 600 : 0) : undefined,
          opacity: expandable ? (expanded ? 1 : 0) : undefined,
        }}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>

      {!expandable && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Quick Link Row ───────────────────────────────────────

function QuickLinkRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2.5 group transition-colors rounded-lg -mx-1 px-1"
      style={{ color: "var(--text-primary)" }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
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
  const router = useRouter();
  const { isCoordinator, coordinatorTitle, activeMode, switchMode, hasTeachingAssignments } = useCoordinatorMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedTC, setCopiedTC] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("edlog-hints-dismissed") !== "true";
  });

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editPrincipalName, setEditPrincipalName] = useState("");
  const [editPrincipalPhone, setEditPrincipalPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as Record<string, unknown> | undefined;
  const role = (profile?.role || (user?.role as string)) || "TEACHER";

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
        setEditingSection(null);
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

  const pendingInvitations = profile?.teacherSchools?.filter((ts) => ts.status === "PENDING") || [];

  // Build assignment summary
  const assignmentSummary = (() => {
    if (!profile?.assignments || profile.assignments.length === 0) return null;
    const grouped: Record<string, string[]> = {};
    for (const a of profile.assignments) {
      const subj = a.subject.name + (a.division ? ` (${a.division.name})` : "");
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push(a.class.name);
    }
    return Object.entries(grouped)
      .map(([subj, classes]) => `${subj} — ${classes.join(", ")}`)
      .join(" | ");
  })();

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* ═══ COVER BANNER + AVATAR HEADER ═══ */}
      {loading ? (
        <SkeletonBanner />
      ) : (
        <div className="animate-fade-in">
          {/* Banner */}
          <div
            className="w-full relative overflow-hidden"
            style={{ height: 140, background: getBannerGradient(role) }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Avatar + Identity */}
          <div className="max-w-lg mx-auto px-5 -mt-11 flex flex-col items-center">
            {/* Photo */}
            <div className="relative">
              {profile?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt="Profile"
                  className="w-[88px] h-[88px] rounded-full object-cover"
                  style={{ border: "4px solid var(--bg-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
                />
              ) : (
                <div
                  className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{
                    backgroundColor: getInitialsBg(role),
                    border: "4px solid var(--bg-primary)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  }}
                >
                  {initials.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name + Role Pill */}
            <div className="flex items-center gap-2 mt-3">
              <h1
                className="font-display text-[22px] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {displayName}
              </h1>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-[10px]"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)" }}
              >
                {getRoleBadgeLabel(role)}
              </span>
            </div>

            {/* Email */}
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              {profile?.email}
            </p>
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div className="px-5 mt-5 max-w-lg mx-auto flex flex-col gap-2.5">

        {/* ═══ MODE SWITCHER (dual-role teacher+coordinator) ═══ */}
        {isCoordinator && hasTeachingAssignments && (
          <div
            className="rounded-2xl p-3 animate-fade-slide-in"
            style={{
              backgroundColor: activeMode === "coordinator"
                ? "rgba(109,40,217,0.06)"
                : "var(--bg-elevated)",
              border: `1px solid ${activeMode === "coordinator" ? "rgba(124,58,237,0.2)" : "var(--border-primary)"}`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
              Switch portal
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => switchMode("teacher")}
                className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all"
                style={{
                  background: activeMode === "teacher" ? "var(--accent)" : "var(--bg-tertiary)",
                  color: activeMode === "teacher" ? "white" : "var(--text-tertiary)",
                  boxShadow: activeMode === "teacher" ? "0 2px 8px rgba(245,158,11,0.35)" : "none",
                }}
              >
                Teacher
              </button>
              <button
                onClick={() => switchMode("coordinator")}
                className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all"
                style={{
                  background: activeMode === "coordinator" ? "#7C3AED" : "var(--bg-tertiary)",
                  color: activeMode === "coordinator" ? "white" : "var(--text-tertiary)",
                  boxShadow: activeMode === "coordinator" ? "0 2px 8px rgba(124,58,237,0.35)" : "none",
                }}
              >
                {coordinatorTitle || "Coordinator"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ QUICK STATS BAR ═══ */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <>
            {role === "TEACHER" && profile?.teacherStats && (
              <div
                className="rounded-2xl p-3 animate-fade-slide-in"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
              >
                <div className="grid grid-cols-4 gap-1">
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.teacherStats.totalEntries}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      entries
                    </span>
                  </div>
                  <div
                    className="text-center py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }}
                  >
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--accent-text)" }}>
                      {profile.teacherStats.streak}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      streak
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.teacherStats.syllabusCoverage}%
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      syllabus
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block truncate px-1" style={{ color: "var(--text-primary)", fontSize: profile.teacherStats.topSubject && profile.teacherStats.topSubject.length > 6 ? 14 : undefined }}>
                      {profile.teacherStats.topSubject || "—"}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      top subj
                    </span>
                  </div>
                </div>
              </div>
            )}

            {role === "SCHOOL_ADMIN" && profile?.schoolStats && (
              <div
                className="rounded-2xl p-3 animate-fade-slide-in"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
              >
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.schoolStats.totalTeachers}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      teachers
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.schoolStats.entriesThisMonth}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      entries/mo
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.schoolStats.complianceRate}%
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      compliance
                    </span>
                  </div>
                </div>
              </div>
            )}

            {role === "REGIONAL_ADMIN" && profile?.regionStats && (
              <div
                className="rounded-2xl p-3 animate-fade-slide-in"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
              >
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.regionStats.totalSchools}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      schools
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.regionStats.totalTeachers}
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      teachers
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="font-mono text-xl font-bold block" style={{ color: "var(--text-primary)" }}>
                      {profile.regionStats.complianceRate}%
                    </span>
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-tertiary)" }}>
                      avg compliance
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ TEACHER SECTIONS ═══ */}
        {role === "TEACHER" && !loading && (
          <>
            {/* Personal Info — expandable */}
            <SectionCard
              title="Personal Info"
              expandable
              expanded={expandedSections.personalInfo}
              onToggle={() => toggleSection("personalInfo")}
            >
              {editingSection === "personalInfo" ? (
                <div className="space-y-3">
                  {saveError && (
                    <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                      {saveError}
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Phone</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="input-field py-2 px-3 text-sm w-full"
                        placeholder="+237 6XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="input-field py-2 px-3 text-sm w-full"
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Date of Birth</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="input-field py-2 px-3 text-sm w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "var(--accent)", color: "white" }}
                    >
                      <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Preview row */}
                  <div className="flex items-center gap-4 text-[13px] flex-wrap" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.phone || (
                        <span style={{ color: "var(--accent-text)" }}>Add your phone number</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                    </span>
                  </div>
                  {/* Full details */}
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-tertiary)" }}>Full Name</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-tertiary)" }}>Date of Birth</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-tertiary)" }}>Verification</span>
                      <span className="flex items-center gap-1 font-medium">
                        {profile?.isVerified ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                            <span style={{ color: "#10b981" }}>Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                            <span style={{ color: "var(--accent-text)" }}>Pending</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSection("personalInfo")}
                    className="flex items-center gap-1 text-xs font-semibold mt-2"
                    style={{ color: "var(--accent-text)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Teacher ID Badge */}
            {profile?.teacherCode && (
              <div
                className="rounded-2xl overflow-hidden animate-fade-slide-in"
                style={{ border: "1px solid var(--border-primary)" }}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-light), rgba(245, 158, 11, 0.04))",
                  }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.04em] block mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Teacher ID
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-2xl font-bold tracking-wider"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {profile.teacherCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.teacherCode!);
                        setCopiedTC(true);
                        setTimeout(() => setCopiedTC(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: copiedTC ? "rgba(16, 185, 129, 0.1)" : "var(--bg-elevated)",
                        color: copiedTC ? "#10b981" : "var(--text-secondary)",
                        border: "1px solid var(--border-primary)",
                      }}
                    >
                      {copiedTC ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedTC ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* My Schools */}
            <SectionCard
              title="My Schools"
              expandable
              expanded={expandedSections.mySchools}
              onToggle={() => toggleSection("mySchools")}
              rightBadge={
                pendingInvitations.length > 0 ? (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)" }}
                  >
                    {pendingInvitations.length} new invitation{pendingInvitations.length > 1 ? "s" : ""}
                  </span>
                ) : null
              }
            >
              {profile?.teacherSchools && profile.teacherSchools.length > 0 ? (
                <div className="space-y-2">
                  {profile.teacherSchools.map((ts) => (
                    <div key={ts.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: ts.status === "ACTIVE" ? "#10b981" : "var(--accent)",
                          }}
                        />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {ts.school.name}
                        </span>
                        {ts.isPrimary && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)" }}
                          >
                            Primary
                          </span>
                        )}
                      </div>
                      {ts.status === "PENDING" && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleInvitation(ts.id, "accept")}
                            className="p-1 rounded-md transition-colors"
                            style={{ color: "#10b981" }}
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInvitation(ts.id, "decline")}
                            className="p-1 rounded-md transition-colors"
                            style={{ color: "#ef4444" }}
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  No school memberships yet.
                </p>
              )}
            </SectionCard>

            {/* My Assignments */}
            {profile?.assignments && profile.assignments.length > 0 && (
              <SectionCard
                title="My Assignments"
                expandable
                expanded={expandedSections.assignments}
                onToggle={() => toggleSection("assignments")}
              >
                {expandedSections.assignments ? (
                  <div className="space-y-1.5">
                    {profile.assignments.map((a) => (
                      <div key={a.id} className="flex items-center text-[13px]">
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {a.subject.name}{a.division ? ` (${a.division.name})` : ""}
                        </span>
                        <span className="mx-2" style={{ color: "var(--text-quaternary)" }}>—</span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {a.class.name} ({a.class.level})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {assignmentSummary}
                  </p>
                )}
              </SectionCard>
            )}
          </>
        )}

        {/* ═══ SCHOOL ADMIN SECTIONS ═══ */}
        {role === "SCHOOL_ADMIN" && !loading && (
          <>
            {/* School Profile */}
            {profile?.school && (
              <SectionCard
                title="School Profile"
                expandable
                expanded={expandedSections.schoolProfile}
                onToggle={() => toggleSection("schoolProfile")}
              >
                {editingSection === "schoolProfile" ? (
                  <div className="space-y-3">
                    {saveError && (
                      <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                        {saveError}
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>School Name</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Code</span>
                        <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Type</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.schoolType || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Region</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.region?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Division</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.division?.name || "—"}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Principal Name</label>
                        <input
                          type="text"
                          value={editPrincipalName}
                          onChange={(e) => setEditPrincipalName(e.target.value)}
                          className="input-field py-2 px-3 text-sm w-full"
                          placeholder="Principal name"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Principal Phone</label>
                        <input
                          type="tel"
                          value={editPrincipalPhone}
                          onChange={(e) => setEditPrincipalPhone(e.target.value)}
                          className="input-field py-2 px-3 text-sm w-full"
                          placeholder="+237 6XX XXX XXX"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setEditingSection(null)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "var(--accent)", color: "white" }}
                      >
                        <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Preview: name, code, region, status */}
                    <div className="flex items-center gap-3 flex-wrap text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{profile.school.name}</span>
                      <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{profile.school.code}</span>
                      {profile.school.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                          {profile.school.region.name}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: profile.school.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "var(--accent-light)",
                          color: profile.school.status === "ACTIVE" ? "#10b981" : "var(--accent-text)",
                        }}
                      >
                        {profile.school.status}
                      </span>
                    </div>
                    {/* Expanded details */}
                    <div className="pt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Type</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.schoolType || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Division</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.division?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Principal</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.principalName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Principal Phone</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.school.principalPhone || "—"}</span>
                      </div>
                      {profile.school.foundingDate && (
                        <div className="flex justify-between">
                          <span style={{ color: "var(--text-tertiary)" }}>Founded</span>
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(profile.school.foundingDate)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingSection("schoolProfile")}
                      className="flex items-center gap-1 text-xs font-semibold mt-2"
                      style={{ color: "var(--accent-text)" }}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Quick Links */}
            <div
              className="rounded-2xl px-4 py-3 animate-fade-slide-in"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-[0.04em] block mb-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Quick Links
              </span>
              <QuickLinkRow href="/admin/teachers" icon={<Users className="w-4 h-4" />} label="Manage Teachers" />
              <QuickLinkRow href="/admin/reports/teachers" icon={<BarChart3 className="w-4 h-4" />} label="Reports" />
              <QuickLinkRow href="/admin/announcements" icon={<Megaphone className="w-4 h-4" />} label="Send Announcement" />
              <QuickLinkRow href="/admin/timetable" icon={<CalendarCheck className="w-4 h-4" />} label="Timetable" />
            </div>

            {/* Personal Info */}
            <SectionCard
              title="Personal Info"
              expandable
              expanded={expandedSections.adminPersonal}
              onToggle={() => toggleSection("adminPersonal")}
            >
              {editingSection === "adminPersonal" ? (
                <div className="space-y-3">
                  {saveError && (
                    <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                      {saveError}
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="input-field py-2 px-3 text-sm w-full"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "var(--accent)", color: "white" }}
                    >
                      <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-[13px] flex-wrap" style={{ color: "var(--text-secondary)" }}>
                    <span>{displayName}</span>
                    <span>{profile?.email}</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.phone || (
                        <span style={{ color: "var(--accent-text)" }}>Add phone</span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingSection("adminPersonal")}
                    className="flex items-center gap-1 text-xs font-semibold mt-1"
                    style={{ color: "var(--accent-text)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ═══ REGIONAL ADMIN SECTIONS ═══ */}
        {role === "REGIONAL_ADMIN" && !loading && (
          <>
            {/* Region Overview */}
            {profile?.regionAdmin && (
              <SectionCard
                title="Region Overview"
                expandable
                expanded={expandedSections.regionOverview}
                onToggle={() => toggleSection("regionOverview")}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-tertiary)" }}>Region</span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{profile.regionAdmin.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-tertiary)" }}>Code</span>
                    <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{profile.regionAdmin.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-tertiary)" }}>Capital</span>
                    <span className="flex items-center gap-1 font-medium" style={{ color: "var(--text-primary)" }}>
                      <MapPin className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                      {profile.regionAdmin.capital}
                    </span>
                  </div>
                  {profile.regionStats && (
                    <>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Schools</span>
                        <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{profile.regionStats.totalSchools}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-tertiary)" }}>Teachers</span>
                        <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{profile.regionStats.totalTeachers}</span>
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Quick Links */}
            <div
              className="rounded-2xl px-4 py-3 animate-fade-slide-in"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-[0.04em] block mb-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Quick Links
              </span>
              <QuickLinkRow href="/regional/schools" icon={<Building2 className="w-4 h-4" />} label="Schools" />
              <QuickLinkRow href="/regional/reports/schools" icon={<BarChart3 className="w-4 h-4" />} label="Reports" />
              <QuickLinkRow href="/regional/reports/coverage" icon={<Layers className="w-4 h-4" />} label="Curriculum Coverage" />
              <QuickLinkRow href="/regional/announcements" icon={<Megaphone className="w-4 h-4" />} label="Send Announcement" />
              <QuickLinkRow href="/regional/codes" icon={<Key className="w-4 h-4" />} label="Registration Codes" />
            </div>

            {/* Personal Info */}
            <SectionCard
              title="Personal Info"
              expandable
              expanded={expandedSections.regionalPersonal}
              onToggle={() => toggleSection("regionalPersonal")}
            >
              {editingSection === "regionalPersonal" ? (
                <div className="space-y-3">
                  {saveError && (
                    <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                      {saveError}
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Phone</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="input-field py-2 px-3 text-sm w-full"
                        placeholder="+237 6XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="input-field py-2 px-3 text-sm w-full"
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Date of Birth</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="input-field py-2 px-3 text-sm w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "var(--accent)", color: "white" }}
                    >
                      <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-[13px] flex-wrap" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.phone || (
                        <span style={{ color: "var(--accent-text)" }}>Add phone</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingSection("regionalPersonal")}
                    className="flex items-center gap-1 text-xs font-semibold mt-1"
                    style={{ color: "var(--accent-text)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ═══ APPEARANCE (all roles) ═══ */}
        {!loading && (
          <Link
            href="/appearance"
            className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                <Sun className="w-4 h-4" />
                <span style={{ color: "var(--text-quaternary)" }}>/</span>
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Appearance</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </Link>
        )}

        {/* ═══ REPLAY TOUR ═══ */}
        {!loading && (
          <button
            onClick={() => {
              const role = (profile?.role || "TEACHER").toLowerCase();
              const tourKey =
                role === "school_admin" ? "admin"
                : role === "regional_admin" ? "regional"
                : isCoordinator ? "coordinator"
                : "teacher";
              localStorage.removeItem(`edlog-tour-${tourKey}`);
              router.push(
                role === "school_admin" ? "/admin"
                : role === "regional_admin" ? "/regional"
                : isCoordinator ? "/coordinator"
                : "/logbook"
              );
            }}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-light)" }}
            >
              <HelpCircle className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Replay App Tour
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                See the guided walkthrough again
              </p>
            </div>
          </button>
        )}

        {/* ═══ HELP HINTS TOGGLE ═══ */}
        {!loading && (
          hintsVisible ? (
            <button
              onClick={() => {
                localStorage.setItem("edlog-hints-dismissed", "true");
                setHintsVisible(false);
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--bg-tertiary)" }}
              >
                <EyeOff className="w-5 h-5" style={{ color: "var(--text-tertiary)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Hide Help Hints
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Remove the &quot;!&quot; indicators from buttons and cards
                </p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem("edlog-hints-dismissed");
                setHintsVisible(true);
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-light)" }}
              >
                <Eye className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Show Help Hints
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Re-enable the &quot;!&quot; helper indicators
                </p>
              </div>
            </button>
          )
        )}

        {/* ═══ SIGN OUT ═══ */}
        {!loading && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
              color: "#ef4444",
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}

        {/* Skeleton cards while loading */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>
    </div>
  );
}
