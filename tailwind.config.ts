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
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "14px",
        xl: "16px",
        "2xl": "20px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        elevated: "0 8px 24px -6px rgba(0, 0, 0, 0.1), 0 2px 8px -4px rgba(0, 0, 0, 0.06)",
        float: "0 12px 32px -8px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.06)",
        accent: "0 4px 14px -4px hsl(var(--accent) / 0.3)",
        success: "0 4px 14px -4px hsl(var(--success) / 0.3)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 1.8s linear infinite",
        // Legacy compat — resolve to simple fade-in so existing pages compile
        "spring-bounce": "fade-in 0.2s ease-out",
        "spring-expand": "fade-in 0.2s ease-out",
        "live-pulse": "fade-in 0.2s ease-out",
        "glow-breathe": "none",
        "heart-pop": "scale-in 0.2s ease-out",
        "nav-bob": "none",
        ripple: "fade-in 0.3s ease-out",
        "ripple-tap": "fade-in 0.3s ease-out",
        "live-update": "none",
        "status-verified": "none",
        "stories-scroll": "none",
        float: "none",
      },
    },
  },
  plugins: [],
};

export default config;
