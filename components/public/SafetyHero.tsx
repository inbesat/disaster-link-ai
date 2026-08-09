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
// Statuses map onto the design system's severity scale (--severity-*
// tokens with rgb-alpha support in tailwind.config.ts) so the tints
// re-theme in day-ops mode. EVACUATE additionally reuses the existing
// `.animate-alert-pulse` keyframes from globals.css for the pulsing
// treatment. The card is a server-safe pure component — no state, no
// effects — so it renders with the page and never flashes.
// ---------------------------------------------------------------------

import type { LucideIcon } from "lucide-react";
import { Eye, ShieldCheck, Siren, TriangleAlert } from "lucide-react";
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
  headline: string;
  subline: string;
  icon: LucideIcon;
  /** Card background + border tint (severity tokens re-theme in day-ops). */
  cardClass: string;
  /** Icon tile tint. */
  tileClass: string;
  /** Headline text color. */
  headlineClass: string;
  /** The "STATUS" eyebrow label color. */
  labelClass: string;
  /** Extra treatment for EVACUATE — the pulsing red. */
  pulseClass?: string;
};

const STATUS_THEMES: Record<SafetyStatus, StatusTheme> = {
  SAFE: {
    headline: "YOU ARE SAFE",
    subline: "No active threat in your area. Stay alert and keep your phone charged.",
    icon: ShieldCheck,
    cardClass: "border-severity-green-500/30 bg-severity-green-500/10",
    tileClass: "bg-severity-green-500/20 text-severity-green-300",
    headlineClass: "text-severity-green-300",
    labelClass: "text-severity-green-300/80",
  },
  WATCH: {
    headline: "STAY VIGILANT",
    subline: "Conditions are being monitored. Keep your family circle updated.",
    icon: Eye,
    cardClass: "border-severity-amber-500/40 bg-severity-amber-500/10",
    tileClass: "bg-severity-amber-500/20 text-severity-amber-300",
    headlineClass: "text-severity-amber-300",
    labelClass: "text-severity-amber-300/80",
  },
  PREPARE: {
    headline: "PREPARE TO EVACUATE",
    subline: "Flooding is likely. Pack essentials and know your nearest shelter route.",
    icon: TriangleAlert,
    cardClass: "border-[#F97316]/40 bg-[#F97316]/10",
    tileClass: "bg-[#F97316]/20 text-[#FDBA74]",
    headlineClass: "text-[#FDBA74]",
    labelClass: "text-[#FDBA74]/80",
  },
  EVACUATE: {
    headline: "EVACUATE NOW",
    subline:
      "Move to higher ground or the nearest shelter immediately. Do not wait.",
    icon: Siren,
    cardClass: "border-severity-red-500/50 bg-severity-red-500/15",
    tileClass: "bg-severity-red-500/25 text-severity-red-300",
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
  const theme = STATUS_THEMES[status];
  const Icon = theme.icon;

  return (
    <section
      role="status"
      aria-label={`Safety status: ${status}`}
      className={`relative flex min-h-[48vh] flex-col justify-between overflow-hidden rounded-[var(--dl-radius)] border p-6 shadow-[var(--dl-shadow-soft)] transition-colors duration-300 ${theme.cardClass} ${theme.pulseClass ?? ""}`}
    >
      {/* Soft ambient glow inside the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl"
      />

      {/* Status eyebrow + icon tile */}
      <div className="relative flex items-start justify-between gap-3">
        <p className={`eoc-label ${theme.labelClass}`}>CURRENT STATUS · {status}</p>
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.tileClass}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
      </div>

      {/* Massive status text */}
      <div className="relative mt-8">
        <h2
          className={`text-balance text-4xl font-black leading-none tracking-tight sm:text-5xl ${theme.headlineClass}`}
        >
          {theme.headline}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
          {theme.subline}
        </p>
      </div>

      {/* Area + last-updated footer */}
      <div className="relative mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="eoc-label text-[var(--dl-text-muted)]">YOUR AREA</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{area}</p>
        </div>
        {updatedAt && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--dl-text-muted)]">
            UPD {updatedAt}
          </p>
        )}
      </div>
    </section>
  );
}

export default SafetyHero;
