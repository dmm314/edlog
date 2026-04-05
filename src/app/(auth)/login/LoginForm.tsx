"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Leaf,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Shield,
  Globe,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  MapPin,
} from "lucide-react";

function getDashboardPath(role: string): string {
  switch (role) {
    case "REGIONAL_ADMIN": return "/regional";
    case "SCHOOL_ADMIN":   return "/admin";
    case "TEACHER":
    default:               return "/logbook";
  }
}

const REGIONAL_ACCOUNTS = [
  { region: "Adamawa",   email: "adamawa@edlog.cm",   capital: "Ngaoundere" },
  { region: "Centre",    email: "centre@edlog.cm",    capital: "Yaounde" },
  { region: "East",      email: "east@edlog.cm",      capital: "Bertoua" },
  { region: "Far North", email: "farnorth@edlog.cm",  capital: "Maroua" },
  { region: "Littoral",  email: "littoral@edlog.cm",  capital: "Douala" },
  { region: "North",     email: "north@edlog.cm",     capital: "Garoua" },
  { region: "Northwest", email: "northwest@edlog.cm", capital: "Bamenda" },
  { region: "South",     email: "south@edlog.cm",     capital: "Ebolowa" },
  { region: "Southwest", email: "southwest@edlog.cm", capital: "Buea" },
  { region: "West",      email: "west@edlog.cm",      capital: "Bafoussam" },
] as const;

const DEMO_PASSWORD = "Edlog2026!";

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const registered   = searchParams.get("registered");

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [demoLoading, setDemoLoading]   = useState<string | null>(null);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
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
        const role       = session?.user?.role as string;
        router.push(getDashboardPath(role || "TEACHER"));
        router.refresh();
      }
    } catch {
      setError("Could not connect. Check your internet and try again.");
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleLogin(email, password);
  }

  async function handleDemoLogin(demoEmail: string) {
    setDemoLoading(demoEmail);
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    await handleLogin(demoEmail, DEMO_PASSWORD);
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10"
      style={{ background: "hsl(var(--surface-canvas))" }}
    >
      {/* Subtle warm glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, hsl(var(--accent) / 0.04) 0%, transparent 70%)",
        }}
      />

      {/* ── MAIN CARD ── */}
      <div
        className="relative z-10 w-full max-w-[400px] animate-fade-in rounded-2xl p-7"
        style={{
          background: "hsl(var(--surface-elevated))",
          border: "1px solid hsl(var(--border-primary))",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Logo + wordmark */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "hsl(var(--accent))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
              Edlog
            </p>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Success banner */}
        {registered && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "hsl(var(--success) / 0.08)",
              color: "hsl(var(--success))",
              border: "1px solid hsl(var(--success) / 0.15)",
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
              background: "hsl(var(--danger) / 0.06)",
              color: "hsl(var(--danger))",
              border: "1px solid hsl(var(--danger) / 0.12)",
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
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

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
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
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-all duration-[80ms] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "hsl(var(--accent))",
              minHeight: "48px",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            {loading && !demoLoading ? (
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
          <Link href="/register" className="font-bold" style={{ color: "hsl(var(--accent))" }}>
            Get Started
          </Link>
        </p>
      </div>

      {/* ── DEMO ACCOUNTS (Regional Inspectors) ── */}
      <div className="relative z-10 mt-4 w-full max-w-[400px]">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="group flex w-full items-center gap-3.5 rounded-2xl p-4 transition-all duration-[80ms] active:scale-[0.98]"
          style={{
            background: "hsl(var(--surface-elevated))",
            border: "1px solid hsl(var(--border-primary))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "hsl(var(--info) / 0.08)" }}>
            <Globe className="h-5 w-5" style={{ color: "hsl(var(--info))" }} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>Demo Regional Accounts</h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>Quick login as any of Cameroon&apos;s 10 regional inspectors</p>
          </div>
          <ChevronDown
            className="h-[18px] w-[18px] transition-transform duration-200"
            style={{
              color: "hsl(var(--text-tertiary))",
              transform: showDemoAccounts ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {showDemoAccounts && (
          <div
            className="mt-2 overflow-hidden rounded-2xl"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border-primary))",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="px-4 pt-3 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-tertiary))" }}>
                Select a region to sign in
              </p>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {REGIONAL_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={!!demoLoading}
                  onClick={() => handleDemoLogin(account.email)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:bg-black/[0.06] dark:active:bg-white/[0.06] disabled:opacity-50"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                      {account.region}
                    </span>
                    <span className="ml-1.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                      {account.capital}
                    </span>
                  </div>
                  {demoLoading === account.email ? (
                    <svg className="h-4 w-4 animate-spin" style={{ color: "hsl(var(--accent))" }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: "hsl(var(--text-tertiary))" }} />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t px-4 py-2.5" style={{ borderColor: "hsl(var(--border-muted))" }}>
              <p className="text-[11px]" style={{ color: "hsl(var(--text-tertiary))" }}>
                Password for all: <code className="font-mono font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>Edlog2026!</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── REGISTER OPTIONS ── */}
      <div className="relative z-10 mt-2 w-full max-w-[400px] space-y-2">
        <Link
          href="/register"
          className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-[80ms] active:scale-[0.98]"
          style={{
            background: "hsl(var(--surface-elevated))",
            border: "1px solid hsl(var(--border-primary))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "hsl(var(--accent-soft))" }}>
            <GraduationCap className="h-5 w-5" style={{ color: "hsl(var(--accent))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>Teacher Account</h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>Join your school with a school code</p>
          </div>
          <ChevronRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" style={{ color: "hsl(var(--text-tertiary))" }} />
        </Link>

        <Link
          href="/register/school"
          className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-[80ms] active:scale-[0.98]"
          style={{
            background: "hsl(var(--surface-elevated))",
            border: "1px solid hsl(var(--border-primary))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "hsl(var(--gold-soft))" }}>
            <Shield className="h-5 w-5" style={{ color: "hsl(var(--gold-text))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>School Admin Account</h3>
            <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>Register your school on Edlog</p>
          </div>
          <ChevronRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" style={{ color: "hsl(var(--text-tertiary))" }} />
        </Link>
      </div>
    </div>
  );
}
