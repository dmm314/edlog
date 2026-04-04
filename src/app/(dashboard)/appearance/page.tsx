"use client";

import { useTheme, type DynamicIntensity, type Theme } from "@/components/ThemeProvider";
import { ArrowLeft, Check, Moon, Sparkles, Sun, Waves } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: {
    bg: string;
    card: string;
    glow: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    border: string;
  };
}

interface IntensityOption {
  id: DynamicIntensity;
  label: string;
  description: string;
  icon: React.ElementType;
}

const themeOptions: ThemeOption[] = [
  {
    id: "light",
    name: "Light",
    description: "Bright, adaptive surfaces for daytime speed.",
    icon: Sun,
    preview: {
      bg: "linear-gradient(180deg, #f7faf8, #e9f5ee)",
      card: "rgba(255,255,255,0.92)",
      glow: "rgba(30, 120, 70, 0.18)",
      text: "#1a2e22",
      textMuted: "#5f7d6d",
      accent: "#1e7846",
      accentSoft: "#dcf0e5",
      border: "rgba(30, 120, 70, 0.16)",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Immersive contrast without losing calm.",
    icon: Moon,
    preview: {
      bg: "linear-gradient(180deg, #0f1a14, #152218)",
      card: "rgba(16, 30, 22, 0.94)",
      glow: "rgba(60, 200, 120, 0.24)",
      text: "#f0f7f3",
      textMuted: "#9fbdab",
      accent: "#3cc878",
      accentSoft: "rgba(60, 200, 120, 0.16)",
      border: "rgba(60, 200, 120, 0.18)",
    },
  },
];

const intensityOptions: IntensityOption[] = [
  {
    id: "calm",
    label: "Calm",
    description: "Less glow, softer motion, same clarity.",
    icon: Waves,
  },
  {
    id: "vibrant",
    label: "Vibrant",
    description: "Full dynamic pulse for the live-feed feel.",
    icon: Sparkles,
  },
];

function ThemePreviewCard({
  option,
  isActive,
  onSelect,
}: {
  option: ThemeOption;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <div
        className={cn(
          "card overflow-hidden p-0 transition-all duration-300",
          isActive && "shadow-float",
        )}
        style={{ borderColor: isActive ? option.preview.border : undefined }}
      >
        <div className="p-4" style={{ background: option.preview.bg }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: option.preview.textMuted }}>
                Dynamic alive
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-2xl"
                  style={{ background: option.preview.accentSoft, color: option.preview.accent }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: option.preview.text }}>{option.name}</p>
                  <p className="text-[11px]" style={{ color: option.preview.textMuted }}>{option.description}</p>
                </div>
              </div>
            </div>
            {isActive ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#1e7846] shadow-accent">
                <Check className="h-4 w-4" />
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[20px] border p-3" style={{ background: option.preview.card, borderColor: option.preview.border, boxShadow: `0 18px 40px -30px ${option.preview.glow}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-2.5 w-20 rounded-full" style={{ background: option.preview.text, opacity: 0.9 }} />
                  <div className="mt-2 h-2 w-28 rounded-full" style={{ background: option.preview.textMuted, opacity: 0.55 }} />
                </div>
                <div className="h-10 w-10 rounded-2xl" style={{ background: option.preview.accentSoft }} />
              </div>
              <div className="mt-3 h-16 rounded-[18px]" style={{ background: `linear-gradient(135deg, ${option.preview.accentSoft}, ${option.preview.glow})` }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function AppearancePage() {
  const { theme, setTheme, intensity, setIntensity } = useTheme();
  const router = useRouter();
   const [vibrantMode, setVibrantMode] = useState(false);

  useEffect(() => {
    const enabled = typeof window !== "undefined" && localStorage.getItem("edlog-vibrant-mode") === "true";
    setVibrantMode(enabled);
    if (enabled) document.documentElement.classList.add("vibrant-mode");
  }, []);

  const toggleVibrantMode = () => {
    setVibrantMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("vibrant-mode");
      } else {
        document.documentElement.classList.remove("vibrant-mode");
      }
      localStorage.setItem("edlog-vibrant-mode", String(next));
      return next;
    });
  };

  return (
    <div className="page-shell space-y-4 pt-4">
      <section className="page-header overflow-hidden rounded-[32px] px-5 pb-6 pt-5 text-white">
        <div className="relative z-10 space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3 text-sm font-semibold text-white/84 transition hover:bg-white/12"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Display & motion</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dynamic intensity</h1>
            <p className="mt-2 max-w-sm text-sm text-white/76">
              Tune the adaptive blue-cyan energy so Edlog feels alive without ever getting noisy.
            </p>
          </div>
        </div>
      </section>

      <section className="section-card animate-slide-up">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-tertiary">Theme</p>
            <h2 className="text-lg font-bold text-content-primary">Choose your surface mode</h2>
          </div>
          <span className="rounded-full bg-[hsl(var(--accent-soft))] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--accent-text))]">
            Live preview
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {themeOptions.map((option) => (
            <ThemePreviewCard
              key={option.id}
              option={option}
              isActive={theme === option.id}
              onSelect={() => setTheme(option.id)}
            />
          ))}
        </div>

        <div className="mt-4 card p-4 animate-slide-up animation-delay-150">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-content-primary">Vibrant Mode</p>
              <p className="text-xs text-content-tertiary">Boosts blue accent for high sunlight readability.</p>
            </div>
            <button
              type="button"
              onClick={toggleVibrantMode}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${vibrantMode ? "bg-[hsl(var(--accent))]" : "bg-surface-tertiary"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${vibrantMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        
        {/* Info note */}
        <div
          className="mt-4 card p-4 animate-slide-up animation-delay-150"
        >
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              Tip:
            </span>{" "}
            Your theme preference is saved automatically and will persist
            across sessions.
          </p>
        </div>
      </section>

      <section className="section-card animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-tertiary">Motion profile</p>
          <h2 className="text-lg font-bold text-content-primary">Dynamic intensity</h2>
          <p className="mt-1 text-sm text-content-secondary">Calm keeps things focused. Vibrant leans into the live-feed pulse.</p>
        </div>

        <div className="grid gap-3">
          {intensityOptions.map((option) => {
            const Icon = option.icon;
            const active = intensity === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setIntensity(option.id)}
                className={cn(
                  "card flex items-center gap-4 p-4 text-left transition-all duration-300",
                  active && "live-card shadow-float",
                )}
              >
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", active ? "bg-[linear-gradient(135deg,hsl(var(--accent-soft)),hsl(var(--accent-glow)/0.24))] text-[hsl(var(--accent-text))]" : "bg-[hsl(var(--surface-secondary))] text-content-tertiary")}>
                  <Icon className={cn("h-5 w-5", active && option.id === "vibrant" && "motion-safe:animate-fade-in")} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-content-primary">{option.label}</span>
                  <span className="mt-1 block text-sm text-content-secondary">{option.description}</span>
                </span>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border", active ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]" : "border-[hsl(var(--border-primary))] text-transparent")}>
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-card animate-slide-up" style={{ animationDelay: "180ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-tertiary">Why this matters</p>
        <ul className="mt-3 space-y-3 text-sm text-content-secondary">
          <li>• The accent stays in one blue-cyan family, then subtly shifts with light, dark, status, and context.</li>
          <li>• Motion respects reduced-motion automatically, so older devices keep the same clarity without jank.</li>
          <li>• Your choice saves instantly on-device and carries across every dashboard screen.</li>
        </ul>
      </section>
    </div>
  );
}
