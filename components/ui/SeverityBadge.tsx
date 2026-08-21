import {
  CheckCircle2,
  Eye,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { severityConfig, type SeverityLevel } from "@/styles/tokens";

// ---------------------------------------------------------------------
// components/ui/SeverityBadge.tsx
// UI/UX Phase 1 · Prompt 1.3 — Standardized severity indicator.
//
// Each variant maps to the SeverityConfig canonical colors:
//   SAFE     = emerald-500 (#10b981)
//   WATCH    = amber-500 (#f59e0b)
//   WARNING  = orange-500 (#f97316)
//   CRITICAL = red-500 (#ef4444) with pulsing animation
//
// Disaster platforms must be usable by colorblind responders (red/green
// deficiency is common), so severity is conveyed through THREE redundant
// channels:
//   1. Color            — tinted chip + border/text
//   2. Icon             — ✔ / 👁 / ⚠ / 🛑-style octagon / ℹ
//   3. Text label       — "Safe" / "Watch" / "Warning" / "Critical"
// plus a pulsing animation on the most severe tiers and an
// aria-label for screen readers.
// ---------------------------------------------------------------------

export type { SeverityLevel };

type SeverityMeta = {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes from SeverityConfig. */
  chip: string;
  dot: string;
  /** Pulsing background draws attention to the dangerous tiers. */
  pulse: boolean;
  /** aria-label suffix read by screen readers. */
  a11y: string;
};

export const SEVERITY_META: Record<SeverityLevel, SeverityMeta> = {
  safe: {
    label: severityConfig.safe.label,
    icon: CheckCircle2,
    chip: `${severityConfig.safe.bg} ${severityConfig.safe.text} ${severityConfig.safe.border}`,
    dot: severityConfig.safe.dot,
    pulse: false,
    a11y: "safe",
  },
  watch: {
    label: severityConfig.watch.label,
    icon: Eye,
    chip: `${severityConfig.watch.bg} ${severityConfig.watch.text} ${severityConfig.watch.border}`,
    dot: severityConfig.watch.dot,
    pulse: false,
    a11y: "watch",
  },
  warning: {
    label: severityConfig.warning.label,
    icon: TriangleAlert,
    chip: `${severityConfig.warning.bg} ${severityConfig.warning.text} ${severityConfig.warning.border}`,
    dot: severityConfig.warning.dot,
    pulse: true,
    a11y: "warning",
  },
  critical: {
    label: severityConfig.critical.label,
    icon: OctagonAlert,
    chip: `${severityConfig.critical.bg} ${severityConfig.critical.text} ${severityConfig.critical.border} glow-red-soft`,
    dot: severityConfig.critical.dot,
    pulse: true,
    a11y: "critical",
  },
  info: {
    label: "Info",
    icon: Info,
    chip: "bg-surface-elevated text-secondary border-border",
    dot: "bg-slate-400",
    pulse: false,
    a11y: "informational",
  },
};

/**
 * Normalize loose severity strings from any data source to the canonical
 * badge levels ("low" → safe, "medium" → watch, "high" → warning,
 * "evacuate" → critical).
 */
export function normalizeSeverity(level: string): SeverityLevel {
  const key = level.trim().toLowerCase();
  if (["safe", "low", "clear"].includes(key)) return "safe";
  if (["watch", "medium", "moderate"].includes(key)) return "watch";
  if (["warning", "high", "warn"].includes(key)) return "warning";
  if (["critical", "evacuate", "danger", "severe"].includes(key)) return "critical";
  if (["info", "informational", "advisory"].includes(key)) return "info";
  return "info";
}

type SeverityBadgeProps = {
  /**
   * Severity variant — loose strings are normalized ("high" → warning).
   * `variant` is the canonical name (UI roadmap); `level` is kept as a
   * backward-compatible alias.
   */
  variant?: string | SeverityLevel;
  /** @deprecated use `variant` — kept for existing callers. */
  level?: string | SeverityLevel;
  /** Override the text label shown next to the icon. */
  label?: string;
  /** Show the leading icon (default true). */
  showIcon?: boolean;
  /** Show the text label (default true). */
  showLabel?: boolean;
  /** Force pulsing on/off regardless of the level default. */
  pulse?: boolean;
  /** Size preset. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Accessible severity badge — color + icon + text so it never relies on
 * color alone. Screen readers hear e.g. "Severity: critical".
 */
export function SeverityBadge({
  variant,
  level,
  label,
  showIcon = true,
  showLabel = true,
  pulse,
  size = "md",
  className = "",
}: SeverityBadgeProps) {
  const meta = SEVERITY_META[normalizeSeverity(variant ?? level ?? "info")] ?? SEVERITY_META.info;
  const Icon = meta.icon;
  const doPulse = pulse ?? meta.pulse;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider ${meta.chip} ${
        doPulse ? "animate-pulse" : ""
      } ${size === "sm" ? "px-2 py-0.5 text-eoc-tiny" : "px-2.5 py-1 text-xs"} ${className}`}
      aria-label={`Severity: ${meta.a11y}`}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />}
      {showLabel && <span>{label ?? meta.label}</span>}
      {/* Color-only fallback dot for extreme low-vision contrast cases */}
      {!showIcon && !showLabel && <span className={`h-2 w-2 rounded-full ${meta.dot}`} />}
    </span>
  );
}

export default SeverityBadge;
