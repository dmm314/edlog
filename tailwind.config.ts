import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          950: "hsl(var(--brand-950) / <alpha-value>)",
          900: "hsl(var(--brand-900) / <alpha-value>)",
          800: "hsl(var(--brand-800) / <alpha-value>)",
          700: "hsl(var(--brand-700) / <alpha-value>)",
          600: "hsl(var(--brand-600) / <alpha-value>)",
          500: "hsl(var(--brand-500) / <alpha-value>)",
          400: "hsl(var(--brand-400) / <alpha-value>)",
          300: "hsl(var(--brand-300) / <alpha-value>)",
          200: "hsl(var(--brand-200) / <alpha-value>)",
          100: "hsl(var(--brand-100) / <alpha-value>)",
          50: "hsl(var(--brand-50) / <alpha-value>)",
        },
        surface: {
          canvas: "hsl(var(--surface-canvas) / <alpha-value>)",
          primary: "hsl(var(--surface-primary) / <alpha-value>)",
          secondary: "hsl(var(--surface-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--surface-tertiary) / <alpha-value>)",
          elevated: "hsl(var(--surface-elevated) / <alpha-value>)",
          float: "hsl(var(--surface-float) / <alpha-value>)",
        },
        content: {
          primary: "hsl(var(--text-primary) / <alpha-value>)",
          secondary: "hsl(var(--text-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--text-tertiary) / <alpha-value>)",
          inverse: "hsl(var(--text-inverse) / <alpha-value>)",
        },
        border: {
          DEFAULT: "hsl(var(--border-primary) / <alpha-value>)",
          muted: "hsl(var(--border-muted) / <alpha-value>)",
          strong: "hsl(var(--border-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
          strong: "hsl(var(--accent-strong) / <alpha-value>)",
          text: "hsl(var(--accent-text) / <alpha-value>)",
          glow: "hsl(var(--accent-glow) / <alpha-value>)",
        },
        status: {
          success: "hsl(var(--success) / <alpha-value>)",
          warning: "hsl(var(--warning) / <alpha-value>)",
          danger: "hsl(var(--danger) / <alpha-value>)",
          info: "hsl(var(--info) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Courier New", "monospace"],
      },
      fontSize: {
        xs: ["0.6875rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.625rem" }],
        xl: ["1.375rem", { lineHeight: "1.8rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "14px",
        md: "14px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 2px 8px -2px hsl(var(--accent-glow) / 0.08), 0 1px 3px -1px hsl(var(--accent-glow) / 0.06)",
        "card-hover": "0 12px 28px -8px hsl(var(--accent-glow) / 0.18), 0 4px 12px -4px hsl(var(--accent-glow) / 0.1)",
        elevated: "0 18px 44px -28px hsl(var(--accent-glow) / 0.22)",
        lifted: "0 12px 30px -20px hsl(var(--accent-glow) / 0.2)",
        accent: "0 8px 24px -8px hsl(var(--accent) / 0.35)",
        "accent-strong": "0 12px 32px -8px hsl(var(--accent) / 0.5)",
        success: "0 8px 24px -8px hsl(var(--success) / 0.35)",
        float: "0 24px 48px -16px hsl(var(--accent-glow) / 0.16), 0 8px 16px -8px hsl(var(--accent-glow) / 0.08)",
        glow: "0 0 0 3px hsl(var(--accent-glow) / 0.2)",
        "glow-active": "0 0 20px -4px hsl(var(--accent) / 0.4), 0 0 0 2px hsl(var(--accent) / 0.15)",
        "glow-success": "0 0 0 3px hsl(var(--success) / 0.2)",
        "glow-error": "0 0 0 3px hsl(var(--danger) / 0.15)",
        "inner-glow": "inset 0 1px 0 hsl(var(--accent-glow) / 0.06), inset 0 -1px 0 hsl(var(--accent-glow) / 0.04)",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "spring-bounce": {
          "0%": { opacity: "0", transform: "scale(0.82) translateY(10px)" },
          "55%": { opacity: "1", transform: "scale(1.04) translateY(-2px)" },
          "78%": { transform: "scale(0.985) translateY(0)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "spring-expand": {
          "0%": { opacity: "0", transform: "scaleY(0.92) translateY(-4px)", transformOrigin: "top" },
          "50%": { opacity: "1", transform: "scaleY(1.02) translateY(0)", transformOrigin: "top" },
          "100%": { opacity: "1", transform: "scaleY(1) translateY(0)", transformOrigin: "top" },
        },
        "live-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(var(--accent-glow) / 0.18)" },
          "50%": { transform: "scale(1.015)", boxShadow: "0 0 0 8px hsl(var(--accent-glow) / 0)" },
        },
        ripple: {
          "0%": { transform: "translate(-50%, -50%) scale(0.2)", opacity: "0.45" },
          "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: "0" },
        },
        "ripple-tap": {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "live-update": {
          "0%, 100%": { opacity: "0.7", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-1px)" },
        },
        "nav-bob": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-3px) scale(1.04)" },
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 12px -4px hsl(var(--accent) / 0.2)" },
          "50%": { boxShadow: "0 0 20px -4px hsl(var(--accent) / 0.4)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "40%": { transform: "scale(1.3)", opacity: "1" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "stories-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "status-verified": {
          "0%": { borderColor: "hsl(var(--success) / 0)" },
          "50%": { borderColor: "hsl(var(--success) / 0.4)" },
          "100%": { borderColor: "hsl(var(--success) / 0.15)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.8s linear infinite",
        float: "float 2.8s ease-in-out infinite",
        "spring-bounce": "spring-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-expand": "spring-expand 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "live-pulse": "live-pulse 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        ripple: "ripple 0.7s cubic-bezier(0, 0, 0.2, 1) forwards",
        "ripple-tap": "ripple-tap 0.5s ease-out forwards",
        "live-update": "live-update 2s ease-in-out infinite",
        "nav-bob": "nav-bob 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
        "heart-pop": "heart-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "stories-scroll": "stories-scroll 20s linear infinite",
        "status-verified": "status-verified 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
