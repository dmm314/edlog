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
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = (session?.user as Record<string, unknown>)?.role as string;
        const path = getDashboardPath(role || "TEACHER");
        router.push(path);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Compact header */}
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

      {/* Login form */}
      <div className="px-5 -mt-5 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Registration options — like Common App */}
        <div className="mt-8 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">
            New to Edlog? Create an account
          </p>

          <div className="space-y-2.5">
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
