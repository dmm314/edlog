"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    schoolCode: "",
    dateOfBirth: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (form.firstName.length < 2) errs.firstName = "First name is required";
    if (form.lastName.length < 2) errs.lastName = "Last name is required";
    if (!form.email.includes("@")) errs.email = "Valid email is required";
    if (!form.schoolCode) errs.schoolCode = "School code is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep1()) {
      setStep(2);
      setServerError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "hsl(var(--danger))" }}>
        <AlertCircle className="w-3 h-3" />{msg}
      </p>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative"
      style={{
        background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent)) 50%, hsl(var(--accent-strong)) 100%)",
      }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Form card */}
      <div
        className="w-full max-w-[400px] relative z-10 animate-scale-in"
        style={{
          background: "hsl(var(--surface-elevated))",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
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
            className="font-bold"
            style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}
          >
            Edlog
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--accent) / 0.10)" }}>
            <GraduationCap className="w-4.5 h-4.5" style={{ color: "hsl(var(--accent))" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Teacher Registration
            </h1>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              Step {step} of 2
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-tertiary))" }}>
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
          </div>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-tertiary))" }}>
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
          </div>
        </div>

        {serverError && (
          <div
            className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
            style={{ background: "hsl(var(--danger) / 0.08)", color: "hsl(var(--danger))" }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {serverError}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* School Code — prominent */}
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                School Code
              </label>
              <input
                type="text"
                value={form.schoolCode}
                onChange={(e) => updateField("schoolCode", e.target.value.toUpperCase())}
                className={`input-field tracking-wider text-base ${errors.schoolCode ? "input-error" : ""}`}
                style={{ fontFamily: "var(--font-mono)", fontSize: "17px", letterSpacing: "0.08em" }}
                placeholder="e.g. EDL-XXXXX"
              />
              <FieldError msg={errors.schoolCode} />
              <p className="text-xs mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-quaternary)" }}>Ask your school administrator for this code</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={`input-field ${errors.firstName ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="Darren"
                />
                <FieldError msg={errors.firstName} />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={`input-field ${errors.lastName ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="Monyongo"
                />
                <FieldError msg={errors.lastName} />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={`input-field ${errors.email ? "input-error" : ""}`}
                style={{ fontSize: "16px" }}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                Phone <span style={{ color: "var(--text-quaternary)", fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="input-field"
                style={{ fontSize: "16px" }}
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className="input-field"
                  style={{ fontSize: "16px" }}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="input-field"
                  style={{ fontSize: "16px" }}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 font-bold text-white rounded-[14px] active:scale-[0.97] transition-all duration-[80ms]"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                fontSize: "16px",
                boxShadow: "0 4px 16px -4px hsl(var(--accent) / 0.3)",
              }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="rounded-xl p-3.5 flex items-center gap-3"
              style={{ background: "hsl(var(--surface-secondary))", border: "1px solid var(--border-primary)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--success) / 0.10)" }}
              >
                <CheckCircle className="w-4.5 h-4.5" style={{ color: "hsl(var(--success))" }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{form.firstName} {form.lastName}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                  {form.email} &middot; <span style={{ fontFamily: "var(--font-mono)" }}>{form.schoolCode}</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={`input-field pr-12 ${errors.password ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className={`input-field ${errors.confirmPassword ? "input-error" : ""}`}
                style={{ fontSize: "16px" }}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
              <FieldError msg={errors.confirmPassword} />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setErrors({}); setServerError(""); }}
                className="flex items-center justify-center gap-1.5 py-3 px-4 font-semibold rounded-[14px] active:scale-[0.97] transition-all duration-[80ms]"
                style={{
                  background: "hsl(var(--surface-tertiary))",
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-4 font-bold text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-[80ms]"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  fontSize: "16px",
                  boxShadow: "0 4px 16px -4px hsl(var(--accent) / 0.3)",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-white/70 mt-6 relative z-10" style={{ fontFamily: "var(--font-body)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "hsl(var(--accent-glow))" }}>Sign in</Link>
      </p>
    </div>
  );
}
