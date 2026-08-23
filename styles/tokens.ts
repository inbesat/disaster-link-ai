/**
 * =============================================================================
 * DisasterLink AI — DESIGN TOKENS (SINGLE SOURCE OF TRUTH)
 * -----------------------------------------------------------------------------
 * Phase 1 · Design System Audit & Token Fixes
 *
 * Every color, spacing step, radius, shadow and animation duration used by the
 * UI is declared here ONCE as a typed constant. Consumer layers:
 *
 *   1. tailwind.config.ts   → imports these objects to generate utilities
 *                             (bg-primary, text-secondary, rounded-lg, …).
 *   2. app/globals.css       → the `:root` CSS variables must MATCH these
 *                             values exactly (a drift check lives in
 *                             scripts/check-tokens.mjs).
 *   3. TSX/TS components     → import these constants for inline styles,
 *                             chart palettes, dynamic colors, etc. instead of
 *                             hardcoding hex/rgb literals.
 *
 * Use `as const` throughout so string-literal types narrow and typos surface
 * at compile time. Prefer the ROADMAP / PANEL families for new UI; the legacy
 * SURFACE / SEVERITY / LANDING families exist to keep old surfaces working.
 * =============================================================================
 */

/* =============================================================================
 * COLORS
 * ============================================================================= */

/** Roadmap "Discord-meets-FEMA" dark-first palette (dark theme values). */
export const colors = {
  /** Deep navy background scale */
  background: {
    primary: "#0a0f1a",
    secondary: "#111827",
    tertiary: "#1e293b",
  },

  /** Emergency accents */
  accent: {
    primary: "#3b82f6",
    danger: "#ef4444",
    warning: "#f59e0b",
    success: "#10b981",
    purple: "#8b5cf6",
    /** Legacy --accent (sky) — kept for old EOC components */
    sky: "#38bdf8",
  },

  /** Slate text scale */
  text: {
    primary: "#f1f5f9",
    secondary: "#94a3b8",
    muted: "#64748b",
  },

  /** Border scale */
  border: {
    subtle: "#1e293b",
    active: "#3b82f6",
  },

  /** Severity background tints (alert banners / badges) */
  severity: {
    critical: "#7f1d1d",
    warning: "#78350f",
    watch: "#854d0e",
    safe: "#064e3b",
  },

  /** Legacy severity scale (safe/low → critical/evacuate) */
  severityScale: {
    green: {
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
    },
    amber: {
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
    },
    red: {
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
    },
    purple: {
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
    },
  },

  /** Legacy EOC surface palette (kept for backward compatibility) */
  surface: {
    base: "#0f1d38",
    elevated: "#17294d",
    muted: "#0c1830",
  },

  /** Legacy EOC borders */
  borderLegacy: {
    DEFAULT: "#1e3056",
    strong: "#2c3f6d",
  },

  /** Admin / ops-console "panel" family — the single most-used dark surface.
   *  Audited against app/(admin)/**, components/admin/**, components/gov/**,
   *  components/demo/** and the gov/ routes. */
  panel: {
    /** Base panel background */
    DEFAULT: "#0b1120",
    /** Deeper panel (maps, drawers, demo surfaces) */
    deep: "#0d1526",
    /** Darkest header / elevation */
    darker: "#020617",
    /** Row hover */
    hover: "#131b30",
    /** Hover (alt, buttons/toolbar) */
    hoverAlt: "#1a2338",
    /** Default panel border — previously #1c2740 */
    border: "#1c2740",
    /** Elevated / active border — previously #2a3a5c */
    borderStrong: "#2a3a5c",
    /** Focus / hover border — previously #2c3f6d */
    borderHover: "#2c3f6d",
    /** Row dividers — previously #151d31 / #141d33 */
    divide: "#151d31",
    /** Badge / avatar fill */
    chip: "#1a2740",
  },

  /** shadcn/ui semantic tokens (aliased to the roadmap palette) */
  shadcn: {
    card: "#0f1d38",
    cardForeground: "#f1f5f9",
    popover: "#17294d",
    popoverForeground: "#f1f5f9",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#f1f5f9",
    muted: "#111827",
    mutedForeground: "#64748b",
    accentForeground: "#f1f5f9",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    input: "#1e3056",
    ring: "#3b82f6",
  },

  /** SafeSphere AI landing page palette (--dl-* / canonical --navy set) */
  landing: {
    navy: "#0b1f3a",
    navy2: "#0f2a4f",
    navy3: "#132f57",
    blue: "#2563eb",
    blueLight: "#5b8df6",
    orange: "#f97316",
    orangeLight: "#fdba74",
    white: "#ffffff",
    gray: "#f8fafc",
    gray2: "#e7ecf3",
    textDark: "#0f1b2d",
    textMuted: "#5b6b84",
    textOnNavy: "#c9d6ec",
  },

  /** SafeSphere brand palette — GLOBAL twins of the landing scoped vars.
   *  Landing components read the scoped --navy/--blue/--orange names (so the
   *  high-contrast override can neutralize them); everything OUTSIDE the
   *  .landing-page scope uses these globals instead of raw hexes. */
  brand: {
    navy: "#0b1f3a",
    navy2: "#0f2a4f",
    navy3: "#132f57",
    blue: "#2563eb",
    blueLight: "#5b8df6",
    orange: "#f97316",
    orangeLight: "#fdba74",
    white: "#ffffff",
    gray: "#f8fafc",
    gray2: "#e7ecf3",
    textDark: "#0f1b2d",
    textMuted: "#5b6b84",
    textOnNavy: "#c9d6ec",
  },

  /** Light "day ops" palette (active when the `dark` class is absent) */
  light: {
    background: {
      primary: "#f2f6fc",
      secondary: "#ffffff",
      tertiary: "#e9eff8",
    },
    accent: {
      primary: "#2563eb",
      danger: "#dc2626",
      warning: "#d97706",
      success: "#059669",
      purple: "#7c3aed",
      sky: "#0284c7",
    },
    text: {
      primary: "#101b2e",
      secondary: "#475569",
      muted: "#94a3b8",
    },
    border: {
      subtle: "#d4deef",
      active: "#2563eb",
    },
    severity: {
      critical: "#fecaca",
      warning: "#fed7aa",
      watch: "#fef3c7",
      safe: "#d1fae5",
    },
    surface: {
      base: "#ffffff",
      elevated: "#e9eff8",
      muted: "#dfe8f4",
    },
    borderLegacy: {
      DEFAULT: "#d4deef",
      strong: "#b4c3db",
    },
  },
} as const;

