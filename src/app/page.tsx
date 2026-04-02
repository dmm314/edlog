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
  Leaf,
  MapPin,
  Star,
} from "lucide-react";

// ── Animated counter ─────────────────────────────────────
function useCountUp(target: number, duration = 900, suffix = "") {
  const [value, setValue] = useState("0" + suffix);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - (1 - p) ** 3;
            setValue(Math.round(eased * target) + suffix);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, suffix]);
  return { value, ref };
}

// ── Landing Page — Warm, welcoming, Cameroonian ─────────
export default function LandingPage() {
  const s1 = useCountUp(60, 900, "s");
  const s2 = useCountUp(40, 900, "+");
  const s3 = useCountUp(10, 900, "");
  const s4 = useCountUp(58, 900, "");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--surface-canvas))" }}>
      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-30 border-b px-5"
        style={{
          background: "hsl(var(--surface-canvas) / 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "hsl(var(--border-primary))",
        }}
      >
        <div className="flex h-14 max-w-5xl mx-auto items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--accent))" }}
            >
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: "hsl(var(--text-primary))" }}>
              Edlog
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:flex items-center rounded-xl px-4 text-sm font-semibold transition-all duration-[80ms]"
              style={{ color: "hsl(var(--text-secondary))", minHeight: "40px" }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white active:scale-[0.97] transition-all duration-[80ms]"
              style={{ background: "hsl(var(--accent))", minHeight: "40px", boxShadow: "var(--shadow-accent)" }}
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="px-5 pt-12 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest mb-6"
              style={{
                background: "hsl(var(--gold-soft))",
                color: "hsl(var(--gold-text))",
                border: "1px solid hsl(var(--gold) / 0.2)",
              }}
            >
              <Star className="w-3 h-3" style={{ color: "hsl(var(--gold))" }} />
              Built for Cameroon
            </div>

            <h1
              className="text-[2.5rem] sm:text-[3.2rem] leading-[1.05] font-extrabold tracking-tight mb-4"
              style={{ color: "hsl(var(--text-primary))" }}
            >
              The logbook that{" "}
              <span style={{ color: "hsl(var(--accent))" }}>grows</span>
              <br />with your teaching.
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              Record lessons in under 60 seconds. Track curriculum delivery in real-time.
              Give every teacher, admin, and inspector the visibility they need — from
              Buea to Maroua.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-6 text-sm text-white active:scale-[0.97] transition-all duration-[80ms]"
                style={{
                  background: "hsl(var(--accent))",
                  boxShadow: "var(--shadow-accent)",
                  minHeight: "48px",
                }}
              >
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 px-6 text-sm active:scale-[0.97] transition-all duration-[80ms]"
                style={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border-primary))",
                  color: "hsl(var(--text-primary))",
                  minHeight: "48px",
                }}
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="px-5 pb-10">
        <div className="max-w-5xl mx-auto">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border-primary))",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {[
              { val: s1.value, label: "Per entry", ref: s1.ref },
              { val: s2.value, label: "GCE subjects", ref: s2.ref },
              { val: s3.value, label: "Regions", ref: s3.ref },
              { val: s4.value, label: "Divisions", ref: s4.ref },
            ].map(({ val, label, ref }, i) => (
              <div
                key={label}
                ref={ref}
                className="text-center py-5 px-3"
                style={i < 3 ? { borderRight: "1px solid hsl(var(--border-primary))" } : {}}
              >
                <p
                  className="text-2xl font-extrabold tabular-nums"
                  style={{ color: "hsl(var(--accent))", fontFamily: "var(--font-mono, monospace)" }}
                >
                  {val}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE ROLES ── */}
      <section className="px-5 pt-8 pb-10" style={{ background: "hsl(var(--surface-elevated))" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "hsl(var(--accent))" }}>
            One platform, three roles
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "hsl(var(--text-primary))" }}>
            Everyone sees what they need.
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: "hsl(var(--text-tertiary))" }}>
            Whether you teach Physics in Bamenda, manage a lycée in Douala, or inspect schools across the Southwest — Edlog adapts to you.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: GraduationCap,
                title: "Teacher",
                subtitle: "Record & track",
                desc: "Fill your logbook in seconds. Pre-loaded curriculum for all GCE A-Level and O-Level subjects. Works on any phone, even offline.",
                color: "hsl(var(--accent))",
                bg: "hsl(var(--accent-soft))",
                href: "/register",
              },
              {
                icon: Shield,
                title: "School Admin",
                subtitle: "Manage & verify",
                desc: "See which teachers logged today. Verify entries with one tap. Track curriculum coverage across all departments in real time.",
                color: "hsl(var(--gold-text))",
                bg: "hsl(var(--gold-soft))",
                href: "/register/school",
              },
              {
                icon: Globe,
                title: "Regional Inspector",
                subtitle: "Oversee & report",
                desc: "Monitor compliance across schools. Compare coverage rates. Generate reports for the regional delegation — no spreadsheets needed.",
                color: "hsl(var(--info))",
                bg: "hsl(var(--info) / 0.08)",
                href: "/login",
              },
            ].map(({ icon: Icon, title, subtitle, desc, color, bg, href }) => (
              <Link key={title} href={href} className="group block">
                <div
                  className="h-full rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: "hsl(var(--surface-canvas))",
                    border: "1px solid hsl(var(--border-primary))",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="font-bold text-base mb-0.5" style={{ color: "hsl(var(--text-primary))" }}>
                    {title}
                  </h3>
                  <p className="text-xs font-semibold mb-3" style={{ color }}>
                    {subtitle}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="px-5 pt-12 pb-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "hsl(var(--accent))" }}>
            Why Edlog
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "hsl(var(--text-primary))" }}>
            Everything teachers need,<br />nothing they don&apos;t.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Zap, title: "60-Second Entries", desc: "Tap your timetable slot, select module, done. Faster than pen and paper." },
              { icon: Smartphone, title: "Works Offline", desc: "Progressive web app. Submit entries on 2G, sync when connected." },
              { icon: Clock, title: "Smart Timetable", desc: "Auto-fills class, subject, and period from your live schedule." },
              { icon: BookOpen, title: "National Curriculum", desc: "Physics, Chemistry, Biology, Maths, Computer Science + 35 more subjects pre-loaded." },
              { icon: CheckCircle, title: "Instant Verification", desc: "Coordinators and admins verify entries in real-time. No more end-of-term scrambles." },
              { icon: BarChart3, title: "Live Analytics", desc: "Curriculum coverage rates, compliance tracking, school comparison — all automatic." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5"
                style={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border-primary))",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "hsl(var(--accent-soft))" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: "hsl(var(--text-primary))" }}>
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
      <section className="px-5 pt-10 pb-10" style={{ background: "hsl(var(--surface-elevated))" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "hsl(var(--gold-text))" }}>
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "hsl(var(--text-primary))" }}>
            Three taps. That&apos;s it.
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                n: "1",
                title: "Open your schedule",
                desc: "Your timetable is already loaded. Tap the period you just taught — class and subject auto-fill.",
              },
              {
                n: "2",
                title: "Select your topic",
                desc: "Pick from the pre-loaded national curriculum. Physics Form 1 has 55 topics ready to go.",
              },
              {
                n: "3",
                title: "Submit & sign",
                desc: "Add optional notes, engagement level, and digital signature. Hit submit. Done in under a minute.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex sm:flex-col gap-4">
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: "hsl(var(--accent))",
                    boxShadow: "var(--shadow-accent)",
                  }}
                >
                  {n}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "hsl(var(--text-primary))" }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--text-tertiary))" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGIONAL COVERAGE MAP ── */}
      <section className="px-5 pt-12 pb-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "hsl(var(--accent))" }}>
            Nationwide
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3" style={{ color: "hsl(var(--text-primary))" }}>
            All 10 regions. All 58 divisions.
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: "hsl(var(--text-tertiary))" }}>
            Every region of Cameroon has a dedicated inspector account. Schools register under their region and division — the entire educational hierarchy is built in.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: "Southwest", capital: "Buea" },
              { name: "Northwest", capital: "Bamenda" },
              { name: "Littoral", capital: "Douala" },
              { name: "Centre", capital: "Yaoundé" },
              { name: "West", capital: "Bafoussam" },
              { name: "South", capital: "Ebolowa" },
              { name: "East", capital: "Bertoua" },
              { name: "Adamawa", capital: "Ngaoundéré" },
              { name: "North", capital: "Garoua" },
              { name: "Far North", capital: "Maroua" },
            ].map(({ name, capital }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 rounded-xl px-3 py-3"
                style={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border-primary))",
                }}
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "hsl(var(--text-primary))" }}>{name}</p>
                  <p className="text-[10px] truncate" style={{ color: "hsl(var(--text-tertiary))" }}>{capital}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="px-5 pt-10 pb-10" style={{ background: "hsl(var(--surface-elevated))" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                quote: "I used to spend 30 minutes filling my logbook after school. Now it takes less than a minute per lesson.",
                name: "Physics Teacher",
                school: "Lycée Bilingue de Buea",
              },
              {
                quote: "For the first time, I can see exactly which topics have been covered across all departments — in real time.",
                name: "School Administrator",
                school: "GBHS Bamenda",
              },
              {
                quote: "Comparing curriculum delivery rates across 15 schools used to take me a week. Now it takes 10 seconds.",
                name: "Regional Inspector",
                school: "Southwest Region",
              },
            ].map(({ quote, name, school }) => (
              <div
                key={name}
                className="rounded-2xl p-6"
                style={{
                  background: "hsl(var(--surface-canvas))",
                  border: "1px solid hsl(var(--border-primary))",
                }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "hsl(var(--gold))" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: "hsl(var(--text-secondary))" }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <p className="text-xs font-bold" style={{ color: "hsl(var(--text-primary))" }}>{name}</p>
                  <p className="text-[11px]" style={{ color: "hsl(var(--text-tertiary))" }}>{school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-5 py-16">
        <div
          className="max-w-3xl mx-auto text-center rounded-3xl px-8 py-14"
          style={{
            background: "hsl(var(--accent))",
            boxShadow: "0 20px 60px -12px hsl(var(--accent) / 0.3)",
          }}
        >
          <Leaf className="w-8 h-8 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to grow?
          </h2>
          <p className="text-white/60 text-sm mt-2 leading-relaxed max-w-md mx-auto">
            Join schools across Cameroon using Edlog to transform curriculum
            tracking from a chore into a 60-second habit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-sm mx-auto">
            <Link
              href="/register"
              className="flex-1 flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 px-6 text-sm active:scale-[0.98] transition-all duration-[80ms]"
              style={{ background: "white", color: "hsl(var(--accent-strong))" }}
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 px-6 text-sm text-white border border-white/20 active:scale-[0.98] transition-all duration-[80ms]"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-5 py-8 text-center border-t"
        style={{ borderColor: "hsl(var(--border-primary))" }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--accent-soft))" }}
          >
            <Leaf className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent))" }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
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
