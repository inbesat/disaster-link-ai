import {
  CheckCircle2,
  Eye,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------
// components/ui/SeverityBadge.tsx
// UI/UX Phase 1 · Step 3 — roadmap design-system severity indicator.
//
// Each variant maps to the roadmap tokens:
//   • background tint  → var(--severity-*)   (bg-severity-safe / watch / …)
//   • border + text    → var(--accent-*)     (accent-success / warning / …)
//
// Disaster platforms must be usable by colorblind responders (red/green
// deficiency is common), so severity is conveyed through THREE redundant
// channels:
//   1. Color            — tinted chip + accent border/text
//   2. Icon             — ✔ / 👁 / ⚠ / 🛑-style octagon / ℹ
//   3. Text label       — "Safe" / "Watch" / "Warning" / "Evacuate"
// plus a pulsing animation + red glow on the most severe tiers and an
// aria-label for screen readers.
// ---------------------------------------------------------------------

export type SeverityLevel = "safe" | "watch" | "warning" | "critical" | "info";

type SeverityMeta = {
  label: string;
  icon: LucideIcon;
  /** Roadmap tokens: severity-* background tint + accent-* border/text. */
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
    chip: "bg-severity-safe text-accent-success border-accent-success/40",
    dot: "bg-accent-success",
    pulse: false,
    a11y: "safe",
  },
  watch: {
    label: "Watch",
    icon: Eye,
    chip: "bg-severity-watch text-accent-warning border-accent-warning/40",
    dot: "bg-accent-warning",
    pulse: false,
    a11y: "watch",
  },
  warning: {
    label: "Warning",
    icon: TriangleAlert,
    chip: "bg-severity-warning text-accent-danger border-accent-danger/40",
    dot: "bg-accent-danger",
    pulse: true,
    a11y: "warning",
  },
  critical: {
    label: "Evacuate",
    icon: OctagonAlert,
    // glow-red-soft = the roadmap --glow-red; pulses attention via animate-pulse.
    chip: "bg-severity-critical text-accent-danger border-accent-danger/60 glow-red-soft",
    dot: "bg-accent-danger",
    pulse: true,
    a11y: "critical / evacuate",
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
 * color alone. Screen readers hear e.g. "Severity: critical / evacuate".
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
