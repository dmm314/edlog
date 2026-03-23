"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Shield,
  Globe,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

function getDashboardPath(role: string): string {
  switch (role) {
    case "REGIONAL_ADMIN": return "/regional";
    case "SCHOOL_ADMIN":   return "/admin";
    case "TEACHER":
    default:               return "/logbook";
  }
}

// ── Login Form ───────────────────────────────────────────
export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const registered   = searchParams.get("registered");

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Incorrect email or password."
            : "Could not connect. Check your internet and try again."
        );
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session    = await sessionRes.json();
        const role       = (session?.user as Record<string, unknown>)?.role as string;
        router.push(getDashboardPath(role || "TEACHER"));
        router.refresh();
      }
    } catch {
      setError("Could not connect. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /*
     * Background: explicit soft gray (hsl(var(--surface-canvas))).
     *   Light mode → 220 14% 96% = #f3f4f6-ish, never pure white.
     *   Dark mode  → 220 10% 8%  = near-black.
     * This creates real contrast between the page and the white card.
     */
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10"
      style={{ background: "hsl(var(--surface-canvas))" }}
    >
      {/* ── MAIN CARD ── */}
      <div
        className="relative z-10 w-full max-w-[400px] animate-fade-in rounded-2xl p-6"
        style={{
          background:  "hsl(var(--surface-elevated))",
          border:      "1px solid hsl(var(--border-primary))",
          boxShadow:   "0 4px 24px -4px rgba(0,0,0,0.10), 0 1px 4px -1px rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo + wordmark */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "#0866FF" }}
          >
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: "hsl(var(--text-primary))" }}
            >
              Edlog
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Success banner */}
        {registered && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "hsla(160, 84%, 39%, 0.09)",
              color:      "hsl(var(--success))",
            }}
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Account created. Sign in to continue.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "hsla(0, 72%, 51%, 0.09)",
              color:      "hsl(var(--danger))",
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="mb-1.5 block text-[13px] font-semibold"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="input-field"
              placeholder="you@school.cm"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="mb-1.5 block text-[13px] font-semibold"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="input-field pr-12"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "hsl(var(--text-tertiary))" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword
                  ? <EyeOff className="h-[18px] w-[18px]" />
                  : <Eye    className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {/*
           * SIGN-IN BUTTON
           * background: #0866FF — hardcoded Facebook blue, not a CSS variable.
           * This guarantees visibility in light mode, dark mode, and on older
           * Android WebViews that may not parse hsl(space-separated) syntax.
           * color: #FFFFFF — always white text on blue.
           */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-all duration-[80ms] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "#0866FF", minHeight: "48px", color: "#FFFFFF" }}
          >
            {loading ? (
              <>
                <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold"
            style={{ color: "#0866FF" }}
          >
            Get Started
          </Link>
        </p>
      </div>

      {/* ── REGISTER OPTIONS ── */}
      <div className="relative z-10 mt-4 w-full max-w-[400px] space-y-2">
        {/* Teacher */}
        <Link
          href="/register"
          className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-[80ms] active:scale-[0.98]"
          style={{
            background: "hsl(var(--surface-elevated))",
            border:     "1px solid hsl(var(--border-primary))",
            boxShadow:  "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "hsl(var(--accent-soft))" }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: "#0866FF" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>
              Teacher Account
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
              Join your school with a school code
            </p>
          </div>
          <ChevronRight
            className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5"
            style={{ color: "hsl(var(--text-tertiary))" }}
          />
        </Link>

        {/* School Admin */}
        <Link
          href="/register/school"
          className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-[80ms] active:scale-[0.98]"
          style={{
            background: "hsl(var(--surface-elevated))",
            border:     "1px solid hsl(var(--border-primary))",
            boxShadow:  "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "hsla(160, 84%, 39%, 0.1)" }}
          >
            <Shield className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>
              School Admin Account
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
              Register your school on Edlog
            </p>
          </div>
          <ChevronRight
            className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5"
            style={{ color: "hsl(var(--text-tertiary))" }}
          />
        </Link>

        {/* Regional Inspector — not yet available */}
        <div
          className="flex items-center gap-3.5 rounded-2xl p-4 opacity-50 cursor-not-allowed"
          style={{
            background: "hsl(var(--surface-elevated))",
            border:     "1px solid hsl(var(--border-muted))",
          }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "hsla(199, 89%, 48%, 0.1)" }}
          >
            <Globe className="h-5 w-5" style={{ color: "hsl(var(--info))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>
              Regional Inspector
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
              Contact your regional office
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
