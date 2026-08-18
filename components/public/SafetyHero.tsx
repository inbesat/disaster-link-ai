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
// Visual treatment is a living iOS-weather-style surface instead of a
// flat tint: an animated radial-gradient "mesh" drifts behind the status
// readout (status-specific hues), SAFE breathes slowly (soft emerald
// pulse), EVACUATE reuses the `.animate-alert-pulse` keyframes, and the
// status text sits in a frosted-glass panel (bg-white/10 + backdrop-blur
// + white border) so it reads cleanly over the gradient. A soft colored
// glow lifts the whole card off the dark dashboard. Every string renders
// through useTranslation() so the card follows the active UI language.
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
  /** Animated radial-gradient "mesh" layered over the navy base. */
  meshGradient: string;
  /** Soft colored glow so the card pops off the dark dashboard. */
  glowClass: string;
  /** Icon tile tint (frosted glass base + colored glyph). */
  tileClass: string;
  /** Headline text color. */
  headlineClass: string;
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
    meshGradient: [
      "radial-gradient(at 18% 15%, rgba(16,185,129,0.55) 0px, transparent 55%)",
      "radial-gradient(at 82% 8%, rgba(13,148,136,0.5) 0px, transparent 50%)",
      "radial-gradient(at 65% 85%, rgba(34,211,238,0.4) 0px, transparent 55%)",
      "radial-gradient(at 5% 90%, rgba(5,150,105,0.45) 0px, transparent 50%)",
    ].join(", "),
    glowClass: "shadow-[0_18px_60px_-12px_rgba(16,185,129,0.45)]",
    tileClass: "bg-white/10 text-severity-green-300 ring-1 ring-white/15",
    headlineClass: "text-severity-green-300",
    labelClass: "text-severity-green-300/80",
    breathe: true,
  },
  WATCH: {
    headlineKey: "safety_status_watch",
    sublineKey: "safety_status_watch_sub",
    icon: Eye,
    meshGradient: [
      "radial-gradient(at 20% 15%, rgba(245,158,11,0.55) 0px, transparent 55%)",
      "radial-gradient(at 80% 10%, rgba(217,119,6,0.5) 0px, transparent 50%)",
      "radial-gradient(at 60% 85%, rgba(251,191,36,0.4) 0px, transparent 55%)",
      "radial-gradient(at 8% 90%, rgba(234,88,12,0.4) 0px, transparent 50%)",
    ].join(", "),
    glowClass: "shadow-[0_18px_60px_-12px_rgba(245,158,11,0.4)]",
    tileClass: "bg-white/10 text-severity-amber-300 ring-1 ring-white/15",
    headlineClass: "text-severity-amber-300",
    labelClass: "text-severity-amber-300/80",
  },
  PREPARE: {
    headlineKey: "safety_status_prepare",
    sublineKey: "safety_status_prepare_sub",
    icon: TriangleAlert,
    meshGradient: [
      "radial-gradient(at 18% 12%, rgba(249,115,22,0.55) 0px, transparent 55%)",
      "radial-gradient(at 82% 10%, rgba(234,88,12,0.5) 0px, transparent 50%)",
      "radial-gradient(at 65% 85%, rgba(251,146,60,0.4) 0px, transparent 55%)",
      "radial-gradient(at 5% 92%, rgba(239,68,68,0.35) 0px, transparent 50%)",
    ].join(", "),
    glowClass: "shadow-[0_18px_60px_-12px_rgba(249,115,22,0.45)]",
    tileClass: "bg-white/10 text-[#FDBA74] ring-1 ring-white/15",
    headlineClass: "text-[#FDBA74]",
    labelClass: "text-[#FDBA74]/80",
  },
  EVACUATE: {
    headlineKey: "safety_status_evacuate",
    sublineKey: "safety_status_evacuate_sub",
    icon: Siren,
    meshGradient: [
      "radial-gradient(at 20% 15%, rgba(239,68,68,0.6) 0px, transparent 55%)",
      "radial-gradient(at 80% 10%, rgba(220,38,38,0.55) 0px, transparent 50%)",
      "radial-gradient(at 60% 85%, rgba(248,113,113,0.45) 0px, transparent 55%)",
      "radial-gradient(at 8% 90%, rgba(153,27,27,0.5) 0px, transparent 50%)",
    ].join(", "),
    glowClass: "shadow-[0_18px_60px_-12px_rgba(239,68,68,0.55)]",
    tileClass: "bg-white/10 text-severity-red-300 ring-1 ring-white/15",
    headlineClass: "text-severity-red-300",
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
      className={`relative flex min-h-[48vh] flex-col justify-between overflow-hidden rounded-[var(--dl-radius)] border border-white/10 p-6 transition-colors duration-300 ${theme.glowClass} ${theme.pulseClass ?? ""}`}
    >
      {/* Animated gradient mesh — drifts slowly behind the status text. */}
      <div
        aria-hidden="true"
        className="sh-mesh pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: theme.meshGradient,
          backgroundSize: "300% 300%",
        }}
      />

      {/* Soft breathing emerald pulse for SAFE (status-specific). */}
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

      {/* Massive status text — frosted-glass panel over the gradient mesh */}
      <div className="relative mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2
          className={`text-balance text-4xl font-black leading-none tracking-tight sm:text-5xl ${theme.headlineClass}`}
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
        .sh-mesh {
          animation: sh-mesh-shift 14s ease-in-out infinite;
        }
        @keyframes sh-mesh-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
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