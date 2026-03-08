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
      // ease-out cubic
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
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--header-from) 0%, var(--header-via) 50%, var(--header-to) 100%)",
        }}
      >
        {/* Radial overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top right, var(--header-overlay), transparent)",
          }}
        />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative px-5 pt-14 pb-20 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-white font-bold text-lg tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edlog
            </span>
          </div>

          {/* Hero content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-full pl-2 pr-3.5 py-1.5 border border-white/[0.06]">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-emerald-500">New</span>
              <span className="text-white/70 text-xs font-medium" style={{ fontFamily: "var(--font-body)" }}>Subject divisions &amp; smart timetabling</span>
            </div>

            <h1
              className="text-[2.5rem] leading-[1.1] font-extrabold text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The logbook<br />
              <span style={{ color: "var(--accent)" }}>
                teachers actually use.
              </span>
            </h1>

            <p
              className="text-white/50 text-base leading-relaxed max-w-sm"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Fill your curriculum logbook in under 60 seconds. Pre-loaded GCE subjects,
              smart timetable sync, and real-time admin oversight.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-5 text-sm bg-white text-stone-900 active:scale-[0.98] transition-all duration-[80ms] shadow-lg"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.10] text-white font-semibold rounded-xl py-3.5 px-5 text-sm border border-white/[0.10] hover:bg-white/[0.15] active:scale-[0.98] transition-all duration-[80ms] backdrop-blur-sm"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Trust indicators — animated count-up */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.06]">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                <span ref={stat1.ref}>{stat1.value}</span>
              </p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Per entry</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                <span ref={stat2.ref}>{stat2.value}</span>
              </p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5" style={{ fontFamily: "var(--font-body)" }}>GCE subjects</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                <span ref={stat3.ref}>{stat3.value}</span>
              </p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Mobile-first</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--accent-text)", fontFamily: "var(--font-body)" }}>Built for everyone</p>
        <h2
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          One platform,<br />three powerful roles.
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
          Whether you teach, manage, or oversee — Edlog gives you the tools you need.
        </p>

        <div className="space-y-3 mt-8">
          {/* Teacher card */}
          <Link href="/register" className="group block">
            <div
              className="p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
                borderRadius: "16px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.10)" }}>
                  <GraduationCap className="w-5 h-5" style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Teacher</h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Record &amp; track lessons</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" style={{ color: "var(--text-quaternary)" }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Fill logbook entries in seconds with pre-loaded curriculum data, smart timetable sync, and digital signatures.
              </p>
            </div>
          </Link>

          {/* School Admin card */}
          <Link href="/register/school" className="group block">
            <div
              className="p-5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
                borderRadius: "16px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.10)" }}>
                  <Shield className="w-5 h-5" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>School Admin</h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Manage &amp; verify</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" style={{ color: "var(--text-quaternary)" }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Oversee all teachers, verify entries in real-time, manage timetables, and track curriculum delivery.
              </p>
            </div>
          </Link>

          {/* Regional Admin card */}
          <div
            className="p-5"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
              borderRadius: "16px",
              boxShadow: "var(--shadow-card)",
              opacity: 0.75,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.10)" }}>
                <Globe className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Regional Inspector</h3>
                <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Oversee &amp; report</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Monitor curriculum compliance across multiple schools, generate reports, and issue registration codes.
            </p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="px-5 py-14" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--accent-text)", fontFamily: "var(--font-body)" }}>Why Edlog</p>
          <h2
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
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
              <div
                key={title}
                className="p-4"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "16px",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--accent-light)" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: "var(--accent-text)" }} />
                </div>
                <h3 className="font-bold text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>{title}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--accent-text)", fontFamily: "var(--font-body)" }}>How it works</p>
        <h2
          className="text-2xl font-extrabold tracking-tight mb-8"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
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
                className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                }}
              >
                {n}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>{title}</h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div
        className="relative overflow-hidden px-5 py-14"
        style={{
          background: "linear-gradient(135deg, var(--header-from) 0%, var(--header-via) 50%, var(--header-to) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-lg mx-auto text-center relative">
          <h2
            className="text-2xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to go digital?
          </h2>
          <p className="text-white/40 text-sm mt-2 leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "var(--font-body)" }}>
            Join schools across Cameroon already using Edlog to streamline curriculum tracking.
          </p>

          <div className="flex flex-col gap-3 mt-8 max-w-xs mx-auto">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-6 text-sm bg-white text-stone-900 active:scale-[0.98] transition-all duration-[80ms] shadow-lg"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/[0.10] text-white font-semibold rounded-xl py-3.5 px-6 text-sm border border-white/[0.10] hover:bg-white/[0.15] active:scale-[0.98] transition-all duration-[80ms]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-5 py-8 text-center" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-primary)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} />
          </div>
          <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--text-tertiary)" }}>Edlog</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-quaternary)", fontFamily: "var(--font-body)" }}>
          Built by Darren Monyongo &amp; Brayan Lontchi
        </p>
        <p className="text-xs mt-1 opacity-60" style={{ color: "var(--text-quaternary)", fontFamily: "var(--font-body)" }}>Cameroon</p>
      </div>
    </div>
  );
}
