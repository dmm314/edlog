"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  School,
  Calendar,
  BookOpen,
  LogOut,
  CheckCircle,
  XCircle,
  Camera,
  Edit3,
  Save,
  X,
  Building2,
  Phone,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

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
  school: { name: string; code: string; foundingDate: string | null } | null;
  teacherSchools?: {
    id: string;
    status: string;
    isPrimary: boolean;
    school: { id: string; name: string; code: string };
  }[];
}

interface ProfileStats {
  totalEntries: number;
  entriesThisMonth: number;
  entriesThisWeek: number;
  topSubject: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedTC, setCopiedTC] = useState(false);

  // Edit form state
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editFoundingDate, setEditFoundingDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as Record<string, unknown> | undefined;
  const isSchoolAdmin = (profile?.role || (user?.role as string)) === "SCHOOL_ADMIN";

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profileRes = await fetch("/api/profile");

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setEditPhone(data.phone || "");
          setEditDob(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
          setEditGender(data.gender || "");
          setEditFoundingDate(
            data.school?.foundingDate ? data.school.foundingDate.split("T")[0] : ""
          );
        }

        // Only fetch entries for teachers
        const role = (user?.role as string) || "";
        if (role === "TEACHER") {
          const entriesRes = await fetch("/api/entries?limit=1000");
          if (entriesRes.ok) {
            const data = await entriesRes.json();
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0, 0, 0, 0);

            const entries = data.entries || [];
            const thisMonth = entries.filter(
              (e: { date: string }) => new Date(e.date) >= startOfMonth
            );
            const thisWeek = entries.filter(
              (e: { date: string }) => new Date(e.date) >= startOfWeek
            );

            const subjectCounts: Record<string, number> = {};
            for (const entry of entries) {
              const topics = entry.topics || [];
              for (const t of topics) {
                const name = t?.subject?.name;
                if (name) subjectCounts[name] = (subjectCounts[name] || 0) + 1;
              }
            }
            const topSubject =
              Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

            setStats({
              totalEntries: data.total || 0,
              entriesThisMonth: thisMonth.length,
              entriesThisWeek: thisWeek.length,
              topSubject,
            });
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, unknown> = {
        phone: editPhone || null,
      };

      if (isSchoolAdmin) {
        // School admin: save founding date
        body.foundingDate = editFoundingDate || null;
      } else {
        // Teacher: save DOB and gender
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
          if (updated.school) {
            newProfile.school = { ...prev.school!, foundingDate: updated.school.foundingDate };
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

  if (!user) return null;

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${user.firstName as string} ${user.lastName as string}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-8 rounded-b-2xl">
        <div className="max-w-lg mx-auto text-center">
          <div className="relative inline-block">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-brand-700 transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <h1 className="text-xl font-bold text-white mt-3">{displayName}</h1>
          <p className="text-brand-400 text-sm mt-0.5">{profile?.email || (user.email as string)}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="bg-white/10 text-white text-xs rounded-full px-3 py-1 font-medium capitalize">
              {(profile?.role || (user.role as string))?.replace("_", " ").toLowerCase()}
            </span>
            {!isSchoolAdmin && profile?.gender && (
              <span className="bg-white/10 text-white text-xs rounded-full px-3 py-1 font-medium">
                {profile.gender === "MALE" ? "Male" : "Female"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 max-w-lg mx-auto">
        {/* Stats - only for teachers */}
        {!isSchoolAdmin && (
          <>
            {loading ? (
              <div className="card p-4 animate-pulse">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 bg-slate-200 rounded mb-1 mx-auto w-12" />
                      <div className="h-3 bg-slate-200 rounded mx-auto w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ) : stats ? (
              <div className="card p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-brand-950">{stats.totalEntries}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-950">{stats.entriesThisMonth}</p>
                    <p className="text-xs text-slate-400 mt-0.5">This Month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-950">{stats.entriesThisWeek}</p>
                    <p className="text-xs text-slate-400 mt-0.5">This Week</p>
                  </div>
                </div>
                {stats.topSubject && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">Most taught subject</p>
                    <p className="text-sm font-semibold text-brand-950 mt-0.5">{stats.topSubject}</p>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {/* Teacher Code & Schools (teachers only) */}
        {!isSchoolAdmin && profile?.teacherCode && (
          <div className="card mt-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Your Teacher ID
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gradient-to-r from-brand-50 to-slate-50 border border-brand-100 rounded-xl px-4 py-2.5 font-mono text-lg text-brand-950 font-black tracking-widest">
                {profile.teacherCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile.teacherCode!);
                  setCopiedTC(true);
                  setTimeout(() => setCopiedTC(false), 2000);
                }}
                className={`p-3 rounded-xl transition-all active:scale-95 shadow-sm ${
                  copiedTC
                    ? "bg-emerald-500 text-white"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                {copiedTC ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Share this ID with school admins so they can add you to their school
            </p>
          </div>
        )}

        {/* Schools membership link (teachers only) */}
        {!isSchoolAdmin && (
          <Link
            href="/invitations"
            className="card mt-3 p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900">My Schools</p>
                <p className="text-[11px] text-slate-400">
                  {profile?.teacherSchools
                    ? `${profile.teacherSchools.filter((ts) => ts.status === "ACTIVE").length} active school(s)`
                    : "View invitations"}
                  {profile?.teacherSchools?.some((ts) => ts.status === "PENDING") &&
                    " · New invitation!"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Info Card */}
        <div className="card mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {isSchoolAdmin ? "Profile & School Info" : "Personal Information"}
            </h3>
            {!editing ? (
              <button
                onClick={() => { setEditing(true); setSaveError(""); }}
                className="flex items-center gap-1 text-xs text-brand-600 font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(false); setSaveError(""); }}
                  className="flex items-center gap-1 text-xs text-slate-500 font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs text-brand-600 font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <div className="mx-4 mb-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {saveError}
            </div>
          )}

          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 p-4">
              <School className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">School</p>
                <p className="text-sm font-medium text-slate-900">{profile?.school?.name || "—"}</p>
              </div>
            </div>

            {isSchoolAdmin && (
              <Link
                href="/admin/school"
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">School Settings</p>
                    <p className="text-sm font-medium text-slate-900">Open school profile editor</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            <div className="flex items-center gap-3 p-4">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {(profile?.role || (user.role as string))?.replace("_", " ").toLowerCase()}
                </p>
              </div>
            </div>

            {/* School Admin: Founding Date instead of DOB/Gender */}
            {isSchoolAdmin ? (
              <div className="flex items-center gap-3 p-4">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Founding Date</p>
                  {editing ? (
                    <input
                      type="date"
                      value={editFoundingDate}
                      onChange={(e) => setEditFoundingDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">
                      {profile?.school?.foundingDate
                        ? formatDate(profile.school.foundingDate)
                        : "Not set"}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Teacher: Date of Birth */}
                <div className="flex items-center gap-3 p-4">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Date of Birth</p>
                    {editing ? (
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="input-field mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not set"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Teacher: Gender */}
                <div className="flex items-center gap-3 p-4">
                  <User className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Gender</p>
                    {editing ? (
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="input-field mt-1"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.gender === "MALE" ? "Male" : profile?.gender === "FEMALE" ? "Female" : "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 p-4">
              <Phone className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400">Phone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input-field mt-1"
                    placeholder="+237 6XX XXX XXX"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{profile?.phone || "Not set"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-medium text-slate-900">
                  {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              {profile?.isVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-xs text-slate-400">Verification Status</p>
                <p className={`text-sm font-medium ${profile?.isVerified ? "text-green-700" : "text-amber-700"}`}>
                  {profile?.isVerified ? "Verified" : "Pending Verification"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary w-full mt-6 flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
