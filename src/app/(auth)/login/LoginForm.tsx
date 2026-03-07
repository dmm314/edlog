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
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(`Login failed: ${result.error}. Please try again or contact support.`);
        }
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = (session?.user as Record<string, unknown>)?.role as string;
        const path = getDashboardPath(role || "TEACHER");
        router.push(path);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header with gradient background */}
      <div className="page-header px-5 pt-14 pb-12">
        <div className="max-w-lg mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-display font-bold text-base">Edlog</span>
          </Link>

          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--header-text-muted)" }}>
            Sign in to continue to your dashboard
          </p>
        </div>
      </div>

      {/* Login form card */}
      <div className="px-5 -mt-5 max-w-lg mx-auto">
        <div className="card p-6">
          {/* Success banner after registration */}
          {registered && (
            <div className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
              style={{ background: "var(--success-light)", color: "var(--success)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--success-light)" }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Account created successfully! Please sign in.
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="text-sm rounded-xl px-4 py-3 mb-5"
              style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Email Address</label>
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

            <div>
              <label className="label-field">Password</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary"
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

        {/* Registration options */}
        <div className="mt-8 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-3 px-1">
            New to Edlog? Create an account
          </p>

          <div className="space-y-2.5">
            <Link
              href="/register"
              className="flex items-center gap-3.5 card p-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-light)" }}>
                <GraduationCap className="w-5 h-5 text-[var(--accent-text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Teacher Account</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Join your school with a school code</p>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/register/school"
              className="flex items-center gap-3.5 card p-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--success-light)" }}>
                <Shield className="w-5 h-5" style={{ color: "var(--success)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">School Admin Account</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Register your school on Edlog</p>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-[var(--text-quaternary)] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <div className="flex items-center gap-3.5 card p-4 opacity-60">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139, 92, 246, 0.08)" }}>
                <Globe className="w-5 h-5" style={{ color: "#8B5CF6" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Regional Inspector</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Contact your regional office</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
