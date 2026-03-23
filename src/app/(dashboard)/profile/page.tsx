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
  GraduationCap,
  BookOpen,
  Flame,
  TrendingUp,
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
    case "TEACHER": return "hsl(var(--accent))";
    case "SCHOOL_ADMIN": return "hsl(var(--accent))";
    case "REGIONAL_ADMIN": return "hsl(var(--success))";
    default: return "hsl(var(--accent))";
  }
}

function getBannerGradient(role: string) {
  switch (role) {
    case "TEACHER":
      return "linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)";
    case "SCHOOL_ADMIN":
      return "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)";
    case "REGIONAL_ADMIN":
      return "linear-gradient(135deg, #0c1628 0%, #0f172a 50%, #1e3a5f 100%)";
    default:
      return "hsl(var(--accent))";
  }
}

// ── Sub-components ────────────────────────────────────────

function SkeletonBanner() {
  return (
    <div className="animate-pulse">
      <div className="w-full" style={{ height: 140, backgroundColor: "hsl(var(--surface-tertiary))" }} />
      <div className="max-w-lg mx-auto px-5 -mt-11 flex flex-col items-center">
        <div className="w-[88px] h-[88px] rounded-full" style={{ backgroundColor: "var(--skeleton-base)", border: "4px solid hsl(var(--surface-canvas))" }} />
        <div className="h-5 rounded w-40 mt-3" style={{ backgroundColor: "var(--skeleton-base)" }} />
        <div className="h-3 rounded w-48 mt-2" style={{ backgroundColor: "var(--skeleton-base)" }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}>
      <div className="h-3 rounded w-24 mb-3" style={{ backgroundColor: "var(--skeleton-base)" }} />
      <div className="space-y-2.5">
        <div className="h-3 rounded w-full" style={{ backgroundColor: "var(--skeleton-base)" }} />
        <div className="h-3 rounded w-3/4" style={{ backgroundColor: "var(--skeleton-base)" }} />
      </div>
    </div>
  );
}

// Info row — icon + stacked label / value (replaces all flat label: value pairs)
function InfoRow({
  icon,
  label,
  value,
  missingText,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  missingText?: string;
  mono?: boolean;
}) {
  const isEmpty = !value;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "hsl(var(--surface-tertiary))" }}
      >
        <span className="flex" style={{ color: "var(--text-tertiary)" }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p
          className={`text-sm font-semibold mt-0.5 ${mono ? "font-mono tracking-wider" : ""}`}
          style={{
            color: isEmpty
              ? (missingText ? "var(--accent-text)" : "var(--text-quaternary)")
              : "var(--text-primary)",
          }}
        >
          {isEmpty ? (missingText || "—") : value}
        </p>
      </div>
    </div>
  );
}