/** RGB channel triplets (CSS `r g b`) that mirror the dark palette — feeds the
 *  `rgb(var(--x-rgb) / <alpha>)` pattern so Tailwind opacity modifiers work. */
export const rgbChannels = {
  background: {
    primary: "10 15 26",
    secondary: "17 24 39",
    tertiary: "30 41 59",
  },
  accent: {
    primary: "59 130 246",
    danger: "239 68 68",
    warning: "245 158 11",
    success: "16 185 129",
    purple: "139 92 246",
    sky: "56 189 248",
  },
  text: {
    primary: "241 245 249",
    secondary: "148 163 184",
    muted: "100 116 139",
  },
  border: {
    subtle: "30 41 59",
    active: "59 130 246",
  },
  severity: {
    critical: "127 29 29",
    warning: "120 53 15",
    watch: "133 77 14",
    safe: "6 78 59",
  },
  severityScale: {
    green: {
      300: "110 231 183",
      400: "52 211 153",
      500: "16 185 129",
      600: "5 150 105",
    },
    amber: {
      300: "252 211 77",
      400: "251 191 36",
      500: "245 158 11",
      600: "217 119 6",
    },
    red: {
      300: "252 165 165",
      400: "248 113 113",
      500: "239 68 68",
      600: "220 38 38",
    },
    purple: {
      300: "216 180 254",
      400: "192 132 252",
      500: "168 85 247",
      600: "147 51 234",
    },
  },
  surface: {
    base: "15 29 56",
    elevated: "23 41 77",
    muted: "12 24 48",
  },
  brand: {
    navy: "11 31 58",
    navy2: "15 42 79",
    navy3: "19 47 87",
    blue: "37 99 235",
    blueLight: "91 141 246",
    orange: "249 115 22",
    orangeLight: "253 186 116",
    white: "255 255 255",
    gray: "248 250 252",
    gray2: "231 236 243",
    textDark: "15 27 45",
    textMuted: "91 107 132",
    textOnNavy: "201 214 236",
  },
  borderLegacy: {
    DEFAULT: "30 48 86",
    strong: "44 63 109",
  },
  shadcn: {
    card: "15 29 56",
    cardForeground: "241 245 249",
    popover: "23 41 77",
    popoverForeground: "241 245 249",
    primary: "59 130 246",
    primaryForeground: "255 255 255",
    secondary: "30 41 59",
    secondaryForeground: "241 245 249",
    muted: "17 24 39",
    mutedForeground: "100 116 139",
    accentForeground: "241 245 249",
    destructive: "239 68 68",
    destructiveForeground: "255 255 255",
    input: "30 48 86",
    ring: "59 130 246",
  },
  light: {
    background: {
      primary: "242 246 252",
      secondary: "255 255 255",
      tertiary: "233 239 248",
    },
    accent: {
      primary: "37 99 235",
      danger: "220 38 38",
      warning: "217 119 6",
      success: "5 150 105",
      purple: "124 58 237",
      sky: "2 132 199",
    },
    text: {
      primary: "16 27 46",
      secondary: "71 85 105",
      muted: "148 163 184",
    },
    border: {
      subtle: "212 222 239",
      active: "37 99 235",
    },
    severity: {
      critical: "254 202 202",
      warning: "254 215 170",
      watch: "254 243 199",
      safe: "209 250 229",
    },
    surface: {
      base: "255 255 255",
      elevated: "233 239 248",
      muted: "223 232 244",
    },
    borderLegacy: {
      DEFAULT: "212 222 239",
      strong: "180 195 219",
    },
  },
} as const;

