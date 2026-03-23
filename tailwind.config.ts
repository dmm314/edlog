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
        mono: ["var(--font-mono)", "Courier New", "monospace"],
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }],
        body: ["0.875rem", { lineHeight: "1.25rem" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem" }],
        title: ["1.25rem", { lineHeight: "1.75rem" }],
        display: ["1.75rem", { lineHeight: "2.25rem" }],
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
        elevated: "0 8px 24px -6px rgba(0, 0, 0, 0.1), 0 2px 8px -4px rgba(0, 0, 0, 0.06)",
        float: "0 12px 32px -8px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.06)",
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
      },
    },
  },
  plugins: [],
};

export default config;
