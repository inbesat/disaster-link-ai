"use client";

import { useColorblindMode } from "@/components/providers/ColorblindContext";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Circle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

// ---------------------------------------------------------------------
// components/ui/AccessibleStatusBadge.tsx — Phase 17 · Step 3.
//
// Status badge that works for colorblind users:
//   • Normal mode: color + icon
//   • Colorblind mode: blue/orange palette + pattern background + shape icon
//
// Status types:
//   safe     → blue circle pattern + CheckCircle2
//   warning  → orange diagonal stripes + AlertTriangle
//   danger   → orange solid + XCircle
//   info     → blue solid + Info
//   neutral  → gray + Circle
// ---------------------------------------------------------------------

type StatusLevel = "safe" | "warning" | "danger" | "info" | "neutral";

type StatusConfig = {
  normal: string;
  colorblind: string;
  icon: React.ReactNode;
  cbIcon: React.ReactNode;
  label: string;
};

const STATUS_MAP: Record<StatusLevel, StatusConfig> = {
  safe: {
    normal: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    colorblind: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    icon: <CheckCircle2 size={14} />,
    cbIcon: <ShieldCheck size={14} />,
    label: "Safe",
  },
  warning: {
    normal: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    colorblind: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
    icon: <AlertTriangle size={14} />,
    cbIcon: <AlertTriangle size={14} />,
    label: "Warning",
  },
  danger: {
    normal: "bg-red-500/15 text-red-400 border border-red-500/20",
    colorblind: "bg-orange-500/20 text-orange-200 border border-orange-400/30",
    icon: <XCircle size={14} />,
    cbIcon: <ShieldAlert size={14} />,
    label: "Danger",
  },
  info: {
    normal: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
    colorblind: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    icon: <Info size={14} />,
    cbIcon: <Info size={14} />,
    label: "Info",
  },
  neutral: {
    normal: "bg-white/5 text-slate-400 border border-white/10",
    colorblind: "bg-white/5 text-slate-400 border border-white/10",
    icon: <Circle size={14} />,
    cbIcon: <Circle size={14} />,
    label: "Neutral",
  },
};

// Colorblind pattern SVGs as inline styles
const CB_PATTERNS: Record<string, string> = {
  safe: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='4' r='2' fill='%233b82f6' opacity='0.3'/%3E%3C/svg%3E")`,
  warning: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8L8 0' stroke='%23f97316' stroke-width='1.5' opacity='0.4'/%3E%3C/svg%3E")`,
  danger: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23f97316' opacity='0.15'/%3E%3C/svg%3E")`,
};

type AccessibleStatusBadgeProps = {
  status: StatusLevel;
  label?: string;
  className?: string;
};

export function AccessibleStatusBadge({
  status,
  label,
  className = "",
}: AccessibleStatusBadgeProps) {
  const { colorblindMode } = useColorblindMode();
  const config = STATUS_MAP[status] ?? STATUS_MAP.neutral;

  const displayLabel = label ?? config.label;
  const style = colorblindMode ? config.colorblind : config.normal;
  const icon = colorblindMode ? config.cbIcon : config.icon;

  // Apply pattern background in colorblind mode
  const patternBg = colorblindMode && CB_PATTERNS[status]
    ? { backgroundImage: CB_PATTERNS[status] }
    : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style} ${className}`}
      style={patternBg}
      role="status"
    >
      <span aria-hidden="true">{icon}</span>
      {displayLabel}
    </span>
  );
}

// ---------------------------------------------------------------------
// SeverityBadge — for severity levels (minor/moderate/severe/critical)
// Maps to colorblind-safe blue/orange palette
// ---------------------------------------------------------------------

type SeverityLevel = "minor" | "moderate" | "severe" | "critical";

const SEVERITY_MAP: Record<SeverityLevel, StatusLevel> = {
  minor: "info",
  moderate: "warning",
  severe: "warning",
  critical: "danger",
};

type SeverityBadgeProps = {
  severity: SeverityLevel;
  className?: string;
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <AccessibleStatusBadge
      status={SEVERITY_MAP[severity]}
      label={severity.charAt(0).toUpperCase() + severity.slice(1)}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------
// SafetyStatusBadge — for Safe/Watch/Prepare/Evacuate
// ---------------------------------------------------------------------

type SafetyStatus = "SAFE" | "WATCH" | "PREPARE" | "EVACUATE";

const SAFETY_MAP: Record<SafetyStatus, StatusLevel> = {
  SAFE: "safe",
  WATCH: "info",
  PREPARE: "warning",
  EVACUATE: "danger",
};

type SafetyStatusBadgeProps = {
  status: SafetyStatus;
  className?: string;
};

export function SafetyStatusBadge({ status, className }: SafetyStatusBadgeProps) {
  return (
    <AccessibleStatusBadge
      status={SAFETY_MAP[status]}
      label={status}
      className={className}
    />
  );
}

export default AccessibleStatusBadge;
