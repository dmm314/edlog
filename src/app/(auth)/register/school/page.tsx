"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";

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

  // Fetch regions on mount
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

  // Get divisions for selected region
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
    if (!form.registrationCode.trim())
      errs.registrationCode = "Registration code is required";
    if (form.schoolName.length < 3)
      errs.schoolName = "School name must be at least 3 characters";
    if (!form.regionId) errs.regionId = "Please select a region";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (form.adminFirstName.length < 2)
      errs.adminFirstName = "First name must be at least 2 characters";
    if (form.adminLastName.length < 2)
      errs.adminLastName = "Last name must be at least 2 characters";
    if (!form.adminEmail.includes("@"))
      errs.adminEmail = "Please enter a valid email address";
    if (form.adminPassword.length < 6)
      errs.adminPassword = "Password must be at least 6 characters";
    if (form.adminPassword !== form.adminConfirmPassword)
      errs.adminConfirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep1()) {
      setStep(2);
      setServerError("");
    }
  }

  function handleBack() {
    setStep(1);
    setErrors({});
    setServerError("");
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

      if (!res.ok) {
        setServerError(data.error || "Registration failed");
        return;
      }

      // Show the auto-generated school code before redirecting
      setRegisteredCode(data.school?.code || null);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your School</h1>
          <p className="text-brand-400 mt-1 text-sm">
            Set up your school on Edlog
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  step >= 1 ? "bg-white" : "bg-white/30"
                }`}
              />
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  step >= 2 ? "bg-white" : "bg-white/30"
                }`}
              />
            </div>
            <span className="text-white/70 text-xs font-medium">
              Step {step} of 2
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 -mt-4 max-w-lg mx-auto">
        <div className="card p-6">
          {/* Success: Show generated school code */}
          {registeredCode && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <ChevronRight className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                School Registered Successfully!
              </h2>
              <p className="text-sm text-slate-500">
                Your unique school code has been generated. Share this code with
                your teachers so they can register and join your school.
              </p>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Your School Code</p>
                <p className="text-2xl font-mono font-bold text-brand-950 tracking-wider">
                  {registeredCode}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(registeredCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="btn-secondary text-sm"
              >
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                Save this code! Your account is pending regional admin approval.
                You can sign in once approved.
              </p>
              <button
                onClick={() => router.push("/login?registered=true")}
                className="btn-primary"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {!registeredCode && serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {serverError}
            </div>
          )}

          {/* Step 1: School Information */}
          {!registeredCode && step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  School Information
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Enter your school details to get started
                </p>
              </div>

              <div>
                <label className="label-field">Registration Code</label>
                <input
                  type="text"
                  value={form.registrationCode}
                  onChange={(e) =>
                    updateField("registrationCode", e.target.value.toUpperCase())
                  }
                  className={`input-field font-mono tracking-wider ${errors.registrationCode ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="REG-XXXXXX"
                />
                {errors.registrationCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.registrationCode}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Get this code from your Regional Education Admin
                </p>
              </div>

              <div>
                <label className="label-field">School Name</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => updateField("schoolName", e.target.value)}
                  className={`input-field ${errors.schoolName ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="e.g. Government Bilingual High School Yaound\u00e9"
                />
                {errors.schoolName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.schoolName}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Region</label>
                <select
                  value={form.regionId}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className={`input-field ${errors.regionId ? "border-red-300 focus:ring-red-500" : ""}`}
                  disabled={regionsLoading}
                >
                  <option value="">
                    {regionsLoading ? "Loading regions..." : "Select a region"}
                  </option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {errors.regionId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regionId}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Division (Optional)</label>
                <select
                  value={form.divisionId}
                  onChange={(e) => updateField("divisionId", e.target.value)}
                  className="input-field"
                  disabled={!form.regionId || divisions.length === 0}
                >
                  <option value="">
                    {!form.regionId
                      ? "Select a region first"
                      : divisions.length === 0
                        ? "No divisions available"
                        : "Select a division"}
                  </option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">Address (Optional)</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Quartier Melen, Yaound\u00e9"
                />
              </div>

              <div>
                <label className="label-field">Phone (Optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="input-field"
                  placeholder="+237 2XX XXX XXX"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {!registeredCode && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Admin Account
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Create the administrator account for your school
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">First Name</label>
                  <input
                    type="text"
                    value={form.adminFirstName}
                    onChange={(e) =>
                      updateField("adminFirstName", e.target.value)
                    }
                    className={`input-field ${errors.adminFirstName ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Darren"
                  />
                  {errors.adminFirstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.adminFirstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label-field">Last Name</label>
                  <input
                    type="text"
                    value={form.adminLastName}
                    onChange={(e) =>
                      updateField("adminLastName", e.target.value)
                    }
                    className={`input-field ${errors.adminLastName ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Monyongo"
                  />
                  {errors.adminLastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.adminLastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label-field">Email</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                  className={`input-field ${errors.adminEmail ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="admin@school.cm"
                  autoComplete="email"
                />
                {errors.adminEmail && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.adminEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.adminPassword}
                    onChange={(e) =>
                      updateField("adminPassword", e.target.value)
                    }
                    className={`input-field pr-12 ${errors.adminPassword ? "border-red-300 focus:ring-red-500" : ""}`}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.adminPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.adminPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Confirm Password</label>
                <input
                  type="password"
                  value={form.adminConfirmPassword}
                  onChange={(e) =>
                    updateField("adminConfirmPassword", e.target.value)
                  }
                  className={`input-field ${errors.adminConfirmPassword ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                {errors.adminConfirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.adminConfirmPassword}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex items-center justify-center gap-2 flex-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 flex-[2]"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Registering...
                    </>
                  ) : (
                    "Register School"
                  )}
                </button>
              </div>
            </form>
          )}

          {!registeredCode && (
            <>
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-brand-700 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>

              <p className="text-center text-sm text-slate-500 mt-2">
                Registering as a teacher?{" "}
                <Link
                  href="/register"
                  className="text-brand-700 font-semibold hover:underline"
                >
                  Teacher registration
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
