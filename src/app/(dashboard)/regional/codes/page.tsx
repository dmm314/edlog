"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Plus,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RegCode {
  id: string;
  code: string;
  usedAt: string | null;
  usedBy: string | null;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      const res = await fetch("/api/regional/codes");
      if (res.ok) setCodes(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/regional/codes", { method: "POST" });
      if (res.ok) {
        const newCode = await res.json();
        setCodes((prev) => [newCode, ...prev]);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const available = codes.filter((c) => !c.isUsed && !c.isExpired);
  const used = codes.filter((c) => c.isUsed);
  const expired = codes.filter((c) => c.isExpired && !c.isUsed);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg lg:max-w-4xl mx-auto">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Registration Codes
              </h1>
              <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
                Generate one-time codes for school registration
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 bg-[hsl(var(--surface-elevated))]/10 hover:bg-[hsl(var(--surface-elevated))]/20 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <Plus className="w-4 h-4" />
              {generating ? "..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg lg:max-w-4xl mx-auto space-y-4">
        {/* Status summary */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2 text-center bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]">
            <p className="text-lg font-bold">{available.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide">
              Available
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent-strong))]">
            <p className="text-lg font-bold">{used.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide">
              Used
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)]">
            <p className="text-lg font-bold">{expired.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide">
              Expired
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-4 bg-[hsl(var(--accent-soft))] border border-[hsl(var(--accent-muted))]">
          <h3 className="text-sm font-semibold text-[hsl(var(--accent-text))] mb-1">
            How it works
          </h3>
          <ol className="text-xs text-[hsl(var(--accent-strong))] space-y-1 list-decimal list-inside">
            <li>Generate a registration code</li>
            <li>Share it with the school administrator</li>
            <li>They enter the code when registering their school</li>
            <li>Each code can only be used once and expires in 7 days</li>
          </ol>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)]">No codes generated yet</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Tap &quot;Generate&quot; to create a registration code
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => (
              <div
                key={code.id}
                className={`card p-4 ${
                  code.isUsed
                    ? "bg-[hsl(var(--surface-tertiary))]"
                    : code.isExpired
                    ? "bg-[hsl(var(--danger)/0.05)]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-[var(--text-primary)] tracking-wider">
                      {code.code}
                    </span>
                    {!code.isUsed && !code.isExpired && (
                      <button
                        onClick={() => copyCode(code.code, code.id)}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-text)] transition-colors"
                      >
                        {copiedId === code.id ? (
                          <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {code.isUsed ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--accent))] bg-[hsl(var(--accent-soft))] px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Used
                    </span>
                  ) : code.isExpired ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.1)] px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)] px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <div className="text-xs text-[var(--text-tertiary)] space-y-0.5">
                  <p>Created: {formatDate(code.createdAt)}</p>
                  <p>Expires: {formatDate(code.expiresAt)}</p>
                  {code.usedBy && (
                    <p className="text-[hsl(var(--accent))]">Used by: {code.usedBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