/* =============================================================================
 * SPACING
 * -----------------------------------------------------------------------------
 * The app runs on Tailwind's default spacing scale (steps in px, compiled to
 * rem at 0.25rem steps). `spacing` maps each named step to its px value so TS
 * code can use the exact same rhythm for inline styles, and arbitrary px values
 * in JSX should be migrated to these steps.
 * ============================================================================= */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

/** Layout / component size constants used across the shell (px). */
export const sizes = {
  topBar: 56, // h-14 DashboardTopBar
  navWidth: 256, // w-64 sidebar / drawer
  bottomNav: 72, // bottom nav (72px) + safe-area inset
  touchTarget: 48, // coarse-pointer min-height (buttons)
  touchTargetInput: 44, // coarse-pointer min-height (inputs)
  scrollbar: 10,
} as const;

/* =============================================================================
 * RADIUS
 * -----------------------------------------------------------------------------
 * Roadmap scale (buttons 6 / cards 10 / modals 14 / floating 18). The landing
 * surface uses a slightly larger display scale (12 / 18 / 22 / 26). Chat
 * bubbles use small clipped corners. Legacy EOC = 10px (0.625rem).
 * ============================================================================= */
export const radius = {
  /** Buttons / small controls */
  sm: 6,
  /** Cards / inputs / list items */
  md: 10,
  /** Modals / sheets / larger surfaces */
  lg: 14,
  /** Floating / hero / landing cards */
  xl: 18,
  /** Landing display cards */
  xl2: 22,
  /** Hero / feature showcase cards */
  xl3: 26,
  /** Landing small display cards (--dl-radius-sm) */
  xl4: 12,
  /** Landing mid display cards (audited 16px) */
  xl5: 16,
  /** Landing large display cards (audited 20px) */
  xl6: 20,
  /** Micro widgets (status marks) */
  micro: 2,
  /** Legacy EOC panel radius (0.625rem) */
  eoc: 10,
  /** Chat bubble clipped corner */
  chat: 4,
  /** Mini widgets (status dots, marks) */
  pill: 9999,
} as const;

/** Radius scale in rem strings (what Tailwind utilities actually consume). */
export const radiusRem = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  xl2: "22px",
  xl3: "26px",
  xl4: "12px",
  xl5: "16px",
  xl6: "20px",
  micro: "2px",
  eoc: "0.625rem",
  chat: "4px",
  pill: "9999px",
} as const;

/* =============================================================================
 * SHADOWS & GLOWS
 * ============================================================================= */
