"use client";

import { useRef, useEffect, useState } from "react";
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

// ── Animated counter ─────────────────────────────────────
function useCountUp(target: number, duration = 900, suffix = "") {
  const [value, setValue] = useState("0" + suffix);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(eased * target) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, suffix]);
  return value;
}

// ── Landing Page ─────────────────────────────────────────
export default function LandingPage() {
  const s1 = useCountUp(60, 900, "s");
  const s2 = useCountUp(40, 900, "+");
  const s3 = useCountUp(100, 900, "%");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--surface-canvas))" }}>

      {/* ── STICKY HEADER ── */}
      <header
        className="sticky top-0 z-30 border-b px-5"
        style={{
          background: "hsl(var(--surface-elevated))",
          borderColor: "hsl(var(--border-primary))",
        }}
      >
        <div className="flex h-14 max-w-lg mx-auto items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#0866FF" }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: "hsl(var(--text-primary))" }}>
              Edlog
            </span>
          </div>
          {/* Sign-in in header: earned blue button — always pops on any bg */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white active:scale-[0.97] transition-all duration-[80ms]"
            style={{ background: "#0866FF", minHeight: "40px" }}
          >
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── HERO — earned blue, contained card ── */}
      <section className="px-5 pt-7 pb-5">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Blue gradient card — the ONE earned-color hero moment */}
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(135deg, hsl(224 86% 36%) 0%, #0866FF 58%, hsl(217 90% 58%) 100%)",
            }}
          >
            {/* Subtle dot texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.07) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center bg-white/[0.14] border border-white/[0.1] rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 mb-5">
                New · Smart timetabling
              </span>
              <h1 className="text-[2.15rem] leading-[1.09] font-extrabold text-white tracking-tight mb-3">
                The logbook<br />teachers actually use.
              </h1>
              <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-[280px]">
                Fill your curriculum logbook in under 60 seconds. GCE subjects
                pre-loaded, real-time admin oversight.
              </p>
              <div className="flex gap-3">
                {/* White button on blue hero — always maximum contrast */}
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 font-bold rounded-xl py-[14px] px-4 text-sm bg-white shadow-md active:scale-[0.97] transition-all duration-[80ms]"
                  style={{ color: "#0866FF" }}
                >
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="flex-1 flex items-center justify-center font-semibold rounded-xl py-[14px] px-4 text-sm text-white border border-white/[0.18] active:scale-[0.97] transition-all duration-[80ms]"
                  style={{ background: "rgba(255,255,255,0.13)" }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          {/* Stats row — neutral card beneath hero */}
          <div
            className="flex rounded-2xl border overflow-hidden"
            style={{
              background: "hsl(var(--surface-elevated))",
              borderColor: "hsl(var(--border-primary))",
            }}
          >
            {[
              { val: s1, label: "Per entry" },
              { val: s2, label: "GCE subjects" },
              { val: s3, label: "Mobile-first" },
            ].map(({ val, label }, i) => (
              <div
                key={label}
                className="flex-1 text-center py-4"
                style={
                  i < 2
                    ? { borderRight: "1px solid hsl(var(--border-primary))" }
                    : {}
                }
              >
                <p
                  className="text-xl font-extrabold tabular-nums"
                  style={{
                    color: "hsl(var(--text-primary))",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {val}
                </p>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: "hsl(var(--text-tertiary))" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: "#0866FF" }}
          >
            Built for everyone
          </p>
          <h2
            className="text-2xl font-extrabold tracking-tight mb-2"
            style={{ color: "hsl(var(--text-primary))" }}
          >
            One platform,<br />three powerful roles.
          </h2>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            Whether you teach, manage, or oversee — Edlog gives you the right tools.
          </p>

          <div className="space-y-3">
            <Link href="/register" className="group block">
              <div className="card p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(var(--accent-soft))" }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: "#0866FF" }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: "hsl(var(--text-primary))" }}
                    >
                      Teacher
                    </h3>
                    <p className="text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                      Record &amp; track lessons
                    </p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 ml-auto transition-transform group-hover:translate-x-1"
                    style={{ color: "hsl(var(--text-tertiary))" }}
                  />
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  Fill logbook entries in seconds with pre-loaded curriculum data,
                  smart timetable sync, and digital signatures.
                </p>
              </div>
            </Link>

            <Link href="/register/school" className="group block">
              <div className="card p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(var(--success) / 0.1)" }}
                  >
                    <Shield className="w-5 h-5" style={{ color: "hsl(var(--success))" }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: "hsl(var(--text-primary))" }}
                    >
                      School Admin
                    </h3>
                    <p className="text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                      Manage &amp; verify
                    </p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 ml-auto transition-transform group-hover:translate-x-1"
                    style={{ color: "hsl(var(--text-tertiary))" }}
                  />
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  Oversee all teachers, verify entries in real-time, manage timetables,
                  and track curriculum delivery across departments.
                </p>
              </div>
            </Link>

            <div className="card p-5 opacity-60 cursor-default" aria-disabled="true">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(var(--info) / 0.1)" }}
                >
                  <Globe className="w-5 h-5" style={{ color: "hsl(var(--info))" }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-base"
                    style={{ color: "hsl(var(--text-primary))" }}
                  >
                    Regional Inspector
                  </h3>
                  <p className="text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                    Oversee &amp; report
                  </p>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                Monitor compliance across multiple schools, generate reports,
                and issue registration codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — alternate surface for visual rhythm ── */}
      <section
        className="px-5 pt-10 pb-8 mt-3"
        style={{ background: "hsl(var(--surface-secondary))" }}
      >
        <div className="max-w-lg mx-auto">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: "#0866FF" }}
          >
            Why Edlog
          </p>
          <h2
            className="text-2xl font-extrabold tracking-tight mb-7"
            style={{ color: "hsl(var(--text-primary))" }}
          >
            Everything you need,<br />nothing you don&apos;t.
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Zap,         title: "60-Second Entries",  desc: "Tap, select, submit. Faster than writing by hand." },
              { icon: Smartphone,  title: "Works Offline",      desc: "Mobile-first PWA. Works on any budget phone." },
              { icon: Clock,       title: "Smart Timetable",    desc: "Auto-fills class, subject, and period from your schedule." },
              { icon: BookOpen,    title: "GCE Built-In",       desc: "40+ A-Level subjects with topics pre-loaded." },
              { icon: CheckCircle, title: "Verification",       desc: "Admins verify entries in real-time with one tap." },
              { icon: BarChart3,   title: "Analytics",          desc: "Track curriculum delivery rates across all classes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "hsl(var(--accent-soft))" }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: "#0866FF" }} />
                </div>
                <h3
                  className="font-bold text-sm mb-1"
                  style={{ color: "hsl(var(--text-primary))" }}
                >
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 pt-10 pb-5">
        <div className="max-w-lg mx-auto">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: "#0866FF" }}
          >
            How it works
          </p>
          <h2
            className="text-2xl font-extrabold tracking-tight mb-7"
            style={{ color: "hsl(var(--text-primary))" }}
          >
            Three steps. That&apos;s it.
          </h2>

          <div className="space-y-5">
            {[
              {
                n: "1",
                title: "Open today's schedule",
                desc: "Your timetable is already loaded. Tap the period you just taught.",
              },
              {
                n: "2",
                title: "Select your topic",
                desc: "Class and subject auto-fill. Just pick the module and type the topic.",
              },
              {
                n: "3",
                title: "Submit & sign",
                desc: "Add an optional digital signature and hit submit. Done in seconds.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, hsl(224 86% 36%), #0866FF)" }}
                >
                  {n}
                </div>
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{ color: "hsl(var(--text-primary))" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm mt-0.5 leading-relaxed"
                    style={{ color: "hsl(var(--text-tertiary))" }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — second earned-color moment ── */}
      <section
        className="relative overflow-hidden px-5 py-14 mt-4"
        style={{
          background:
            "linear-gradient(135deg, hsl(224 86% 36%) 0%, #0866FF 58%, hsl(217 90% 58%) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.07) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="max-w-lg mx-auto text-center relative">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Ready to go digital?
          </h2>
          <p className="text-white/55 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
            Join schools across Cameroon already using Edlog to streamline
            curriculum tracking.
          </p>
          <div className="flex flex-col gap-3 mt-8 max-w-xs mx-auto">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-6 text-sm bg-white shadow-md active:scale-[0.98] transition-all duration-[80ms]"
              style={{ color: "#0866FF" }}
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 px-6 text-sm text-white border border-white/[0.18] active:scale-[0.98] transition-all duration-[80ms]"
              style={{ background: "rgba(255,255,255,0.13)" }}
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-5 py-8 text-center border-t"
        style={{
          background: "hsl(var(--surface-secondary))",
          borderColor: "hsl(var(--border-primary))",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--accent-soft))" }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: "#0866FF" }} />
          </div>
          <span
            className="font-semibold text-sm"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            Edlog
          </span>
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
          Built by Darren Monyongo &amp; Brayan Lontchi
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--text-quaternary))" }}>
          Cameroon · 2026
        </p>
      </footer>
    </div>
  );
}
