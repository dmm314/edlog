"use client";

import { useTheme, Theme } from "@/components/ThemeProvider";
import { ArrowLeft, Check, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: {
    bg: string;
    card: string;
    header: string;
    text: string;
    textMuted: string;
    accent: string;
    border: string;
    navBg: string;
    navDot: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and bright for daytime use",
    icon: Sun,
    preview: {
      bg: "#f8fafc",
      card: "#ffffff",
      header: "linear-gradient(135deg, #0f172a, #1e293b, #334155)",
      text: "#0f172a",
      textMuted: "#94a3b8",
      accent: "#4f46e5",
      border: "#e2e8f0",
      navBg: "#ffffff",
      navDot: "#4f46e5",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes in low light",
    icon: Moon,
    preview: {
      bg: "#18181b",
      card: "#27272a",
      header: "linear-gradient(135deg, #09090b, #18181b, #27272a)",
      text: "#fafafa",
      textMuted: "#71717a",
      accent: "#818cf8",
      border: "#3f3f46",
      navBg: "#18181b",
      navDot: "#818cf8",
    },
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
    <button
      onClick={onSelect}
      className="w-full text-left transition-all duration-300 ease-out group"
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: isActive
            ? `2.5px solid var(--accent)`
            : `2.5px solid var(--border-primary)`,
          boxShadow: isActive
            ? `0 0 0 3px var(--accent-light), var(--shadow-elevated)`
            : "var(--shadow-card)",
          transform: isActive ? "scale(1)" : undefined,
        }}
      >
        {/* Mini phone preview */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: option.preview.bg,
            padding: "0",
          }}
        >
          {/* Mini header */}
          <div
            style={{
              background: option.preview.header,
              padding: "14px 16px 24px",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              />
              <div className="flex-1">
                <div
                  className="h-2.5 rounded-full w-20"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                />
                <div
                  className="h-2 rounded-full w-14 mt-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </div>
            </div>
          </div>

          {/* Mini content area */}
          <div style={{ padding: "12px 16px 8px", marginTop: "-12px" }}>
            {/* Card 1 */}
            <div
              className="rounded-lg p-3 mb-2.5"
              style={{
                backgroundColor: option.preview.card,
                border: `1px solid ${option.preview.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: option.preview.accent, opacity: 0.2 }}
                />
                <div
                  className="h-2 rounded-full w-16"
                  style={{ backgroundColor: option.preview.text, opacity: 0.7 }}
                />
              </div>
              <div
                className="h-2 rounded-full w-full mb-1.5"
                style={{ backgroundColor: option.preview.textMuted, opacity: 0.3 }}
              />
              <div
                className="h-2 rounded-full w-3/4"
                style={{ backgroundColor: option.preview.textMuted, opacity: 0.2 }}
              />
            </div>

            {/* Card 2 */}
            <div
              className="rounded-lg p-3 mb-2.5"
              style={{
                backgroundColor: option.preview.card,
                border: `1px solid ${option.preview.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: option.preview.accent }}
                />
                <div className="flex-1">
                  <div
                    className="h-2 rounded-full w-20"
                    style={{ backgroundColor: option.preview.text, opacity: 0.7 }}
                  />
                </div>
              </div>
              <div
                className="h-8 rounded-md w-full"
                style={{ backgroundColor: option.preview.accent, opacity: 0.12 }}
              />
            </div>
          </div>

          {/* Mini bottom nav */}
          <div
            className="flex items-center justify-around py-2.5 px-4"
            style={{
              backgroundColor: option.preview.navBg,
              borderTop: `1px solid ${option.preview.border}`,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor:
                      i === 0 ? option.preview.navDot : option.preview.textMuted,
                    opacity: i === 0 ? 1 : 0.3,
                  }}
                />
                <div
                  className="h-1 rounded-full w-6"
                  style={{
                    backgroundColor:
                      i === 0 ? option.preview.navDot : option.preview.textMuted,
                    opacity: i === 0 ? 0.7 : 0.2,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Selection indicator */}
        {isActive && (
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in"
            style={{
              backgroundColor: "var(--accent)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label area */}
      <div className="mt-3 flex items-center gap-2.5 px-1">
        {/* Radio indicator */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            border: isActive
              ? `2px solid var(--accent)`
              : `2px solid var(--text-quaternary)`,
          }}
        >
          {isActive && (
            <div
              className="w-2.5 h-2.5 rounded-full animate-scale-in"
              style={{ backgroundColor: "var(--accent)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{
                color: isActive ? "var(--accent-text)" : "var(--text-tertiary)",
              }}
            />
            <p
              className="text-sm font-semibold truncate"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              {option.name}
            </p>
          </div>
          <p
            className="text-[11px] mt-0.5 truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div className="page-header px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="relative z-10 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-80"
            style={{ color: "var(--header-text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--header-text)" }}
          >
            Display & Appearance
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--header-text-muted)" }}
          >
            Choose how Edlog looks to you
          </p>
        </div>
      </div>

      <div className="px-5 -mt-4 max-w-lg mx-auto">
        {/* Theme Selection Card */}
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              Theme
            </h2>
          </div>
          <p
            className="text-[13px] mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            Select your preferred appearance. Changes apply instantly.
          </p>

          {/* Theme grid */}
          <div className="grid grid-cols-2 gap-3">
            {themeOptions.map((option) => (
              <ThemePreviewCard
                key={option.id}
                option={option}
                isActive={theme === option.id}
                onSelect={() => setTheme(option.id)}
              />
            ))}
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
      </div>
    </div>
  );
}
