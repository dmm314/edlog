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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: "linear-gradient(135deg, #1B1512 0%, #2D2420 50%, #3D322C 100%)",
      }}
    >
      {/* Centered form card */}
      <div
        className="w-full max-w-sm"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              borderRadius: "14px",
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span
            className="font-bold text-stone-900"
            style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700 }}
          >
            Edlog
          </span>
        </div>

        <h1
          className="text-xl font-bold text-stone-900 tracking-tight mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-stone-500 mb-5" style={{ fontFamily: "var(--font-body)" }}>
          Sign in to continue to your dashboard
        </p>

        {/* Success banner after registration */}
        {registered && (
          <div className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2 bg-emerald-50 text-emerald-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Account created successfully! Please sign in.
          </div>
        )}

        {/* Error messages */}
        {error && (
          <div className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2 bg-red-50 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none"
              style={{
                fontSize: "16px",
                fontFamily: "var(--font-body)",
                border: "1px solid var(--border-primary)",
                borderRadius: "14px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="you@school.cm"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none"
                style={{
                  fontSize: "16px",
                  fontFamily: "var(--font-body)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "14px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-3.5 font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-[80ms]"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              fontSize: "16px",
            }}
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
      <div className="w-full max-w-sm mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-3 px-1" style={{ fontFamily: "var(--font-body)" }}>
          New to Edlog? Create an account
        </p>

        <div className="space-y-2.5">
          <Link
            href="/register"
            className="flex items-center gap-3.5 p-4 transition-all group active:scale-[0.98] duration-[80ms]"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-body)" }}>Teacher Account</h3>
              <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Join your school with a school code</p>
            </div>
            <ChevronRight className="w-4.5 h-4.5 text-white/30 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/register/school"
            className="flex items-center gap-3.5 p-4 transition-all group active:scale-[0.98] duration-[80ms]"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)" }}>
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-body)" }}>School Admin Account</h3>
              <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Register your school on Edlog</p>
            </div>
            <ChevronRight className="w-4.5 h-4.5 text-white/30 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <div
            className="flex items-center gap-3.5 p-4 opacity-60"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-body)" }}>Regional Inspector</h3>
              <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Contact your regional office</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
