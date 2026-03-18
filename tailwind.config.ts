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
        xs: "12px",
        sm: "14px",
        DEFAULT: "18px",
        md: "18px",
        lg: "22px",
        xl: "28px",
        "2xl": "32px",
        pill: "999px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        float: "var(--shadow-float)",
        accent: "var(--shadow-accent)",
        success: "var(--shadow-success)",
        nav: "var(--shadow-nav)",
        glow: "0 0 0 1px hsl(var(--accent) / 0.22), 0 0 0 6px hsl(var(--accent-glow) / 0.16)",
      },
      backgroundImage: {
        "dynamic-accent": "linear-gradient(135deg, hsl(var(--accent) / 1), hsl(var(--accent-strong) / 1))",
        "dynamic-card": "linear-gradient(180deg, hsl(var(--surface-elevated) / 0.96), hsl(var(--surface-primary) / 0.88))",
        shimmer: "linear-gradient(90deg, transparent, hsl(var(--accent-glow) / 0.18), transparent)",
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
        "spring-bounce": {
          "0%": { opacity: "0", transform: "scale(0.82) translateY(10px)" },
          "55%": { opacity: "1", transform: "scale(1.04) translateY(-2px)" },
          "78%": { transform: "scale(0.985) translateY(0)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "live-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(var(--accent-glow) / 0.18)" },
          "50%": { transform: "scale(1.02)", boxShadow: "0 0 0 10px hsl(var(--accent-glow) / 0)" },
        },
        ripple: {
          "0%": { transform: "translate(-50%, -50%) scale(0.2)", opacity: "0.45" },
          "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: "0" },
        },
        "live-update": {
          "0%, 100%": { opacity: "0.7", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-1px)" },
        },
        "nav-bob": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-3px) scale(1.04)" },
        },
      },
      animation: {
        "slide-up": "slide-up 520ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 220ms ease-out",
        "scale-in": "scale-in 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.2s linear infinite",
        "spring-bounce": "spring-bounce 720ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "live-pulse": "live-pulse 2.8s ease-in-out infinite",
        ripple: "ripple 700ms ease-out forwards",
        "live-update": "live-update 2.2s ease-in-out infinite",
        "nav-bob": "nav-bob 2.6s ease-in-out infinite",
      },
      maxWidth: {
        mobile: "480px",
      },
      transitionTimingFunction: {
        fluid: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
