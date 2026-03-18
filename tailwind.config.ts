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
          950: "#022B66",
          900: "#033D8C",
          800: "#0550B5",
          700: "#0866FF",
          600: "#1877F2",
          500: "#3B82F6",
          400: "#60A5FA",
          300: "#93C5FD",
          200: "#BFDBFE",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
        surface: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          elevated: "var(--bg-elevated)",
          inset: "var(--bg-inset)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          quaternary: "var(--text-quaternary)",
        },
        "border-theme": {
          DEFAULT: "var(--border-primary)",
          secondary: "var(--border-secondary)",
          subtle: "var(--border-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
          text: "var(--accent-text)",
          muted: "var(--accent-muted)",
          warm: "var(--accent-warm)",
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
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.625rem", { lineHeight: "2rem" }],
        "3xl": ["2rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "14px",
        md: "14px",
        lg: "16px",
        xl: "20px",
        "2xl": "20px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 6px 20px -14px rgba(8, 102, 255, 0.35)",
        "card-hover": "0 20px 35px -24px rgba(8, 102, 255, 0.45)",
        elevated: "0 18px 44px -28px rgba(17, 24, 39, 0.28)",
        lifted: "0 12px 30px -20px rgba(17, 24, 39, 0.22)",
        accent: "0 10px 26px -16px rgba(8, 102, 255, 0.7)",
        success: "0 10px 26px -16px rgba(16, 185, 129, 0.55)",
        glow: "0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)",
        "glow-success": "0 0 0 3px rgb(16 185 129 / 0.20)",
        "glow-error": "0 0 0 3px rgb(239 68 68 / 0.15)",
      },
      keyframes: {
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spring-bounce": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "75%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slide-down": "slide-down 0.3s ease-out",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.8s linear infinite",
        float: "float 2.8s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "count-up": "count-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "spring-bounce": "spring-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
