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

  const inputStyle = {
    fontSize: "16px" as const,
    fontFamily: "var(--font-body)",
    border: "1px solid var(--border-primary)",
    borderRadius: "14px",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--accent)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.25)";
  };

  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border-primary)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: "linear-gradient(135deg, #1B1512 0%, #2D2420 50%, #3D322C 100%)",
      }}
    >
      {/* Form card */}
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
        <div className="flex items-center gap-2.5 mb-5">
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

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.08)" }}>
            <GraduationCap className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Teacher Registration
            </h1>
            <p className="text-xs text-stone-500" style={{ fontFamily: "var(--font-body)" }}>
              Step {step} of 2
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
          </div>
          <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? "w-full" : "w-0"}`} style={{ backgroundColor: "var(--accent)" }} />
          </div>
        </div>

        {serverError && (
          <div className="text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2 bg-red-50 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {serverError}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)}
                  className={`w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none ${errors.firstName ? "!border-red-500" : ""}`}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Darren" />
                {errors.firstName && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)}
                  className={`w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none ${errors.lastName ? "!border-red-500" : ""}`}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Monyongo" />
                {errors.lastName && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                className={`w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none ${errors.email ? "!border-red-500" : ""}`}
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>
                Phone <span className="text-stone-400 font-normal normal-case">(Optional)</span>
              </label>
              <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                className="w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="+237 6XX XXX XXX" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className="w-full px-4 py-3 bg-white text-stone-900 transition-all outline-none"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} max={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Gender</label>
                <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full px-4 py-3 bg-white text-stone-900 transition-all outline-none"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>School Code</label>
              <input type="text" value={form.schoolCode} onChange={(e) => updateField("schoolCode", e.target.value.toUpperCase())}
                className={`w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 tracking-wider transition-all outline-none ${errors.schoolCode ? "!border-red-500" : ""}`}
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} onFocus={inputFocus} onBlur={inputBlur} placeholder="e.g. EDL-XXXXX" />
              {errors.schoolCode && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.schoolCode}</p>}
              <p className="text-xs text-stone-400 mt-1" style={{ fontFamily: "var(--font-body)" }}>Ask your school administrator for this code</p>
            </div>

            <button type="button" onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-bold text-white rounded-xl active:scale-[0.97] transition-all duration-[80ms]"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", fontSize: "16px" }}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl p-3.5 flex items-center gap-3 bg-stone-50 border border-stone-200">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{form.firstName} {form.lastName}</p>
                <p className="text-xs text-stone-500 truncate" style={{ fontFamily: "var(--font-body)" }}>{form.email} &middot; <span style={{ fontFamily: "var(--font-mono)" }}>{form.schoolCode}</span></p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)}
                  className={`w-full px-4 py-3 pr-12 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none ${errors.password ? "!border-red-500" : ""}`}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Min. 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-stone-500" style={{ fontFamily: "var(--font-body)" }}>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)}
                className={`w-full px-4 py-3 bg-white text-stone-900 placeholder-stone-400 transition-all outline-none ${errors.confirmPassword ? "!border-red-500" : ""}`}
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Repeat your password" autoComplete="new-password" />
              {errors.confirmPassword && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setStep(1); setErrors({}); setServerError(""); }}
                className="flex items-center justify-center gap-1.5 py-3 px-4 font-semibold text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 active:scale-[0.97] transition-all duration-[80ms]">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-[80ms]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", fontSize: "16px" }}>
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

      <p className="text-center text-sm text-white/50 mt-6" style={{ fontFamily: "var(--font-body)" }}>
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
