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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--surface-canvas))] px-5 py-10">
      {/* Centered form card */}
      <div className="relative z-10 w-full max-w-[400px] animate-fade-in rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-6 shadow-elevated">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-[hsl(var(--text-primary))]">
            Edlog
          </span>
        </div>

        <p className="mb-5 text-center text-sm text-[hsl(var(--text-tertiary))]">
          Welcome back
        </p>

        {/* Success banner after registration */}
        {registered && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[hsl(var(--success)/0.08)] px-4 py-3 text-sm text-[hsl(var(--success))]">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Account created successfully! Please sign in.
          </div>
        )}

        {/* Error messages */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[hsl(var(--danger)/0.08)] px-4 py-3 text-sm text-[hsl(var(--danger))]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[hsl(var(--text-secondary))]">
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

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[hsl(var(--text-secondary))]">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))] transition-colors hover:text-[hsl(var(--text-secondary))]"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] py-3.5 text-base font-semibold text-white shadow-[0_2px_8px_-2px_rgba(8,102,255,0.3)] transition-all duration-[80ms] hover:bg-[hsl(var(--accent-strong))] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
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

        <p className="mt-5 text-center text-sm text-[hsl(var(--text-tertiary))]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[hsl(var(--accent))]">Get Started</Link>
        </p>
      </div>

      {/* Registration options */}
      <div className="relative z-10 mt-6 w-full max-w-[400px]">
        <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
          New to Edlog? Create an account
        </p>

        <div className="space-y-2">
          <Link
            href="/register"
            className="group flex items-center gap-3.5 rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-4 transition-all duration-[80ms] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent-soft))]">
              <GraduationCap className="h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[hsl(var(--text-primary))]">Teacher Account</h3>
              <p className="mt-0.5 text-xs text-[hsl(var(--text-tertiary))]">Join your school with a school code</p>
            </div>
            <ChevronRight className="h-[18px] w-[18px] text-[hsl(var(--text-tertiary))] transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/register/school"
            className="group flex items-center gap-3.5 rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] p-4 transition-all duration-[80ms] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--success)/0.1)]">
              <Shield className="h-5 w-5 text-[hsl(var(--success))]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[hsl(var(--text-primary))]">School Admin Account</h3>
              <p className="mt-0.5 text-xs text-[hsl(var(--text-tertiary))]">Register your school on Edlog</p>
            </div>
            <ChevronRight className="h-[18px] w-[18px] text-[hsl(var(--text-tertiary))] transition-transform group-hover:translate-x-0.5" />
          </Link>

          <div className="flex items-center gap-3.5 rounded-xl border border-[hsl(var(--border-muted))] bg-[hsl(var(--surface-elevated))] p-4 opacity-50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--info)/0.1)]">
              <Globe className="h-5 w-5 text-[hsl(var(--info))]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[hsl(var(--text-primary))]">Regional Inspector</h3>
              <p className="mt-0.5 text-xs text-[hsl(var(--text-tertiary))]">Contact your regional office</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
