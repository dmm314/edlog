"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertCircle,
} from "lucide-react";

interface Division {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  divisions: Division[];
}

export default function SchoolRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    schoolName: "",
    registrationCode: "",
    regionId: "",
    divisionId: "",
    address: "",
    phone: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminConfirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const res = await fetch("/api/regions");
        if (res.ok) {
          const data = await res.json();
          setRegions(data);
        }
      } catch {
        console.error("Failed to load regions");
      } finally {
        setRegionsLoading(false);
      }
    }
    fetchRegions();
  }, []);

  const selectedRegion = regions.find((r) => r.id === form.regionId);
  const divisions = selectedRegion?.divisions || [];

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

  function handleRegionChange(regionId: string) {
    setForm((prev) => ({ ...prev, regionId, divisionId: "" }));
    if (errors.regionId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.regionId;
        return next;
      });
    }
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!form.registrationCode.trim()) errs.registrationCode = "Registration code is required";
    if (form.schoolName.length < 3) errs.schoolName = "School name must be at least 3 characters";
    if (!form.regionId) errs.regionId = "Please select a region";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (form.adminFirstName.length < 2) errs.adminFirstName = "First name must be at least 2 characters";
    if (form.adminLastName.length < 2) errs.adminLastName = "Last name must be at least 2 characters";
    if (!form.adminEmail.includes("@")) errs.adminEmail = "Please enter a valid email address";
    if (form.adminPassword.length < 6) errs.adminPassword = "Password must be at least 6 characters";
    if (form.adminPassword !== form.adminConfirmPassword) errs.adminConfirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep1()) { setStep(2); setServerError(""); }
  }

  function handleBack() {
    setStep(1); setErrors({}); setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || "Registration failed"); return; }
      setRegisteredCode(data.school?.code || null);
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
      className="min-h-screen pb-8 relative"
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

      {/* Header */}
      <div className="relative z-10 px-5 pt-14 pb-12">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-base">Edlog</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--success) / 0.15)" }}>
              <Shield className="w-5 h-5" style={{ color: "hsl(var(--success))" }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Register Your School
              </h1>
              <p className="text-sm mt-0.5 text-white/70" style={{ fontFamily: "var(--font-body)" }}>
                Set up your school on Edlog
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
            <span className="text-white/70 text-xs font-medium ml-2">{step}/2</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 px-5 -mt-5 max-w-lg mx-auto">
        <div
          className="p-6"
          style={{
            background: "hsl(var(--surface-elevated))",
            border: "1px solid var(--border-primary)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Success: Show generated school code */}
          {registeredCode && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(var(--success) / 0.10)" }}>
                <svg className="w-8 h-8" style={{ color: "hsl(var(--success))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>School Registered Successfully!</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Your unique school code has been generated. Share this code with your teachers so they can register.
              </p>
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--surface-secondary))", border: "2px dashed var(--border-primary)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Your School Code</p>
                <p className="text-2xl font-bold tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{registeredCode}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(registeredCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                className="btn-secondary text-sm"
              >
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
              <div className="text-xs rounded-lg p-3" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                Save this code! Your account is pending regional admin approval. You can sign in once approved.
              </div>
              <button onClick={() => router.push("/login?registered=true")} className="btn-primary">
                Go to Sign In
              </button>
            </div>
          )}

          {!registeredCode && serverError && (
            <div
              className="text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
              style={{ background: "hsl(var(--danger) / 0.08)", color: "hsl(var(--danger))" }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          {/* Step 1: School Info */}
          {!registeredCode && step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>School Information</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Enter your school details to get started</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Registration Code</label>
                <input
                  type="text"
                  value={form.registrationCode}
                  onChange={(e) => updateField("registrationCode", e.target.value.toUpperCase())}
                  className={`input-field tracking-wider ${errors.registrationCode ? "input-error" : ""}`}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "17px", letterSpacing: "0.08em" }}
                  placeholder="REG-XXXXXX"
                />
                <FieldError msg={errors.registrationCode} />
                <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>Get this code from your Regional Education Admin</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>School Name</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => updateField("schoolName", e.target.value)}
                  className={`input-field ${errors.schoolName ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="e.g. Government Bilingual High School"
                />
                <FieldError msg={errors.schoolName} />
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Region</label>
                <select
                  value={form.regionId}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className={`input-field ${errors.regionId ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  disabled={regionsLoading}
                >
                  <option value="">{regionsLoading ? "Loading regions..." : "Select a region"}</option>
                  {regions.map((region) => (<option key={region.id} value={region.id}>{region.name}</option>))}
                </select>
                <FieldError msg={errors.regionId} />
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  Division <span style={{ color: "var(--text-quaternary)", fontWeight: 400 }}>(Optional)</span>
                </label>
                <select
                  value={form.divisionId}
                  onChange={(e) => updateField("divisionId", e.target.value)}
                  className="input-field"
                  style={{ fontSize: "16px" }}
                  disabled={!form.regionId || divisions.length === 0}
                >
                  <option value="">{!form.regionId ? "Select a region first" : divisions.length === 0 ? "No divisions available" : "Select a division"}</option>
                  {divisions.map((div) => (<option key={div.id} value={div.id}>{div.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  Address <span style={{ color: "var(--text-quaternary)", fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="input-field"
                  style={{ fontSize: "16px" }}
                  placeholder="e.g. Quartier Melen"
                />
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
                  placeholder="+237 2XX XXX XXX"
                />
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
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {!registeredCode && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Admin Account</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Create the administrator account for your school</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>First Name</label>
                  <input
                    type="text"
                    value={form.adminFirstName}
                    onChange={(e) => updateField("adminFirstName", e.target.value)}
                    className={`input-field ${errors.adminFirstName ? "input-error" : ""}`}
                    style={{ fontSize: "16px" }}
                    placeholder="Darren"
                  />
                  <FieldError msg={errors.adminFirstName} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Last Name</label>
                  <input
                    type="text"
                    value={form.adminLastName}
                    onChange={(e) => updateField("adminLastName", e.target.value)}
                    className={`input-field ${errors.adminLastName ? "input-error" : ""}`}
                    style={{ fontSize: "16px" }}
                    placeholder="Monyongo"
                  />
                  <FieldError msg={errors.adminLastName} />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Email</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                  className={`input-field ${errors.adminEmail ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="admin@school.cm"
                  autoComplete="email"
                />
                <FieldError msg={errors.adminEmail} />
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.adminPassword}
                    onChange={(e) => updateField("adminPassword", e.target.value)}
                    className={`input-field pr-12 ${errors.adminPassword ? "input-error" : ""}`}
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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <FieldError msg={errors.adminPassword} />
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Confirm Password</label>
                <input
                  type="password"
                  value={form.adminConfirmPassword}
                  onChange={(e) => updateField("adminConfirmPassword", e.target.value)}
                  className={`input-field ${errors.adminConfirmPassword ? "input-error" : ""}`}
                  style={{ fontSize: "16px" }}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                <FieldError msg={errors.adminConfirmPassword} />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-[14px] active:scale-[0.97] transition-all duration-[80ms] flex-1"
                  style={{ background: "hsl(var(--surface-tertiary))", color: "var(--text-secondary)" }}
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 py-4 font-bold text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-[80ms]"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    fontSize: "16px",
                    boxShadow: "0 4px 16px -4px hsl(var(--accent) / 0.3)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Registering...
                    </>
                  ) : "Register School"}
                </button>
              </div>
            </form>
          )}

          {!registeredCode && (
            <>
              <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold" style={{ color: "var(--accent-text)" }}>Sign in</Link>
              </p>
              <p className="text-center text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
                Registering as a teacher?{" "}
                <Link href="/register" className="font-semibold" style={{ color: "var(--accent-text)" }}>Teacher registration</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
