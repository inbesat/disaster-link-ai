import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------
// components/ui/SeverityBadge.tsx
// Phase 22 · Step 5 — Accessibility & color-contrast severity status.
//
// Disaster platforms must be usable by colorblind responders (red/green
// deficiency is common). This badge therefore conveys severity through
// THREE redundant channels:
//   1. Color            — green / amber / red / purple / slate
//   2. Icon             — ✔ / 👁 / ⚠ / 🛑-style octagon / ℹ
//   3. Text label       — "Safe" / "Watch" / "Warning" / "Evacuate"
// plus a pulsing background on the highest severities, and an aria-label
// for screen readers. Use it everywhere statuses are rendered.
// ---------------------------------------------------------------------

export type SeverityLevel =
  | "safe"
  | "watch"
  | "warning"
  | "critical"
  | "info";

type SeverityMeta = {
  label: string;
  icon: LucideIcon;
  chip: string;
  dot: string;
  /** Pulsing background draws attention to the dangerous tiers. */
  pulse: boolean;
  /** aria-label suffix read by screen readers. */
  a11y: string;
};

export const SEVERITY_META: Record<SeverityLevel, SeverityMeta> = {
  safe: {
    label: "Safe",
    icon: CheckCircle2,
    chip: "bg-severity-green-600 text-white border-severity-green-500/60",
    dot: "bg-severity-green-500",
    pulse: false,
    a11y: "safe",
  },
  watch: {
    label: "Watch",
    icon: Eye,
    chip: "bg-severity-amber-600 text-slate-950 border-severity-amber-500/60",
    dot: "bg-severity-amber-500",
    pulse: false,
    a11y: "watch",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    chip: "bg-severity-red-600 text-white border-severity-red-500/60",
    dot: "bg-severity-red-500",
    pulse: true,
    a11y: "warning",
  },
  critical: {
    label: "Evacuate",
    icon: AlertOctagon,
    chip: "bg-severity-purple-600 text-white border-severity-purple-500/60",
    dot: "bg-severity-purple-500",
    pulse: true,
    a11y: "critical / evacuate",
  },
  info: {
    label: "Info",
    icon: Info,
    chip: "bg-surface-elevated text-slate-300 border-border",
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
  /** Severity level — loose strings are normalized ("high" → warning). */
  level: string | SeverityLevel;
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
 * color alone. Screen readers hear e.g. "Severity: critical / evacuate".
 */
export function SeverityBadge({
  level,
  label,
  showIcon = true,
  showLabel = true,
  pulse,
  size = "md",
  className = "",
}: SeverityBadgeProps) {
  const meta = SEVERITY_META[normalizeSeverity(level)] ?? SEVERITY_META.info;
  const Icon = meta.icon;
  const doPulse = pulse ?? meta.pulse;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider ${meta.chip} ${
        doPulse ? "animate-pulse" : ""
      } ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${className}`}
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
