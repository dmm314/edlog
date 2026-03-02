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
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 pt-14 pb-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.06] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        </div>
        <div className="max-w-lg mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/[0.08]">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-base">Edlog</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Teacher Registration
              </h1>
              <p className="text-brand-300/80 text-sm mt-0.5">
                Create your teacher account
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full bg-white transition-all duration-300 ${step >= 1 ? "w-full" : "w-0"}`} />
            </div>
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full bg-white transition-all duration-300 ${step >= 2 ? "w-full" : "w-0"}`} />
            </div>
            <span className="text-white/50 text-xs font-medium ml-2">
              {step}/2
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 -mt-5 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {serverError}
            </div>
          )}

          {/* Step 1: Personal Info & School Code */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your details and school code</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className={`input-field ${errors.firstName ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Darren"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className={`input-field ${errors.lastName ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Monyongo"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`input-field ${errors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Phone <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="input-field"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="input-field"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">School Code</label>
                <input
                  type="text"
                  value={form.schoolCode}
                  onChange={(e) => updateField("schoolCode", e.target.value.toUpperCase())}
                  className={`input-field font-mono tracking-wider ${errors.schoolCode ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="e.g. LBY-001"
                />
                {errors.schoolCode && <p className="text-red-500 text-xs mt-1">{errors.schoolCode}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  Ask your school administrator for this code
                </p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl py-3.5 text-sm transition-all active:scale-[0.98] shadow-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Set Your Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose a secure password for your account</p>
              </div>

              {/* Show summary */}
              <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3 border border-slate-100">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {form.firstName} {form.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{form.email} &middot; {form.schoolCode}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={`input-field pr-12 ${errors.password ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className={`input-field ${errors.confirmPassword ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrors({}); setServerError(""); }}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-3.5 px-5 text-sm transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl py-3.5 text-sm transition-all active:scale-[0.98] shadow-sm"
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
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
