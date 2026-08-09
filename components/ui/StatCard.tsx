// ---------------------------------------------------------------------
// components/ui/StatCard.tsx
// UI/UX Phase 1 · Step 4 — dashboard KPI card.
//
// Roadmap tokens:
//   • surface  → --bg-secondary   (bg-secondary)
//   • corners  → --radius-md      (rounded-md = 10px)
//   • label    → text-sm text-muted
//   • value    → text-3xl bold tabular-nums
//   • trend    → up (accent-success) / down (accent-danger) / flat
// Hover: a gentle lift (-translate-y) with an increased shadow.
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";

export type StatTrendDirection = "up" | "down" | "flat";

type StatCardProps = {
  /** Short KPI label, e.g. "People at Risk". */
  label: string;
  /** The big headline number. Numbers render with Indian grouping (47,230). */
  value?: string | number;
  /** Trend text, e.g. "+12%". */
  trend?: string;
  /** Which way the trend reads — colors the arrow + percentage. */
  trendDirection?: StatTrendDirection;
  /**
   * Override the trend color. Useful when "up" is bad (e.g. people at risk
   * rising) — pass e.g. "text-accent-danger" to flag it red.
   */
  trendClassName?: string;
  /** Optional leading icon shown in a tinted square. */
  icon?: LucideIcon;
  /**
   * Override the headline value entirely (e.g. a colored "CRITICAL" with a
   * pulsing dot). When set, `value`/`valueClassName` are ignored.
   */
  valueNode?: ReactNode;
  /** Override the value text color — e.g. "text-accent-danger" for risk. */
  valueClassName?: string;
  /** Small muted line rendered under the trend row. */
  subtitle?: ReactNode;
  /** Thin occupancy bar under the value (fraction → percentage width). */
  progress?: {
    value: number;
    max: number;
    /** Width/height color classes — defaults to the secondary fg. */
    colorClass?: string;
  };
  className?: string;
};

const TREND_META: Record<StatTrendDirection, { icon: LucideIcon; color: string }> = {
  up: { icon: TrendingUp, color: "text-accent-success" },
  down: { icon: TrendingDown, color: "text-accent-danger" },
  flat: { icon: Minus, color: "text-muted" },
};

/**
 * Dashboard KPI card — large number, label and trend indicator on the
 * roadmap --bg-secondary surface with a subtle hover lift.
 */
export function StatCard({
  label,
  value,
  trend,
  trendDirection = "up",
  trendClassName,
  icon: Icon,
  valueNode,
  valueClassName,
  subtitle,
  progress,
  className = "",
}: StatCardProps) {
  const trendMeta = TREND_META[trendDirection] ?? TREND_META.flat;
  const TrendIcon = trendMeta.icon;
  const displayedValue =
    typeof value === "number" ? value.toLocaleString("en-IN") : (value ?? "");

  return (
    <div
      className={`rounded-md border border-subtle bg-secondary p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-tertiary text-secondary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>

      {valueNode ?? (
        <p
          className={`mt-2 text-3xl font-bold tabular-nums leading-none ${
            valueClassName ?? "text-primary"
          }`}
        >
          {displayedValue}
        </p>
      )}

      {progress && (
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tertiary"
          role="progressbar"
          aria-valuenow={progress.value}
          aria-valuemin={0}
          aria-valuemax={progress.max}
          aria-label={`${progress.value} of ${progress.max}`}
        >
          <div
            className={`h-full rounded-full ${
              progress.colorClass ?? "bg-accent-primary"
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, (progress.value / progress.max) * 100))}%`,
            }}
          />
        </div>
      )}

      {trend && (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
            trendClassName ?? trendMeta.color
          }`}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden />
          {trend}
        </p>
      )}

      {subtitle && <p className="mt-1.5 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

export default StatCard;
