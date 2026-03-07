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

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="page-header px-5 pt-14 pb-12">
        <div className="max-w-lg mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
            >
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-display font-bold text-base">Edlog</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
              <GraduationCap className="w-5 h-5" style={{ color: "var(--accent-warm)" }} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
                Teacher Registration
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--header-text-muted)" }}>
                Create your teacher account
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
            </div>
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
            </div>
            <span className="text-white/50 text-xs font-medium ml-2">{step}/2</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 -mt-5 max-w-lg mx-auto">
        <div className="card p-6">
          {serverError && (
            <div className="text-sm rounded-xl px-4 py-3 mb-5" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
              {serverError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Personal Information</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Enter your details and school code</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">First Name</label>
                  <input type="text" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)}
                    className={`input-field ${errors.firstName ? "input-error" : ""}`} placeholder="Darren" />
                  {errors.firstName && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.firstName}</p>}
                </div>
                <div>
                  <label className="label-field">Last Name</label>
                  <input type="text" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)}
                    className={`input-field ${errors.lastName ? "input-error" : ""}`} placeholder="Monyongo" />
                  {errors.lastName && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="label-field">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                  className={`input-field ${errors.email ? "input-error" : ""}`} placeholder="you@example.com" autoComplete="email" />
                {errors.email && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.email}</p>}
              </div>

              <div>
                <label className="label-field">Phone <span className="text-[var(--text-quaternary)] font-normal normal-case">(Optional)</span></label>
                <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                  className="input-field" placeholder="+237 6XX XXX XXX" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="input-field" max={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="label-field">Gender</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className="input-field">
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-field">School Code</label>
                <input type="text" value={form.schoolCode} onChange={(e) => updateField("schoolCode", e.target.value.toUpperCase())}
                  className={`input-field font-mono tracking-wider ${errors.schoolCode ? "input-error" : ""}`} placeholder="e.g. LBY-001" />
                {errors.schoolCode && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.schoolCode}</p>}
                <p className="text-xs text-[var(--text-quaternary)] mt-1">Ask your school administrator for this code</p>
              </div>

              <button type="button" onClick={handleNext} className="btn-primary">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Set Your Password</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Choose a secure password for your account</p>
              </div>

              <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--success-light)" }}>
                  <CheckCircle className="w-4.5 h-4.5" style={{ color: "var(--success)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{form.firstName} {form.lastName}</p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{form.email} &middot; {form.schoolCode}</p>
                </div>
              </div>

              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)}
                    className={`input-field pr-12 ${errors.password ? "input-error" : ""}`} placeholder="Min. 6 characters" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.password}</p>}
              </div>

              <div>
                <label className="label-field">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className={`input-field ${errors.confirmPassword ? "input-error" : ""}`} placeholder="Repeat your password" autoComplete="new-password" />
                {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{errors.confirmPassword}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setStep(1); setErrors({}); setServerError(""); }} className="btn-secondary flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
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

        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent-text)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
