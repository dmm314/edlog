"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  X,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Membership {
  id: string;
  status: "PENDING" | "ACTIVE";
  isPrimary: boolean;
  joinedAt: string | null;
  createdAt: string;
  school: {
    id: string;
    name: string;
    code: string;
    schoolType: string | null;
    region: { name: string } | null;
    division: { name: string } | null;
  };
}

export default function InvitationsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch("/api/teacher/invitations");
        if (res.ok) {
          const data = await res.json();
          setMemberships(data.memberships);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
  }, []);

  async function handleRespond(membershipId: string, action: "accept" | "decline") {
    setResponding(membershipId);
    setMessage("");
    try {
      const res = await fetch("/api/teacher/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        // Update local state
        if (action === "accept") {
          setMemberships((prev) =>
            prev.map((m) =>
              m.id === membershipId
                ? { ...m, status: "ACTIVE" as const, joinedAt: new Date().toISOString() }
                : m
            )
          );
        } else {
          setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
        }
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setMessage("Failed to connect");
    } finally {
      setResponding(null);
    }
  }

  const pending = memberships.filter((m) => m.status === "PENDING");
  const active = memberships.filter((m) => m.status === "ACTIVE");

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--accent)/0.08)] via-transparent to-transparent" />
        <div className="max-w-lg mx-auto relative">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--header-text-muted)]" />
            My Schools
          </h1>
          <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
            Invitations & school memberships
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {message && (
          <div className="bg-[var(--accent-soft)] border border-[var(--border-primary)] text-[var(--accent-text)] text-sm rounded-xl px-4 py-3">
            {message}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-[var(--skeleton-base)] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Pending Invitations */}
            {pending.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {pending.map((m) => (
                    <div
                      key={m.id}
                      className="card p-4 border-l-4 border-l-[hsl(var(--accent-glow))]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-[hsl(var(--accent-glow))] to-[hsl(var(--accent-strong))] rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">
                            {m.school.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                            Code: {m.school.code}
                            {m.school.schoolType && ` · ${m.school.schoolType}`}
                          </p>
                          {m.school.region && (
                            <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {m.school.division?.name}, {m.school.region.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRespond(m.id, "accept")}
                          disabled={responding === m.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(m.id, "decline")}
                          disabled={responding === m.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[hsl(var(--surface-tertiary))] hover:bg-[hsl(var(--surface-secondary))] text-[var(--text-secondary)] text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </button>
                      </div>

                      <p className="text-[10px] text-[var(--text-tertiary)] mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Invited{" "}
                        {new Date(m.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Schools */}
            {active.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-1">
                  My Schools
                </h3>
                <div className="space-y-2">
                  {active.map((m) => (
                    <div key={m.id} className="card p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            m.isPrimary
                              ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)]"
                              : "bg-gradient-to-br from-slate-400 to-slate-600"
                          }`}
                        >
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">
                              {m.school.name}
                            </h4>
                            {m.isPrimary && (
                              <span className="text-[9px] font-bold bg-[var(--accent-soft)] text-[var(--accent-text)] px-1.5 py-0.5 rounded border border-[var(--border-secondary)] flex-shrink-0">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                            {m.school.code}
                            {m.school.region && ` · ${m.school.region.name}`}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memberships.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-[var(--text-quaternary)] mx-auto mb-3" />
                <p className="text-[var(--text-secondary)] font-semibold">No schools yet</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  When a school invites you, it will appear here
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
