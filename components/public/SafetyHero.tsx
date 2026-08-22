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
import { severityConfig } from "@/styles/tokens";

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
    gradientClass: "bg-gradient-to-b from-emerald-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
    headlineGradient: "text-emerald-400",
    tileClass: "bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    labelClass: "text-emerald-400/80",
    breathe: true,
  },
  WATCH: {
    headlineKey: "safety_status_watch",
    sublineKey: "safety_status_watch_sub",
    icon: TriangleAlert,
    gradientClass: "bg-gradient-to-b from-amber-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
    headlineGradient: "text-amber-400",
    tileClass: "bg-amber-500/15 ring-1 ring-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    labelClass: "text-amber-400/80",
  },
  PREPARE: {
    headlineKey: "safety_status_prepare",
    sublineKey: "safety_status_prepare_sub",
    icon: TriangleAlert,
    gradientClass: "bg-gradient-to-b from-orange-900/40 to-[#0a0f1a]",
    glowShadow: "shadow-[0_0_40px_rgba(249,115,22,0.2)]",
    headlineGradient: "text-orange-400",
    tileClass: "bg-orange-500/15 ring-1 ring-orange-500/30 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    labelClass: "text-orange-400/80",
  },
  EVACUATE: {
    headlineKey: "safety_status_evacuate",
    sublineKey: "safety_status_evacuate_sub",
    icon: Siren,
    gradientClass: "bg-gradient-to-b from-red-900/60 to-[#0a0f1a]",
    glowShadow: "shadow-[0_0_60px_rgba(239,68,68,0.3)]",
    headlineGradient: "text-red-500",
    tileClass: "bg-red-500/20 ring-1 ring-red-500/40 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]",
    labelClass: "text-red-400",
    pulseClass: "animate-pulse-red",
  },
};

export function SafetyHero({
  status,
  area = "Kankarbagh, Patna",
  updatedAt,
}: SafetyHeroProps) {
  // Safe fallbacks for optional props
  const safeArea = area ?? "Kankarbagh, Patna";
  const safeUpdatedAt = updatedAt ?? undefined;
  const { t } = useTranslation();
  const theme = STATUS_THEMES[status];
  const Icon = theme.icon;

  return (
    <section
      role="status"
      aria-label={`${t("safety_status_label")}: ${status}`}
      className={`relative flex min-h-[60vh] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500 ${theme.glowShadow} ${theme.pulseClass ?? ""}`}
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
              "radial-gradient(at 50% 60%, rgba(45,212,191,0.4) 0px, transparent 60%)",
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
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl backdrop-blur-md ${theme.tileClass}`}
        >
          <Icon className="h-8 w-8" strokeWidth={1.5} />
        </span>
      </div>

      {/* Massive status text — gradient-clipped headline in a frosted panel */}
      <div className="relative mt-8 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2
          className={`text-balance text-4xl font-extrabold leading-none tracking-tight sm:text-5xl ${theme.headlineGradient}`}
        >
          {t(theme.headlineKey)}
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">
          {t(theme.sublineKey)}
        </p>
      </div>

      {/* Area + last-updated footer — lighter frosted strip */}
      <div className="relative mt-8 flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div>
          <p className="eoc-label text-slate-400">{t("safety_your_area")}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{safeArea}</p>
        </div>
        {safeUpdatedAt && (
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            {t("safety_updated")} {safeUpdatedAt}
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
        .animate-pulse-red {
          animation: pulse-red 2s ease-in-out infinite;
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 80px rgba(239, 68, 68, 0.5); }
        }
      `}</style>
    </section>
  );
}

export default SafetyHero;