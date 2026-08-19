"use client";

// ---------------------------------------------------------------------
// components/public/SafetyHero.tsx — Phase 2 · Step 2 · Safety Status
// Hero Card.
//
// A scared citizen needs situational awareness in one glance. This card
// dominates the top of the citizen dashboard (~50% of the viewport) with
// a single massive status readout:
//
//   SAFE     → soft green  · "YOU ARE SAFE"
//   WATCH    → amber       · "STAY VIGILANT"
//   PREPARE  → orange      · "PREPARE TO EVACUATE"
//   EVACUATE → pulsing red · "EVACUATE NOW"
//
// Premium iOS-glass treatment: a deep status-tinted gradient (SAFE uses
// the emerald→teal→navy mesh) under a frosted backdrop-blur shell with
// white hairline border, a big soft colored shadow, and the massive
// headline set in gradient-clipped text. SAFE breathes slowly (soft
// emerald pulse); EVACUATE reuses `.animate-alert-pulse`. Every string
// renders through useTranslation() so the card follows the active
// UI language.
// ---------------------------------------------------------------------

import type { LucideIcon } from "lucide-react";
import { Eye, ShieldCheck, Siren, TriangleAlert } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n/LanguageContext";
import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";

// Re-exported for convenience — the union lives in the data layer so
// hooks/mock data and the card all share one source of truth.
export type { SafetyStatus };

type SafetyHeroProps = {
  /** The district's current risk status. */
  status: SafetyStatus;
  /** Area label shown under the headline, e.g. "Kankarbagh, Patna". */
  area?: string;
  /** Optional last-updated readout (mono, muted) under the area. */
  updatedAt?: string;
};

type StatusTheme = {
  /** i18n key for the massive status headline. */
  headlineKey: TranslationKey;
  /** i18n key for the supporting subline. */
  sublineKey: TranslationKey;
  icon: LucideIcon;
  /** Deep status-tinted gradient over the navy base. */
  gradientClass: string;
  /** Big soft colored glow — pairs with the shell's shadow-2xl. */
  glowShadow: string;
  /** Gradient-clipped headline text. */
  headlineGradient: string;
  /** Icon tile tint (frosted glass base + colored glyph). */
  tileClass: string;
  /** The "STATUS" eyebrow label color. */
  labelClass: string;
  /** Gentle breathing overlay — SAFE gets a slow emerald pulse. */
  breathe?: boolean;
  /** Extra treatment for EVACUATE — the pulsing red. */
  pulseClass?: string;
};

const STATUS_THEMES: Record<SafetyStatus, StatusTheme> = {
  SAFE: {
    headlineKey: "safety_status_safe",
    sublineKey: "safety_status_safe_sub",
    icon: ShieldCheck,
    gradientClass: "bg-gradient-to-br from-emerald-500/20 via-teal-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-emerald-500/10",
    headlineGradient: "bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent",
    tileClass: "bg-white/10 text-severity-green-300 ring-1 ring-white/15",
    labelClass: "text-severity-green-300/80",
    breathe: true,
  },
  WATCH: {
    headlineKey: "safety_status_watch",
    sublineKey: "safety_status_watch_sub",
    icon: Eye,
    gradientClass: "bg-gradient-to-br from-amber-500/20 via-amber-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-amber-500/10",
    headlineGradient: "bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent",
    tileClass: "bg-white/10 text-severity-amber-300 ring-1 ring-white/15",
    labelClass: "text-severity-amber-300/80",
  },
  PREPARE: {
    headlineKey: "safety_status_prepare",
    sublineKey: "safety_status_prepare_sub",
    icon: TriangleAlert,
    gradientClass: "bg-gradient-to-br from-orange-500/20 via-orange-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-orange-500/10",
    headlineGradient: "bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent",
    tileClass: "bg-white/10 text-[#FDBA74] ring-1 ring-white/15",
    labelClass: "text-[#FDBA74]/80",
  },
  EVACUATE: {
    headlineKey: "safety_status_evacuate",
    sublineKey: "safety_status_evacuate_sub",
    icon: Siren,
    gradientClass: "bg-gradient-to-br from-red-500/25 via-red-900/45 to-[#0a0f1a]",
    glowShadow: "shadow-red-500/15",
    headlineGradient: "bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent",
    tileClass: "bg-white/10 text-severity-red-300 ring-1 ring-white/15",
    labelClass: "text-severity-red-300/80",
    pulseClass: "animate-alert-pulse",
  },
};

export function SafetyHero({
  status,
  area = "Kankarbagh, Patna",
  updatedAt,
}: SafetyHeroProps) {
  const { t } = useTranslation();
  const theme = STATUS_THEMES[status];
  const Icon = theme.icon;

  return (
    <section
      role="status"
      aria-label={`${t("safety_status_label")}: ${status}`}
      className={`relative flex min-h-[48vh] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${theme.glowShadow} ${theme.pulseClass ?? ""}`}
    >
      {/* Deep status-tinted gradient mesh */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${theme.gradientClass}`} />

      {/* Soft breathing pulse for SAFE (status-specific). */}
      {theme.breathe && (
        <div
          aria-hidden="true"
          className="sh-breathe pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(at 50% 60%, rgba(45,212,191,0.35) 0px, transparent 60%)",
          }}
        />
      )}

      {/* Soft ambient highlight in the top-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />

      {/* Status eyebrow + icon tile */}
      <div className="relative flex items-start justify-between gap-3">
        <p className={`eoc-label ${theme.labelClass}`}>
          {t("safety_current_status")} · {status}
        </p>
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl backdrop-blur-md ${theme.tileClass}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
      </div>

      {/* Massive status text — gradient-clipped headline in a frosted panel */}
      <div className="relative mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2
          className={`text-balance text-4xl font-black leading-none tracking-tight sm:text-5xl ${theme.headlineGradient}`}
        >
          {t(theme.headlineKey)}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
          {t(theme.sublineKey)}
        </p>
      </div>

      {/* Area + last-updated footer — lighter frosted strip */}
      <div className="relative mt-8 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
        <div>
          <p className="eoc-label text-[var(--dl-text-muted)]">{t("safety_your_area")}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{area}</p>
        </div>
        {updatedAt && (
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--dl-text-muted)]">
            {t("safety_updated")} {updatedAt}
          </p>
        )}
      </div>

      <style>{`
        .sh-breathe {
          animation: sh-breathe 4.5s ease-in-out infinite;
        }
        @keyframes sh-breathe {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
      `}</style>
    </section>
  );
}

export default SafetyHero;