export const shadows = {
  /** Default card shadow */
  card: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
  /** Modal / overlay */
  modal: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  /** Roadmap soft glows (no ring) */
  glow: {
    blue: "0 0 20px rgba(59, 130, 246, 0.3)",
    red: "0 0 20px rgba(239, 68, 68, 0.3)",
    amber: "0 0 20px rgba(245, 158, 11, 0.3)",
    purple: "0 0 20px rgba(168, 85, 247, 0.28)",
  },
  /** Legacy EOC ring+glow combos */
  glowLegacy: {
    green: "0 0 0 1px rgba(16, 185, 129, 0.4), 0 0 18px rgba(16, 185, 129, 0.25)",
    amber: "0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.25)",
    red: "0 0 0 1px rgba(239, 68, 68, 0.4), 0 0 18px rgba(239, 68, 68, 0.25)",
    purple: "0 0 0 1px rgba(168, 85, 247, 0.4), 0 0 18px rgba(168, 85, 247, 0.25)",
    sky: "0 0 0 1px rgba(56, 189, 248, 0.4), 0 0 18px rgba(56, 189, 248, 0.25)",
  },
  /** Landing page shadows */
  landing: {
    soft: "0 10px 40px -12px rgba(11, 31, 58, 0.18)",
    glowBlue:
      "0 0 0 1px rgba(37, 99, 235, 0.25), 0 20px 60px -20px rgba(37, 99, 235, 0.45)",
    glowOrange:
      "0 0 0 1px rgba(249, 115, 22, 0.25), 0 20px 60px -20px rgba(249, 115, 22, 0.45)",
  },
  /** Common floating elevation shadows (audited from arbitrary values) */
  floating: {
    sm: "0 2px 12px rgba(0, 0, 0, 0.25)",
    md: "0 8px 24px rgba(0, 0, 0, 0.4)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.5)",
    xl: "0 16px 48px rgba(0, 0, 0, 0.5)",
    xxl: "0 20px 60px rgba(0, 0, 0, 0.6)",
    sheet: "0 -12px 48px rgba(0, 0, 0, 0.6)",
  },
} as const;

/* =============================================================================
 * Z-INDEX SCALE
 * -----------------------------------------------------------------------------
 * Canonical layering order. Everything that stacks should use these steps
 * instead of ad-hoc values (audit found raw 10/20/30/40/50/60/70/80/90/95/96/
 * 999/9998/9999 scattered across 200+ files).
 * ============================================================================= */
export const zIndex = {
  /** Base content */
  base: 0,
  /** Decorative / background layers */
  background: -10,
  /** In-panel stacking (badges, icons over cards) */
  content: 10,
  /** Sticky headers, map controls, mini widgets */
  sticky: 20,
  /** Floating cards / chips / toolbars */
  floating: 30,
  /** Sidebars / nav drawers / context menus */
  nav: 40,
  /** Modals, dropdowns, toasts, top bars */
  overlay: 50,
  /** Full-screen layers (gesture tutorial, update banner, map) */
  screen: 60,
  /** Critical overlays (biometric prompt) */
  critical: 70,
  /** Install prompts */
  install: 80,
  /** Top-most app chrome (PWA sheets, public layout banners) */
  max: 90,
  /** Escape hatch — print overlays, demo HUD (use sparingly) */
  debug: 999,
  /** True top — demo impact HUD */
  hud: 9998,
} as const;

/* =============================================================================
 * ANIMATION DURATIONS
 * ============================================================================= */
export const durations = {
  /** Micro-interactions (hover, focus) */
  instant: 150,
  /** Standard transitions */
  fast: 200,
  /** Default motion */
  base: 300,
  /** Larger surfaces */
  slow: 500,
  /** Toast auto-dismiss */
  toast: 5000,
} as const;

export const animations = {
  pulseRing: "pulse-ring 1.8s ease-in-out infinite",
  flash: "flash 1.6s ease-in-out infinite",
  marquee: "marquee 45s linear infinite",
  alertPulse: "alert-pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  mapAlertFlash: "map-alert-flash 0.3s cubic-bezier(0.4, 0, 0.6, 1) 10",
  agentThink: "agent-think-glow 1.6s ease-in-out infinite",
  skeleton: "skeleton-shimmer 1.6s ease-in-out infinite",
  toastProgress: "toast-progress 5s linear forwards",
  floaty: "floaty 5s ease-in-out infinite",
  dotpulse: "dotpulse 1.6s infinite",
  mpulse: "mpulse 2.2s ease-out infinite",
  orbpulse: "orbpulse 2.4s ease-in-out infinite",
  flowdown: "flowdown 1.8s linear infinite",
  gradientShift: "gradient-shift 6s ease infinite",
  shimmer: "shimmer 2.5s ease-in-out infinite",
} as const;

/* =============================================================================
 * TYPED EXPORT
 * ============================================================================= */
export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type RadiusToken = typeof radius;
export type ShadowToken = typeof shadows;
export type ZIndexToken = typeof zIndex;
export type DurationToken = typeof durations;

/** Convenience accessors for the most common lookups. */
export const token = {
  color: (path: string) => {
    const keys = path.split(".");
    let cur: unknown = colors;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in cur) {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return typeof cur === "string" ? cur : undefined;
  },
} as const;