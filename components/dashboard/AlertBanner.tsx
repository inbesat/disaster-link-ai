import type { FloodRiskLevel } from "@/lib/map/flood-geojson";
import type { DisasterType } from "@/lib/disasters/disaster-types";
import { DISASTER_META } from "@/lib/disasters/disaster-types";

type AlertBannerProps = {
  riskLevel: FloodRiskLevel;
  hours: number;
  disasterType: DisasterType;
};

const TIERS: Record<
  FloodRiskLevel,
  { icon: string; bar: string; textClass: string; pulse: boolean }
> = {
  critical: {
    icon: "⚠️",
    bar: "bg-severity-red-600/90 animate-alert-pulse",
    textClass: "text-white",
    pulse: true,
  },
  high: {
    icon: "⚠️",
    bar: "bg-severity-red-600/80",
    textClass: "text-white",
    pulse: false,
  },
  medium: {
    icon: "🌊",
    bar: "bg-severity-amber-600/70",
    textClass: "text-slate-950",
    pulse: false,
  },
  low: {
    icon: "✅",
    bar: "bg-severity-green-600/70",
    textClass: "text-slate-950",
    pulse: false,
  },
};

export default function AlertBanner({
  riskLevel,
  hours,
  disasterType,
}: AlertBannerProps) {
  const tier = TIERS[riskLevel] ?? TIERS.low;
  const meta = DISASTER_META[disasterType];
  const effectiveHours = Math.max(1, hours);

  const title =
    riskLevel === "critical"
      ? meta.criticalTitle
      : riskLevel === "high"
        ? meta.highTitle
        : riskLevel === "medium"
          ? meta.watchTitle
          : meta.okTitle;

  return (
    <div className="relative z-30 flex w-full items-center justify-center">
      <div
        className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 text-center ${tier.bar}`}
        role="alert"
      >
        <span aria-hidden>{tier.icon}</span>
        <p
          className={`text-xs font-bold uppercase tracking-wider sm:text-sm ${tier.textClass}`}
        >
          {title}: {meta.impactTemplate.replace("{hours}", String(effectiveHours))}
        </p>
      </div>
    </div>
  );
}
