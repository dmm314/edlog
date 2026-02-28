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
} from "lucide-react";
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
  school: { name: string; code: string } | null;
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

  // Edit form state
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as Record<string, unknown> | undefined;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profileRes, entriesRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/entries?limit=1000"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setEditPhone(data.phone || "");
          setEditDob(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
          setEditGender(data.gender || "");
        }

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
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editPhone || null,
          dateOfBirth: editDob || null,
          gender: editGender || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) =>
          prev
            ? { ...prev, phone: updated.phone, dateOfBirth: updated.dateOfBirth, gender: updated.gender }
            : prev
        );
        setEditing(false);
      }
    } catch {
      // silently fail
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
            {profile?.gender && (
              <span className="bg-white/10 text-white text-xs rounded-full px-3 py-1 font-medium">
                {profile.gender === "MALE" ? "Male" : "Female"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 max-w-lg mx-auto">
        {/* Stats */}
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

        {/* Info Card */}
        <div className="card mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Personal Information
            </h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs text-brand-600 font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
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

          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 p-4">
              <School className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">School</p>
                <p className="text-sm font-medium text-slate-900">{profile?.school?.name || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {(profile?.role || (user.role as string))?.replace("_", " ").toLowerCase()}
                </p>
              </div>
            </div>

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

            <div className="flex items-center gap-3 p-4">
              <BookOpen className="w-5 h-5 text-slate-400" />
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
