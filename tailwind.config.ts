import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";
import daisyui from "daisyui";
import { colors, shadows, chartPalette, fontFamilies } from "./styles/tokens";

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
           ROADMAP DESIGN SYSTEM — consumed directly from styles/tokens.ts.
           All colors use the `rgb(var(--x-rgb) / <alpha-value>)` pattern so
           opacity modifiers (bg-accent/10, border-severity-red-600/40, …)
           actually generate — Tailwind v3 drops them for plain var() colors.
           The --*-rgb channel variables live in app/globals.css and are kept
           in sync with styles/tokens.ts (see scripts/check-tokens.mjs).

           NOTE: bg-primary / text-primary / text-secondary / text-muted /
           border-subtle / border-active cannot be expressed as Tailwind
           color names (a color named `bg` would generate `bg-bg-primary`),
           so those utilities are hand-written in app/globals.css under
           the ROADMAP UTILITIES block.
           --------------------------------------------------------------- */
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
          sky: "rgb(var(--accent-rgb) / <alpha-value>)",
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

        /* Admin / ops-console panel family — token-driven utilities.
           bg-panel / bg-panel-deep / border-panel-border / … */
        panel: {
          DEFAULT: "rgb(var(--panel-rgb) / <alpha-value>)",
          deep: "rgb(var(--panel-deep-rgb) / <alpha-value>)",
          darker: "rgb(var(--panel-darker-rgb) / <alpha-value>)",
          hover: "rgb(var(--panel-hover-rgb) / <alpha-value>)",
          hoverAlt: "rgb(var(--panel-hover-alt-rgb) / <alpha-value>)",
          border: "rgb(var(--panel-border-rgb) / <alpha-value>)",
          borderStrong: "rgb(var(--panel-border-strong-rgb) / <alpha-value>)",
          borderHover: "rgb(var(--panel-border-hover-rgb) / <alpha-value>)",
          divide: "rgb(var(--panel-divide-rgb) / <alpha-value>)",
          chip: "rgb(var(--panel-chip-rgb) / <alpha-value>)",
        },

        /* SafeSphere brand palette — global tokens for surfaces outside the
           .landing-page scope (admin, demo, PWA, public citizen pages). */
        brand: {
          navy: "rgb(var(--brand-navy-rgb) / <alpha-value>)",
          navy2: "rgb(var(--brand-navy-2-rgb) / <alpha-value>)",
          navy3: "rgb(var(--brand-navy-3-rgb) / <alpha-value>)",
          blue: "rgb(var(--brand-blue-rgb) / <alpha-value>)",
          blueLight: "rgb(var(--brand-blue-light-rgb) / <alpha-value>)",
          orange: "rgb(var(--brand-orange-rgb) / <alpha-value>)",
          orangeLight: "rgb(var(--brand-orange-light-rgb) / <alpha-value>)",
          white: "rgb(var(--brand-white-rgb) / <alpha-value>)",
          gray: "rgb(var(--brand-gray-rgb) / <alpha-value>)",
          gray2: "rgb(var(--brand-gray-2-rgb) / <alpha-value>)",
          textDark: "rgb(var(--brand-text-dark-rgb) / <alpha-value>)",
          textMuted: "rgb(var(--brand-text-muted-rgb) / <alpha-value>)",
          textOnNavy: "rgb(var(--brand-text-on-navy-rgb) / <alpha-value>)",
        },

        /* shadcn/ui semantic tokens (aliased to roadmap vars) */
        card: {
          DEFAULT: "rgb(var(--card-rgb) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground-rgb) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover-rgb) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground-rgb) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground-rgb) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-rgb) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground-rgb) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted-rgb) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive-rgb) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground-rgb) / <alpha-value>)",
        },
        input: "rgb(var(--input-rgb) / <alpha-value>)",
        ring: "rgb(var(--ring-rgb) / <alpha-value>)",

        /* Legacy EOC aliases (kept) */
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated-rgb) / <alpha-value>)",
          muted: "rgb(var(--surface-muted-rgb) / <alpha-value>)",
        },
        /* Chart palette — shared data-viz colors (styles/tokens.ts → chartPalette) */
        chart: {
          blue: chartPalette.blue.base,
          orange: chartPalette.orange.base,
          green: chartPalette.green.base,
          red: chartPalette.red.base,
          purple: chartPalette.purple.base,
          amber: chartPalette.amber.base,
          cyan: chartPalette.cyan.base,
          pink: chartPalette.pink.base,
          slate: chartPalette.slate.base,
        },
      },
      fontFamily: {
        sans: [...fontFamilies.sans],
        mono: [...fontFamilies.mono],
        display: [...fontFamilies.display],
      },
      borderRadius: {
        /* Roadmap radius scale — overrides Tailwind defaults.
           NOTE: 2xl/3xl/4xl keep the Tailwind defaults (16/24/32px) — the
           landing display radii (22/26/12/16/20px) are exposed as the
           --radius-xl2..xl6 CSS vars for arbitrary-value references. */
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        chat: "var(--radius-chat)",
        /* Legacy EOC radius (kept for old components) */
        eoc: "var(--radius-eoc)",
      },
      boxShadow: {
        /* Legacy EOC glows (kept — signature ring+glow look) */
        "glow-green": shadows.glowLegacy.green,
        "glow-amber": shadows.glowLegacy.amber,
        "glow-red": shadows.glowLegacy.red,
        "glow-purple": shadows.glowLegacy.purple,
        "glow-accent": shadows.glowLegacy.sky,
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
  plugins: [
    typography,
    animate,
    daisyui,
  ],
  /* daisyUI — custom brand theme built on the SafeSphere tokens so the
     semantic classes (navbar, btn-primary, menu, dropdown, …) render in
     our navy/blue/orange instead of daisyUI defaults. Applied via the
     `data-theme` attribute on the landing root (dark-first). */
  daisyui: {
    themes: [
      {
        safesphere: {
          "primary": colors.landing.blue,
          "primary-content": colors.landing.white,
          "secondary": colors.landing.orange,
          "secondary-content": colors.landing.white,
          "accent": colors.landing.blueLight,
          "accent-content": colors.landing.white,
          "neutral": colors.landing.navy,
          "neutral-content": colors.landing.textOnNavy,
          "base-100": colors.landing.navy,
          "base-200": colors.landing.navy2,
          "base-300": colors.landing.navy3,
          "base-content": colors.landing.textOnNavy,
          "info": colors.landing.blueLight,
          "info-content": colors.landing.navy,
          "success": "#22C55E",
          "success-content": colors.landing.navy,
          "warning": "#FACC15",
          "warning-content": colors.landing.navy,
          "error": colors.accent.danger,
          "error-content": colors.landing.navy,
          "--rounded-box": "18px",
          "--rounded-btn": "9999px",
          "--rounded-badge": "9999px",
          "--animation-btn": "0.22s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.96",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "1rem",
        },
      },
    ],
    darkTheme: "safesphere",
    logs: false,
  },
};

export default config;