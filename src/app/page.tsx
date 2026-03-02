import Link from "next/link";
import {
  BookOpen,
  Clock,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle,
  BarChart3,
  GraduationCap,
  Globe,
  Zap,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ── HERO ── */}
      <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/[0.07] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-400/[0.05] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent" />
        </div>

        <div className="relative px-5 pt-14 pb-20 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/[0.08]">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Edlog</span>
          </div>

          {/* Hero content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-full pl-2 pr-3.5 py-1.5 border border-white/[0.06]">
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
              <span className="text-white/80 text-xs font-medium">Subject divisions & smart timetabling</span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-white tracking-tight">
              The logbook<br />
              <span className="bg-gradient-to-r from-brand-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                teachers actually use.
              </span>
            </h1>

            <p className="text-brand-300/90 text-base leading-relaxed max-w-sm">
              Fill your curriculum logbook in under 60 seconds. Pre-loaded GCE subjects,
              smart timetable sync, and real-time admin oversight.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-950 font-bold rounded-xl py-3.5 px-5 text-sm hover:bg-brand-50 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.08] text-white font-semibold rounded-xl py-3.5 px-5 text-sm border border-white/[0.12] hover:bg-white/[0.14] active:scale-[0.98] transition-all backdrop-blur-sm"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.08]">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums">60s</p>
              <p className="text-[10px] text-brand-400/70 font-medium uppercase tracking-wider mt-0.5">Per entry</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums">40+</p>
              <p className="text-[10px] text-brand-400/70 font-medium uppercase tracking-wider mt-0.5">GCE subjects</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums">100%</p>
              <p className="text-[10px] text-brand-400/70 font-medium uppercase tracking-wider mt-0.5">Mobile-first</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-2">Built for everyone</p>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          One platform,<br />three powerful roles.
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Whether you teach, manage, or oversee — Edlog gives you the tools you need.
        </p>

        <div className="space-y-3 mt-8">
          {/* Teacher card */}
          <Link href="/register" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 shadow-lg shadow-blue-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Teacher</h3>
                    <p className="text-blue-200 text-xs">Record & track lessons</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-blue-100/90 text-sm leading-relaxed">
                  Fill logbook entries in seconds with pre-loaded curriculum data, smart timetable sync, and digital signatures.
                </p>
              </div>
            </div>
          </Link>

          {/* School Admin card */}
          <Link href="/register/school" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 shadow-lg shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">School Admin</h3>
                    <p className="text-emerald-200 text-xs">Manage & verify</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-emerald-100/90 text-sm leading-relaxed">
                  Oversee all teachers, verify entries in real-time, manage timetables, and track curriculum delivery.
                </p>
              </div>
            </div>
          </Link>

          {/* Regional Admin card */}
          <div className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 shadow-lg shadow-violet-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Regional Inspector</h3>
                    <p className="text-violet-200 text-xs">Oversee & report</p>
                  </div>
                </div>
                <p className="text-violet-100/90 text-sm leading-relaxed">
                  Monitor curriculum compliance across multiple schools, generate reports, and issue registration codes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="bg-slate-50 px-5 py-14">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-2">Why Edlog</p>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Everything you need,<br />nothing you don&apos;t.
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">60-Second Entries</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tap, select, submit. Faster than writing by hand.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Works Offline</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mobile-first PWA. Works on any budget phone.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center mb-3">
                <Clock className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Smart Timetable</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Auto-fills class, subject, and period from your schedule.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">GCE Built-In</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                40+ A-Level subjects with topics and modules pre-loaded.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle className="w-4.5 h-4.5 text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Verification</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Admins verify entries in real-time with one tap.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center mb-3">
                <BarChart3 className="w-4.5 h-4.5 text-cyan-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Analytics</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Track curriculum delivery rates across all classes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-2">How it works</p>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-8">
          Three steps. That&apos;s it.
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Open today&apos;s schedule</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Your timetable is already loaded. Tap the period you just taught.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Select your topic</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Class and subject auto-fill. Just pick the module and type the topic.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submit & sign</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Add an optional digital signature and hit submit. Done in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 py-14 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        </div>
        <div className="max-w-lg mx-auto text-center relative">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Ready to go digital?
          </h2>
          <p className="text-brand-300/80 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
            Join schools across Cameroon already using Edlog to streamline curriculum tracking.
          </p>

          <div className="flex flex-col gap-3 mt-8 max-w-xs mx-auto">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-white text-brand-950 font-bold rounded-xl py-3.5 px-6 text-sm hover:bg-brand-50 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/[0.08] text-white font-semibold rounded-xl py-3.5 px-6 text-sm border border-white/[0.12] hover:bg-white/[0.14] active:scale-[0.98] transition-all"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="bg-brand-950 px-5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white/60" />
          </div>
          <span className="text-white/50 font-semibold text-sm">Edlog</span>
        </div>
        <p className="text-xs text-white/30">
          Built by Darren Monyongo &amp; Brayan Lontchi
        </p>
        <p className="text-xs text-white/20 mt-1">Cameroon</p>
      </div>
    </div>
  );
}