// Section card — header (always visible) + collapsible body
function SectionCard({
  title,
  children,
  expandable,
  expanded,
  onToggle,
  rightBadge,
  noPadding,
}: {
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  rightBadge?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
    >
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70"
          style={{ color: "var(--text-primary)" }}
        >
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.05em]"
            style={{ color: "var(--text-tertiary)" }}
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
        <div className="px-4 pt-3.5 pb-1">
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.05em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {title}
          </span>
        </div>
      )}

      {/* Animated body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={
          expandable
            ? { maxHeight: expanded ? 1200 : 0, opacity: expanded ? 1 : 0 }
            : {}
        }
      >
        <div className={noPadding ? "" : "px-4 pb-4"}>{children}</div>
      </div>

      {!expandable && <div className={noPadding ? "" : "px-4 pb-4"}>{children}</div>}
    </div>
  );
}

// Quick link row with icon in rounded square
function QuickLinkRow({
  href,
  icon,
  label,
  iconBg,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  iconBg?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2.5 group transition-colors"
      style={{ color: "var(--text-primary)" }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg || "hsl(var(--surface-tertiary))" }}
      >
        <span className="flex" style={{ color: iconBg ? "white" : "var(--text-tertiary)" }}>{icon}</span>
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      <ChevronRight
        className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
        style={{ color: "var(--text-quaternary)" }}
      />
    </Link>
  );
}

// Inline edit form save/cancel row
function EditActions({
  onCancel,
  onSave,
  saving,
  error,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}) {
  return (
    <div className="pt-2 space-y-2">
      {error && (
        <div
          className="text-xs rounded-xl px-3 py-2"
          style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}
        >
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
          style={{ color: "var(--text-secondary)", background: "hsl(var(--surface-tertiary))" }}
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personalInfo: true,
    mySchools: true,
    assignments: true,
    schoolProfile: true,
    adminPersonal: true,
    regionOverview: true,
    regionalPersonal: true,
  });
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
      } catch { /* silently fail */ }
      finally { setLoading(false); }
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
          const next = { ...prev, phone: updated.phone, dateOfBirth: updated.dateOfBirth, gender: updated.gender };
          if (updated.school && prev.school) {
            next.school = {
              ...prev.school,
              principalName: updated.school.principalName ?? prev.school.principalName,
              principalPhone: updated.school.principalPhone ?? prev.school.principalPhone,
            };
          }
          return next;
        });
        setEditingSection(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save");
      }
    } catch { setSaveError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Photo must be under 2MB"); return; }
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
      } catch { /* silently fail */ }
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
            teacherSchools: prev.teacherSchools
              ?.map((ts) => ts.id === membershipId ? { ...ts, status: action === "accept" ? "ACTIVE" : "REMOVED" } : ts)
              .filter((ts) => ts.status !== "REMOVED"),
          };
        });
      }
    } catch { /* silently fail */ }
  }

  if (!user) return null;

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${user.firstName as string} ${user.lastName as string}`;

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : `${(user.firstName as string)?.[0] || ""}${(user.lastName as string)?.[0] || ""}`;

  const pendingInvitations = profile?.teacherSchools?.filter((ts) => ts.status === "PENDING") || [];

  // Build assignment summary (grouped by subject)
  const assignmentGroups: Record<string, string[]> = {};
  for (const a of profile?.assignments || []) {
    const subj = a.subject.name + (a.division ? ` (${a.division.name})` : "");
    if (!assignmentGroups[subj]) assignmentGroups[subj] = [];
    assignmentGroups[subj].push(a.class.name);
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>

      {/* ══ BANNER + AVATAR ══ */}
      {loading ? <SkeletonBanner /> : (
        <div className="animate-fade-in">
          {/* Banner */}
          <div
            className="w-full relative overflow-hidden"
            style={{ height: 140, background: getBannerGradient(role) }}
          >
            {/* Subtle dot-grid texture */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Soft vignette */}
            <div
              className="absolute inset-x-0 bottom-0 h-16"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.25))" }}
            />
          </div>

          {/* Avatar + identity block */}
          <div className="max-w-lg mx-auto px-5 -mt-11 flex flex-col items-center">
            <div className="relative">
              {profile?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt="Profile photo"
                  className="w-[88px] h-[88px] rounded-full object-cover"
                  style={{ border: "4px solid hsl(var(--surface-canvas))", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
                />
              ) : (
                <div
                  className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{
                    backgroundColor: getInitialsBg(role),
                    border: "4px solid hsl(var(--surface-canvas))",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    }}
                >
                  {initials.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
                title="Change photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Name + role pill */}
            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              <h1
                className="font-bold text-[22px] leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {displayName}
              </h1>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-text)" }}
              >
                {getRoleBadgeLabel(role)}
              </span>
            </div>

            {/* Email */}
            <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
              {profile?.email}
            </p>

            {/* Verification badge */}
            {profile?.isVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold mt-1.5" style={{ color: "hsl(var(--success))" }}>
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            ) : role === "TEACHER" ? (
              <span className="flex items-center gap-1 text-[11px] font-medium mt-1.5" style={{ color: "var(--text-quaternary)" }}>
                <XCircle className="w-3 h-3" /> Awaiting verification
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* ══ CONTENT ══ */}
      <div className="px-4 mt-5 max-w-lg mx-auto flex flex-col gap-2.5">

        {/* ── Mode switcher (dual-role teachers) ── */}
        {isCoordinator && hasTeachingAssignments && !loading && (
          <div
            className="rounded-2xl p-3 animate-fade-slide-in"
            style={{
              backgroundColor: activeMode === "coordinator" ? "hsl(var(--accent) / 0.06)" : "hsl(var(--surface-elevated))",
              border: `1px solid ${activeMode === "coordinator" ? "hsl(var(--accent) / 0.22)" : "hsl(var(--border-primary))"}`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-content-tertiary">
              Switch portal
            </p>
            <div className="flex gap-1.5">
              {[
                { mode: "teacher" as const, label: "Teacher" },
                { mode: "coordinator" as const, label: coordinatorTitle || "Coordinator" },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: activeMode === mode
                      ? "hsl(var(--accent))"
                      : "hsl(var(--surface-tertiary))",
                    color: activeMode === mode ? "white" : "hsl(var(--text-tertiary))",
                    boxShadow: activeMode === mode
                      ? "0 2px 8px hsl(var(--accent) / 0.35)"
                      : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Stats Bar ── */}
        {loading ? <SkeletonCard /> : (
          <>
            {/* Teacher stats */}
            {role === "TEACHER" && profile?.teacherStats && (
              <div
                className="rounded-2xl overflow-hidden animate-fade-slide-in"
                style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex">
                  {[
                    {
                      value: profile.teacherStats.totalEntries,
                      label: "entries",
                      icon: <BookOpen className="w-3 h-3" />,
                      tint: false,
                    },
                    {
                      value: profile.teacherStats.streak,
                      label: "streak",
                      icon: <Flame className="w-3 h-3" />,
                      tint: true,
                    },
                    {
                      value: `${profile.teacherStats.syllabusCoverage}%`,
                      label: "syllabus",
                      icon: <TrendingUp className="w-3 h-3" />,
                      tint: false,
                    },
                    {
                      value: profile.teacherStats.topSubject || "—",
                      label: "top subj",
                      icon: <GraduationCap className="w-3 h-3" />,
                      tint: false,
                      small: profile.teacherStats.topSubject ? profile.teacherStats.topSubject.length > 7 : false,
                    },
                  ].map((cell, i) => (
                    <div
                      key={cell.label}
                      className="flex-1 flex flex-col items-center justify-center py-3.5 px-1 text-center"
                      style={{
                        borderLeft: i > 0 ? "1px solid var(--border-secondary)" : "none",
                        background: cell.tint ? "hsl(var(--accent) / 0.05)" : "transparent",
                      }}
                    >
                      <span
                        className="font-mono font-bold block tabular-nums leading-none"
                        style={{
                          color: cell.tint ? "var(--accent-text)" : "var(--text-primary)",
                          fontSize: cell.small ? 13 : 20,
                        }}
                      >
                        {cell.value}
                      </span>
                      <span
                        className="flex items-center gap-0.5 mt-1.5 font-medium uppercase"
                        style={{ color: "var(--text-tertiary)", fontSize: 9, letterSpacing: "0.06em" }}
                      >
                        <span style={{ color: cell.tint ? "var(--accent-text)" : "var(--text-quaternary)" }}>
                          {cell.icon}
                        </span>
                        {cell.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* School admin stats */}
            {role === "SCHOOL_ADMIN" && profile?.schoolStats && (
              <div
                className="rounded-2xl overflow-hidden animate-fade-slide-in"
                style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex">
                  {[
                    { value: profile.schoolStats.totalTeachers, label: "teachers" },
                    { value: profile.schoolStats.entriesThisMonth, label: "entries/mo" },
                    { value: `${profile.schoolStats.complianceRate}%`, label: "compliance" },
                  ].map((cell, i) => (
                    <div
                      key={cell.label}
                      className="flex-1 flex flex-col items-center justify-center py-3.5 px-1 text-center"
                      style={{ borderLeft: i > 0 ? "1px solid var(--border-secondary)" : "none" }}
                    >
                      <span className="font-mono text-xl font-bold block tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                        {cell.value}
                      </span>
                      <span className="mt-1.5 font-medium uppercase" style={{ color: "var(--text-tertiary)", fontSize: 9, letterSpacing: "0.06em" }}>
                        {cell.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regional admin stats */}
            {role === "REGIONAL_ADMIN" && profile?.regionStats && (
              <div
                className="rounded-2xl overflow-hidden animate-fade-slide-in"
                style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex">
                  {[
                    { value: profile.regionStats.totalSchools, label: "schools" },
                    { value: profile.regionStats.totalTeachers, label: "teachers" },
                    { value: `${profile.regionStats.complianceRate}%`, label: "avg compliance" },
                  ].map((cell, i) => (
                    <div
                      key={cell.label}
                      className="flex-1 flex flex-col items-center justify-center py-3.5 px-1 text-center"
                      style={{ borderLeft: i > 0 ? "1px solid var(--border-secondary)" : "none" }}
                    >
                      <span className="font-mono text-xl font-bold block tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
                        {cell.value}
                      </span>
                      <span className="mt-1.5 font-medium uppercase" style={{ color: "var(--text-tertiary)", fontSize: 9, letterSpacing: "0.06em" }}>
                        {cell.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ TEACHER SECTIONS ══ */}
        {role === "TEACHER" && !loading && (
          <>
            {/* Teacher ID badge */}
            {profile?.teacherCode && (
              <div
                className="rounded-2xl overflow-hidden animate-fade-slide-in"
                style={{ border: "1px solid var(--border-primary)" }}
              >
                <div
                  className="relative px-4 py-4"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--surface-elevated)) 0%, hsl(var(--accent) / 0.06) 100%)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Teacher ID
                      </p>
                      <p
                        className="font-mono font-bold tracking-[0.12em] mt-1"
                        style={{ color: "var(--text-primary)", fontSize: 26, lineHeight: 1 }}
                      >
                        {profile.teacherCode}
                      </p>
                      <p className="text-[11px] mt-2" style={{ color: "var(--text-tertiary)" }}>
                        Share this code with your school admin
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.teacherCode!);
                        setCopiedTC(true);
                        setTimeout(() => setCopiedTC(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all mt-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: copiedTC ? "hsl(var(--success) / 0.12)" : "hsl(var(--surface-elevated))",
                        color: copiedTC ? "hsl(var(--success))" : "var(--text-secondary)",
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

            {/* Personal Info */}
            <SectionCard
              title="Personal info"
              expandable
              expanded={expandedSections.personalInfo}
              onToggle={() => toggleSection("personalInfo")}
            >
              {editingSection === "personalInfo" ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Phone number</label>
                      <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-field py-2 px-3 text-sm w-full" placeholder="+237 6XX XXX XXX" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Gender</label>
                      <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="input-field py-2 px-3 text-sm w-full">
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Date of birth</label>
                      <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className="input-field py-2 px-3 text-sm w-full" />
                    </div>
                  </div>
                  <EditActions
                    onCancel={() => setEditingSection(null)}
                    onSave={handleSaveProfile}
                    saving={saving}
                    error={saveError}
                  />
                </div>
              ) : (
                <div className="pt-1">
                  <div
                    style={{
                      borderTop: "1px solid var(--border-secondary)",
                    }}
                  >
                    <InfoRow
                      icon={<User className="w-3.5 h-3.5" />}
                      label="Full name"
                      value={displayName}
                    />
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow
                        icon={<Phone className="w-3.5 h-3.5" />}
                        label="Phone"
                        value={profile?.phone}
                        missingText="Add your phone number"
                      />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow
                        icon={<User className="w-3.5 h-3.5" />}
                        label="Gender"
                        value={profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : null}
                      />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        label="Date of birth"
                        value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
                      />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        label="Member since"
                        value={profile?.createdAt ? formatDate(profile.createdAt) : null}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSection("personalInfo")}
                    className="flex items-center gap-1.5 text-xs font-semibold mt-3 px-3 py-1.5 rounded-xl transition-colors"
                    style={{ color: "var(--accent-text)", background: "var(--accent-soft)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit info
                  </button>
                </div>
              )}
            </SectionCard>

            {/* My Schools */}
            <SectionCard
              title="My Schools"
              expandable
              expanded={expandedSections.mySchools}
              onToggle={() => toggleSection("mySchools")}
              rightBadge={
                pendingInvitations.length > 0 ? (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-text)" }}
                  >
                    {pendingInvitations.length} pending
                  </span>
                ) : null
              }
            >
              <div className="pt-1">
                {profile?.teacherSchools && profile.teacherSchools.length > 0 ? (
                  <div className="space-y-1">
                    {profile.teacherSchools.map((ts, i) => (
                      <div
                        key={ts.id}
                        className="flex items-center justify-between py-2.5"
                        style={{ borderTop: i > 0 ? "1px solid var(--border-secondary)" : "none" }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ts.status === "ACTIVE" ? "hsl(var(--success))" : "var(--accent)" }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                              {ts.school.name}
                            </p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: ts.status === "PENDING" ? "var(--accent-text)" : "var(--text-tertiary)" }}>
                              {ts.isPrimary ? "Primary school" : ts.status === "PENDING" ? "Invitation pending" : "Invited school"} · {ts.school.code}
                            </p>
                          </div>
                        </div>
                        {ts.status === "PENDING" && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={() => handleInvitation(ts.id, "accept")}
                              className="p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              style={{ background: "hsl(var(--success) / 0.1)", color: "hsl(var(--success))" }}
                              title="Accept"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleInvitation(ts.id, "decline")}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: "hsl(var(--danger) / 0.08)", color: "hsl(var(--danger))" }}
                              title="Decline"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-2" style={{ color: "var(--text-tertiary)" }}>No school memberships yet.</p>
                )}
              </div>
            </SectionCard>

            {/* My Assignments */}
            {profile?.assignments && profile.assignments.length > 0 && (
              <SectionCard
                title="My Assignments"
                expandable
                expanded={expandedSections.assignments}
                onToggle={() => toggleSection("assignments")}
              >
                <div className="pt-1">
                  {expandedSections.assignments ? (
                    <div>
                      {Object.entries(assignmentGroups).map(([subj, classes], i) => (
                        <div
                          key={subj}
                          className="py-2.5"
                          style={{ borderTop: i > 0 ? "1px solid var(--border-secondary)" : "none" }}
                        >
                          <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{subj}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {classes.map((cls) => (
                              <span
                                key={cls}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                                style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] py-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {Object.entries(assignmentGroups).map(([s, c]) => `${s} — ${c.join(", ")}`).join(" · ")}
                    </p>
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ══ SCHOOL ADMIN SECTIONS ══ */}
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
                  <div className="space-y-3 pt-1">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Principal name</label>
                        <input type="text" value={editPrincipalName} onChange={(e) => setEditPrincipalName(e.target.value)} className="input-field py-2 px-3 text-sm w-full" placeholder="Principal full name" />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Principal phone</label>
                        <input type="tel" value={editPrincipalPhone} onChange={(e) => setEditPrincipalPhone(e.target.value)} className="input-field py-2 px-3 text-sm w-full" placeholder="+237 6XX XXX XXX" />
                      </div>
                    </div>
                    <EditActions onCancel={() => setEditingSection(null)} onSave={handleSaveProfile} saving={saving} error={saveError} />
                  </div>
                ) : (
                  <div className="pt-1">
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="School name" value={profile.school.name} />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<Key className="w-3.5 h-3.5" />} label="School code" value={profile.school.code} mono />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<Layers className="w-3.5 h-3.5" />} label="Type" value={profile.school.schoolType} />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Region" value={profile.school.region?.name} />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Division" value={profile.school.division?.name} />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Principal" value={profile.school.principalName} missingText="Add principal name" />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Principal phone" value={profile.school.principalPhone} missingText="Add principal phone" />
                    </div>
                    {profile.school.foundingDate && (
                      <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                        <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Founded" value={formatDate(profile.school.foundingDate)} />
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--surface-tertiary))" }}>
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Status</p>
                          <p className="text-sm font-semibold mt-0.5" style={{ color: profile.school.status === "ACTIVE" ? "hsl(var(--success))" : "var(--accent-text)" }}>
                            {profile.school.status}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingSection("schoolProfile")}
                      className="flex items-center gap-1.5 text-xs font-semibold mt-2 px-3 py-1.5 rounded-xl transition-colors"
                      style={{ color: "var(--accent-text)", background: "var(--accent-soft)" }}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit school info
                    </button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Quick Links */}
            <div
              className="rounded-2xl px-4 py-3 animate-fade-slide-in"
              style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-tertiary)" }}>Quick links</p>
              <QuickLinkRow href="/admin/teachers" icon={<Users className="w-4 h-4" />} label="Manage Teachers" />
              <QuickLinkRow href="/admin/reports/teachers" icon={<BarChart3 className="w-4 h-4" />} label="Reports" />
              <QuickLinkRow href="/admin/announcements" icon={<Megaphone className="w-4 h-4" />} label="Send Announcement" />
              <QuickLinkRow href="/admin/timetable" icon={<Calendar className="w-4 h-4" />} label="Timetable" />
            </div>

            {/* Personal Info */}
            <SectionCard
              title="Personal info"
              expandable
              expanded={expandedSections.adminPersonal}
              onToggle={() => toggleSection("adminPersonal")}
            >
              {editingSection === "adminPersonal" ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Phone number</label>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-field py-2 px-3 text-sm w-full" placeholder="+237 6XX XXX XXX" />
                  </div>
                  <EditActions onCancel={() => setEditingSection(null)} onSave={handleSaveProfile} saving={saving} error={saveError} />
                </div>
              ) : (
                <div className="pt-1">
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Full name" value={displayName} />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={profile?.phone} missingText="Add your phone number" />
                  </div>
                  <button
                    onClick={() => setEditingSection("adminPersonal")}
                    className="flex items-center gap-1.5 text-xs font-semibold mt-3 px-3 py-1.5 rounded-xl"
                    style={{ color: "var(--accent-text)", background: "var(--accent-soft)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit info
                  </button>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ══ REGIONAL ADMIN SECTIONS ══ */}
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
                <div className="pt-1">
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Region" value={profile.regionAdmin.name} />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<Key className="w-3.5 h-3.5" />} label="Code" value={profile.regionAdmin.code} mono />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Capital" value={profile.regionAdmin.capital} />
                  </div>
                  {profile.regionStats && (
                    <>
                      <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                        <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Schools" value={String(profile.regionStats.totalSchools)} />
                      </div>
                      <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                        <InfoRow icon={<Users className="w-3.5 h-3.5" />} label="Teachers" value={String(profile.regionStats.totalTeachers)} />
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Quick Links */}
            <div
              className="rounded-2xl px-4 py-3 animate-fade-slide-in"
              style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-tertiary)" }}>Quick links</p>
              <QuickLinkRow href="/regional/schools" icon={<Building2 className="w-4 h-4" />} label="Schools" />
              <QuickLinkRow href="/regional/reports/schools" icon={<BarChart3 className="w-4 h-4" />} label="Reports" />
              <QuickLinkRow href="/regional/reports/coverage" icon={<Layers className="w-4 h-4" />} label="Curriculum Coverage" />
              <QuickLinkRow href="/regional/announcements" icon={<Megaphone className="w-4 h-4" />} label="Send Announcement" />
              <QuickLinkRow href="/regional/codes" icon={<Key className="w-4 h-4" />} label="Registration Codes" />
            </div>

            {/* Personal Info */}
            <SectionCard
              title="Personal info"
              expandable
              expanded={expandedSections.regionalPersonal}
              onToggle={() => toggleSection("regionalPersonal")}
            >
              {editingSection === "regionalPersonal" ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Phone number</label>
                      <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-field py-2 px-3 text-sm w-full" placeholder="+237 6XX XXX XXX" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Gender</label>
                      <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="input-field py-2 px-3 text-sm w-full">
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Date of birth</label>
                      <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className="input-field py-2 px-3 text-sm w-full" />
                    </div>
                  </div>
                  <EditActions onCancel={() => setEditingSection(null)} onSave={handleSaveProfile} saving={saving} error={saveError} />
                </div>
              ) : (
                <div className="pt-1">
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Full name" value={displayName} />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={profile?.phone} missingText="Add your phone number" />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <InfoRow
                      icon={<User className="w-3.5 h-3.5" />}
                      label="Gender"
                      value={profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : null}
                    />
                  </div>
                  <button
                    onClick={() => setEditingSection("regionalPersonal")}
                    className="flex items-center gap-1.5 text-xs font-semibold mt-3 px-3 py-1.5 rounded-xl"
                    style={{ color: "var(--accent-text)", background: "var(--accent-soft)" }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit info
                  </button>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ══ SETTINGS GROUP ══ */}
        {!loading && (
          <div
            className="rounded-2xl px-4 py-3 animate-fade-slide-in"
            style={{ backgroundColor: "hsl(var(--surface-elevated))", border: "1px solid var(--border-primary)" }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-tertiary)" }}>Settings</p>

            {/* Appearance */}
            <Link
              href="/appearance"
              className="flex items-center gap-3 py-2.5 group transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--surface-tertiary))" }}>
                <span className="flex items-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                  <Sun className="w-3 h-3" />
                  <Moon className="w-3 h-3" />
                </span>
              </div>
              <span className="text-sm font-medium flex-1">Appearance</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-quaternary)" }} />
            </Link>

            {/* Replay Tour */}
            <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
              <button
                onClick={() => {
                  const r = (profile?.role || "TEACHER").toLowerCase();
                  const key = r === "school_admin" ? "admin" : r === "regional_admin" ? "regional" : isCoordinator ? "coordinator" : "teacher";
                  localStorage.removeItem(`edlog-tour-${key}`);
                  router.push(r === "school_admin" ? "/admin" : r === "regional_admin" ? "/regional" : isCoordinator ? "/coordinator" : "/logbook");
                }}
                className="w-full flex items-center gap-3 py-2.5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--surface-tertiary))" }}>
                  <HelpCircle className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Replay app tour</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>See the guided walkthrough again</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-quaternary)" }} />
              </button>
            </div>

            {/* Help Hints toggle */}
            <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
              <button
                onClick={() => {
                  if (hintsVisible) {
                    localStorage.setItem("edlog-hints-dismissed", "true");
                    setHintsVisible(false);
                  } else {
                    localStorage.removeItem("edlog-hints-dismissed");
                    setHintsVisible(true);
                  }
                }}
                className="w-full flex items-center gap-3 py-2.5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--surface-tertiary))" }}>
                  {hintsVisible
                    ? <EyeOff className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                    : <Eye className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  }
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {hintsVisible ? "Hide help hints" : "Show help hints"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {hintsVisible ? "Remove the '!' indicators" : "Re-enable helper indicators"}
                  </p>
                </div>
                <div
                  className="w-10 h-5.5 rounded-full flex-shrink-0 flex items-center transition-all"
                  style={{
                    background: hintsVisible ? "var(--accent)" : "hsl(var(--surface-tertiary))",
                    padding: "2px",
                    width: 36,
                    height: 20,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: hintsVisible ? "translateX(16px)" : "translateX(0px)" }}
                  />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Skeleton cards ── */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* ══ SIGN OUT ══ */}
        {!loading && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "hsl(var(--danger) / 0.06)",
              border: "1px solid hsl(var(--danger) / 0.15)",
              color: "hsl(var(--danger))",
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}

      </div>
    </div>
  );
}
