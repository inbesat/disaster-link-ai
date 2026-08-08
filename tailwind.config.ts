import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  // ThemeProvider (next-themes) toggles the `dark` class on <html>.
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./server/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ---------------------------------------------------------------
           ROADMAP DESIGN SYSTEM (UI/UX Phase 1 · Step 2)
           Tailwind-generated utilities from these tokens:
             bg-accent-danger / bg-accent-warning / bg-accent-success /
             bg-accent-purple / bg-accent-primary (accent namespace)
             bg-severity-critical / bg-severity-warning / bg-severity-watch /
             bg-severity-safe (severity namespace)
             shadow-modal / shadow-glow-blue (boxShadow)
             rounded-sm/md/lg/xl (radius scale)

           NOTE: bg-primary / text-primary / text-secondary / text-muted /
           border-subtle / border-active cannot be expressed as Tailwind
           color names (a color named `bg` would generate `bg-bg-primary`),
           so those utilities are hand-written in app/globals.css under
           `@layer utilities` — see the ROADMAP UTILITIES block there.
           --------------------------------------------------------------- */
        /* All colors use the `rgb(var(--x-rgb) / <alpha-value>)` pattern so
           opacity modifiers (bg-accent/10, border-severity-red-600/40, …)
           actually generate — Tailwind v3 drops them for plain var() colors.
           The --*-rgb channel variables live in app/globals.css. */
        border: {
          DEFAULT: "rgb(var(--border-rgb) / <alpha-value>)",
          strong: "rgb(var(--border-strong-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          soft: "var(--accent-soft)",
          primary: "rgb(var(--accent-primary-rgb) / <alpha-value>)",
          danger: "rgb(var(--accent-danger-rgb) / <alpha-value>)",
          warning: "rgb(var(--accent-warning-rgb) / <alpha-value>)",
          success: "rgb(var(--accent-success-rgb) / <alpha-value>)",
          purple: "rgb(var(--accent-purple-rgb) / <alpha-value>)",
        },
        severity: {
          /* Legacy EOC severity scales (kept) */
          green: {
            300: "rgb(var(--severity-green-300-rgb) / <alpha-value>)",
            400: "rgb(var(--severity-green-400-rgb) / <alpha-value>)",
            500: "rgb(var(--severity-green-500-rgb) / <alpha-value>)",
            600: "rgb(var(--severity-green-600-rgb) / <alpha-value>)",
          },
          amber: {
            300: "rgb(var(--severity-amber-300-rgb) / <alpha-value>)",
            400: "rgb(var(--severity-amber-400-rgb) / <alpha-value>)",
            500: "rgb(var(--severity-amber-500-rgb) / <alpha-value>)",
            600: "rgb(var(--severity-amber-600-rgb) / <alpha-value>)",
          },
          red: {
            300: "rgb(var(--severity-red-300-rgb) / <alpha-value>)",
            400: "rgb(var(--severity-red-400-rgb) / <alpha-value>)",
            500: "rgb(var(--severity-red-500-rgb) / <alpha-value>)",
            600: "rgb(var(--severity-red-600-rgb) / <alpha-value>)",
          },
          purple: {
            300: "rgb(var(--severity-purple-300-rgb) / <alpha-value>)",
            400: "rgb(var(--severity-purple-400-rgb) / <alpha-value>)",
            500: "rgb(var(--severity-purple-500-rgb) / <alpha-value>)",
            600: "rgb(var(--severity-purple-600-rgb) / <alpha-value>)",
          },
          /* Roadmap severity background tints */
          critical: "rgb(var(--severity-critical-rgb) / <alpha-value>)",
          warning: "rgb(var(--severity-warning-rgb) / <alpha-value>)",
          watch: "rgb(var(--severity-watch-rgb) / <alpha-value>)",
          safe: "rgb(var(--severity-safe-rgb) / <alpha-value>)",
        },

        /* Legacy EOC aliases (kept) */
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated-rgb) / <alpha-value>)",
          muted: "rgb(var(--surface-muted-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        /* Roadmap radius scale — overrides Tailwind defaults */
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        /* Legacy EOC radius (kept for old components) */
        eoc: "0.625rem",
      },
      boxShadow: {
        /* Legacy EOC glows (kept — signature ring+glow look) */
        "glow-green":
          "0 0 0 1px rgba(16, 185, 129, 0.4), 0 0 18px rgba(16, 185, 129, 0.25)",
        "glow-amber":
          "0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.25)",
        "glow-red": "0 0 0 1px rgba(239, 68, 68, 0.4), 0 0 18px rgba(239, 68, 68, 0.25)",
        "glow-purple":
          "0 0 0 1px rgba(168, 85, 247, 0.4), 0 0 18px rgba(168, 85, 247, 0.25)",
        "glow-accent":
          "0 0 0 1px rgba(56, 189, 248, 0.4), 0 0 18px rgba(56, 189, 248, 0.25)",
        /* Roadmap shadows & glows */
        card: "var(--shadow-card)",
        modal: "var(--shadow-modal)",
        "glow-blue": "var(--glow-blue)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        flash: {
          "0%, 100%": {
            boxShadow: "0 0 0 1px rgba(239,68,68,0.5), 0 0 22px rgba(239,68,68,0.4)",
          },
          "50%": {
            boxShadow: "0 0 0 1px rgba(239,68,68,0.1), 0 0 40px rgba(239,68,68,0.8)",
          },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s ease-in-out infinite",
        flash: "flash 1.6s ease-in-out infinite",
        marquee: "marquee 45s linear infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
