/**
 * ================================================================
 * LOGIN FORM COMPONENT
 * ================================================================
 *
 * This is the main login page for Edlog. It handles:
 *   1. Collecting email + password from the user
 *   2. Calling NextAuth's signIn() function
 *   3. Fetching the session to determine the user's role
 *   4. Redirecting to the correct dashboard based on role
 *
 * HOW THE LOGIN FLOW WORKS:
 *   - signIn("credentials", { email, password, redirect: false })
 *     calls /api/auth/[...nextauth] → runs authorize() in auth.ts
 *   - If authorize() returns a user → signIn() returns { ok: true }
 *   - If authorize() returns null → signIn() returns { error: "CredentialsSignin" }
 *   - If authorize() THROWS → signIn() ALSO returns { error: "..." }
 *     (this is why "Invalid email or password" appears even for DB errors)
 *
 * ROLE-BASED REDIRECTS:
 *   - REGIONAL_ADMIN → /regional
 *   - SCHOOL_ADMIN   → /admin
 *   - TEACHER        → /logbook
 *
 * DEBUGGING:
 *   If login fails, visit /api/auth/check to diagnose the issue.
 *   That endpoint tests the database and password independently
 *   without going through NextAuth.
 * ================================================================
 */

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
} from "lucide-react";

/**
 * Maps a user role to their dashboard URL.
 * Used after successful login to redirect the user.
 */
function getDashboardPath(role: string): string {
  switch (role) {
    case "REGIONAL_ADMIN":
      return "/regional";
    case "SCHOOL_ADMIN":
      return "/admin";
    case "TEACHER":
    default:
      return "/logbook";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show success banner if user just registered
  const registered = searchParams.get("registered");

  // ── Form state ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * HANDLE LOGIN SUBMISSION
   *
   * This function:
   *  1. Calls NextAuth signIn() with redirect: false (so we can handle errors)
   *  2. If signIn fails → shows an error message
   *  3. If signIn succeeds → fetches the session to get the user's role
   *  4. Redirects to the correct dashboard based on role
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ── Step 1: Call NextAuth signIn ──
      // redirect: false means NextAuth won't auto-redirect on error,
      // so we can display a friendly error message instead.
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(), // normalise email before sending
        password,
        redirect: false,
      });

      // ── Step 2: Handle the result ──
      if (result?.error) {
        // NextAuth returns { error: "CredentialsSignin" } when authorize() returns null.
        // It also returns { error: "..." } when authorize() throws (DB error, etc.).
        // Unfortunately NextAuth doesn't distinguish between "wrong password"
        // and "database error" — both look the same from here.
        //
        // To debug: visit /api/auth/check or check Vercel function logs for [AUTH] messages.
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          // A non-CredentialsSignin error usually means a server/config issue
          setError(`Login failed: ${result.error}. Please try again or contact support.`);
        }
      } else {
        // ── Step 3: Login succeeded — fetch session to get the role ──
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = (session?.user as Record<string, unknown>)?.role as string;

        // ── Step 4: Redirect to the correct dashboard ──
        const path = getDashboardPath(role || "TEACHER");
        router.push(path);
        router.refresh();
      }
    } catch {
      // Network error, NextAuth crash, or other unexpected failure
      setError("Something went wrong. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header with gradient background ── */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-14 pb-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/[0.06] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        </div>
        <div className="max-w-lg mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/[0.08]">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-base">Edlog</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-brand-300/80 text-sm mt-1.5">
            Sign in to continue to your dashboard
          </p>
        </div>
      </div>

      {/* ── Login form card ── */}
      <div className="px-5 -mt-5 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          {/* Show success banner after registration */}
          {registered && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Account created successfully! Please sign in.
            </div>
          )}

          {/* Show error messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@school.cm"
                required
                autoComplete="email"
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl py-3.5 text-sm transition-all active:scale-[0.98] shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Registration options ── */}
        <div className="mt-8 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">
            New to Edlog? Create an account
          </p>

          <div className="space-y-2.5">
            {/* Teacher registration link */}
            <Link
              href="/register"
              className="flex items-center gap-3.5 bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">Teacher Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Join your school with a school code</p>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* School admin registration link */}
            <Link
              href="/register/school"
              className="flex items-center gap-3.5 bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">School Admin Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register your school on Edlog</p>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Regional inspector — not self-service */}
            <div
              className="flex items-center gap-3.5 bg-white rounded-xl border border-slate-200 p-4 opacity-60"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">Regional Inspector</h3>
                <p className="text-xs text-slate-500 mt-0.5">Contact your regional office</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
