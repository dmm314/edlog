"use client";

import { useState, useEffect, useRef } from "react";
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

// ── Animated counter hook ────────────────────────────────

function useCountUp(target: number, duration = 800, suffix = "") {
  const [value, setValue] = useState("0" + suffix);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setValue(current + suffix);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, [target, duration, suffix]);

  return { value, ref };
}

// ── Landing Page ─────────────────────────────────────────

export default function LandingPage() {
  const stat1 = useCountUp(60, 800, "s");
  const stat2 = useCountUp(40, 800, "+");
  const stat3 = useCountUp(100, 800, "%");

  return (
    <div className="min-h-screen overflow-hidden bg-surface-canvas">
      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--accent-strong)) 0%, hsl(var(--accent)) 50%, hsl(var(--accent-strong)) 100%)",
        }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative px-5 pt-14 pb-20 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white/20 backdrop-blur-sm"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-white font-bold text-lg tracking-tight font-display"
            >
              Edlog
            </span>
          </div>

          {/* Hero content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/[0.12] backdrop-blur-sm rounded-full pl-2 pr-3.5 py-1.5 border border-white/[0.08]">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "hsl(var(--success))" }}>New</span>
              <span className="text-white/80 text-xs font-medium">Subject divisions &amp; smart timetabling</span>
            </div>

            <h1
              className="text-[2.5rem] leading-[1.1] font-extrabold text-white tracking-tight font-display"
            >
              The logbook<br />
              teachers actually use.
            </h1>

            <p
              className="text-white/60 text-base leading-relaxed max-w-sm"
            >
              Fill your curriculum logbook in under 60 seconds. Pre-loaded GCE subjects,
              smart timetable sync, and real-time admin oversight.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-5 text-sm bg-white text-content-primary active:scale-[0.98] transition-all duration-[80ms] shadow-lg"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.15] text-white font-semibold rounded-xl py-3.5 px-5 text-sm border border-white/[0.15] hover:bg-white/[0.22] active:scale-[0.98] transition-all duration-[80ms] backdrop-blur-sm"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Trust indicators — animated count-up */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.1]">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums font-mono">
                <span ref={stat1.ref}>{stat1.value}</span>
              </p>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">Per entry</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums font-mono">
                <span ref={stat2.ref}>{stat2.value}</span>
              </p>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">GCE subjects</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums font-mono">
                <span ref={stat3.ref}>{stat3.value}</span>
              </p>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">Mobile-first</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-accent-text">Built for everyone</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-content-primary font-display">
          One platform,<br />three powerful roles.
        </h2>
        <p className="text-sm mt-2 leading-relaxed text-content-tertiary">
          Whether you teach, manage, or oversee — Edlog gives you the tools you need.
        </p>

        <div className="space-y-3 mt-8">
          {/* Teacher card */}
          <Link href="/register" className="group block">
            <div className="card p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-soft">
                  <GraduationCap className="w-5 h-5 text-accent-text" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-content-primary">Teacher</h3>
                  <p className="text-xs text-content-tertiary">Record &amp; track lessons</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto text-content-tertiary group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm leading-relaxed text-content-secondary">
                Fill logbook entries in seconds with pre-loaded curriculum data, smart timetable sync, and digital signatures.
              </p>
            </div>
          </Link>

          {/* School Admin card */}
          <Link href="/register/school" className="group block">
            <div className="card p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--success) / 0.1)" }}>
                  <Shield className="w-5 h-5 text-status-success" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-content-primary">School Admin</h3>
                  <p className="text-xs text-content-tertiary">Manage &amp; verify</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto text-content-tertiary group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm leading-relaxed text-content-secondary">
                Oversee all teachers, verify entries in real-time, manage timetables, and track curriculum delivery.
              </p>
            </div>
          </Link>

          {/* Regional Admin card */}
          <div className="card p-5 opacity-75">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--info) / 0.1)" }}>
                <Globe className="w-5 h-5 text-status-info" />
              </div>
              <div>
                <h3 className="font-bold text-base text-content-primary">Regional Inspector</h3>
                <p className="text-xs text-content-tertiary">Oversee &amp; report</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-content-secondary">
              Monitor curriculum compliance across multiple schools, generate reports, and issue registration codes.
            </p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="px-5 py-14 bg-surface-secondary">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-accent-text">Why Edlog</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-content-primary font-display">
            Everything you need,<br />nothing you don&apos;t.
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-8">
            {[
              { icon: Zap, title: "60-Second Entries", desc: "Tap, select, submit. Faster than writing by hand." },
              { icon: Smartphone, title: "Works Offline", desc: "Mobile-first PWA. Works on any budget phone." },
              { icon: Clock, title: "Smart Timetable", desc: "Auto-fills class, subject, and period from your schedule." },
              { icon: BookOpen, title: "GCE Built-In", desc: "40+ A-Level subjects with topics and modules pre-loaded." },
              { icon: CheckCircle, title: "Verification", desc: "Admins verify entries in real-time with one tap." },
              { icon: BarChart3, title: "Analytics", desc: "Track curriculum delivery rates across all classes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-accent-soft">
                  <Icon className="w-4.5 h-4.5 text-accent-text" />
                </div>
                <h3 className="font-bold text-sm text-content-primary">{title}</h3>
                <p className="text-xs mt-1 leading-relaxed text-content-tertiary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-accent-text">How it works</p>
        <h2 className="text-2xl font-extrabold tracking-tight mb-8 text-content-primary font-display">
          Three steps. That&apos;s it.
        </h2>

        <div className="space-y-6">
          {[
            { n: "1", title: "Open today's schedule", desc: "Your timetable is already loaded. Tap the period you just taught." },
            { n: "2", title: "Select your topic", desc: "Class and subject auto-fill. Just pick the module and type the topic." },
            { n: "3", title: "Submit & sign", desc: "Add an optional digital signature and hit submit. Done in seconds." },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm font-mono"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--accent-strong)), hsl(var(--accent)))",
                }}
              >
                {n}
              </div>
              <div>
                <h3 className="font-bold text-sm text-content-primary">{title}</h3>
                <p className="text-sm mt-0.5 text-content-tertiary">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div
        className="relative overflow-hidden px-5 py-14"
        style={{
          background: "linear-gradient(135deg, hsl(var(--accent-strong)) 0%, hsl(var(--accent)) 50%, hsl(var(--accent-strong)) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-lg mx-auto text-center relative">
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Ready to go digital?
          </h2>
          <p className="text-white/50 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
            Join schools across Cameroon already using Edlog to streamline curriculum tracking.
          </p>

          <div className="flex flex-col gap-3 mt-8 max-w-xs mx-auto">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-6 text-sm bg-white text-content-primary active:scale-[0.98] transition-all duration-[80ms] shadow-lg"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/[0.15] text-white font-semibold rounded-xl py-3.5 px-6 text-sm border border-white/[0.15] hover:bg-white/[0.22] active:scale-[0.98] transition-all duration-[80ms]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-5 py-8 text-center bg-surface-secondary border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-accent-soft">
            <BookOpen className="w-3.5 h-3.5 text-accent-text" />
          </div>
          <span className="font-semibold text-sm text-content-tertiary font-display">Edlog</span>
        </div>
        <p className="text-xs text-content-tertiary">
          Built by Darren Monyongo &amp; Brayan Lontchi
        </p>
        <p className="text-xs mt-1 text-content-tertiary opacity-60">Cameroon</p>
      </div>
    </div>
  );
}
