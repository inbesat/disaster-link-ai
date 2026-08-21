import type { CSSProperties } from "react";
import {
  Brain,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  Megaphone,
  Package,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------
// components/gov/ai/AgentCard.tsx — Agent Visual Identity & Status Cards.
//
// A reusable card for one AI agent in the Government Emergency Planner
// swarm. Each card has:
//   • Colored left border (3px) matching agent accent
//   • 32px icon chip with glow
//   • Agent name + status text
//   • Status: Thinking (pulsing dot), Complete (green check), Error (red X)
// ---------------------------------------------------------------------

export type AgentStatus = "idle" | "thinking" | "complete" | "error";

export type AgentAccent = "blue" | "green" | "amber" | "red" | "teal";

export type AgentCardProps = {
  name: string;
  icon: LucideIcon;
  colorAccent: AgentAccent;
  status: AgentStatus;
  latestOutput: string;
  className?: string;
};

const TONES: Record<
  AgentAccent,
  { rgb: string; chip: string; glow: string; border: string; pulse: string }
> = {
  blue: {
    rgb: "59 130 246",
    chip: "bg-blue-500/15 text-blue-400",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]",
    border: "border-l-blue-400",
    pulse: "bg-blue-400",
  },
  green: {
    rgb: "52 211 153",
    chip: "bg-emerald-500/15 text-emerald-400",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.35)]",
    border: "border-l-emerald-400",
    pulse: "bg-emerald-400",
  },
  amber: {
    rgb: "245 158 11",
    chip: "bg-amber-500/15 text-amber-400",
    glow: "shadow-[0_0_16px_rgba(245,158,11,0.35)]",
    border: "border-l-amber-400",
    pulse: "bg-amber-400",
  },
  red: {
    rgb: "239 68 68",
    chip: "bg-red-500/15 text-red-400",
    glow: "shadow-[0_0_16px_rgba(239,68,68,0.35)]",
    border: "border-l-red-400",
    pulse: "bg-red-400",
  },
  teal: {
    rgb: "45 212 191",
    chip: "bg-teal-500/15 text-teal-400",
    glow: "shadow-[0_0_16px_rgba(45,212,191,0.35)]",
    border: "border-l-teal-400",
    pulse: "bg-teal-400",
  },
};

const STATUS_META: Record<
  AgentStatus,
  { label: string; classes: string; icon: LucideIcon; spin?: boolean }
> = {
  idle: {
    label: "Idle",
    classes: "border-white/10 bg-white/[0.06] text-slate-400",
    icon: Clock,
  },
  thinking: {
    label: "Thinking…",
    classes: "border-amber-400/40 bg-amber-400/10 text-amber-400",
    icon: Loader2,
    spin: true,
  },
  complete: {
    label: "Complete",
    classes: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
    icon: CheckCircle2,
  },
  error: {
    label: "Error",
    classes: "border-red-400/40 bg-red-400/10 text-red-400",
    icon: XCircle,
  },
};

export function AgentCard({
  name,
  icon: Icon,
  colorAccent,
  status,
  latestOutput,
  className = "",
}: AgentCardProps) {
  const tone = TONES[colorAccent];
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const thinking = status === "thinking";
  const idle = status === "idle";
  const complete = status === "complete";

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border border-l-4 bg-[#111827] p-3 transition-all duration-300 ${tone.border} ${
        thinking
          ? "agent-thinking-glow border-transparent"
          : idle
            ? "border-white/10 opacity-60"
            : "border-white/10 hover:border-white/20"
      } ${className}`}
      style={thinking ? ({ "--agent-accent-rgb": tone.rgb } as CSSProperties) : undefined}
    >
      {/* 32px icon chip */}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.chip} ${tone.glow}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-white">{name}</h3>
          {/* Status indicator */}
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${meta.classes}`}
          >
            {thinking && (
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tone.pulse} opacity-60`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.pulse}`} />
              </span>
            )}
            {complete && <CheckCircle2 className="h-3 w-3" aria-hidden />}
            {status === "error" && <XCircle className="h-3 w-3" aria-hidden />}
            {idle && <Clock className="h-3 w-3" aria-hidden />}
            {meta.label}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {latestOutput}
        </p>
      </div>
    </div>
  );
}

export type AgentConfig = {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: AgentAccent;
  status: AgentStatus;
  latestOutput: string;
};

/** The five-agent swarm configuration. */
export const EMERGENCY_AGENTS: AgentConfig[] = [
  {
    id: "flood-predictor",
    name: "FloodPredictor",
    icon: Brain,
    accent: "blue",
    status: "thinking",
    latestOutput:
      "Analyzing GLOFAS gauge telemetry — Punpun crossing the 2.5 m warning mark in ~14 h.",
  },
  {
    id: "evacuation-planner",
    name: "EvacuationPlanner",
    icon: Home,
    accent: "green",
    status: "complete",
    latestOutput:
      "Drafted 48 h evacuation plan for Zone A — 412 residents · 2 shelters · NH-01 corridor.",
  },
  {
    id: "resource-allocator",
    name: "ResourceAllocator",
    icon: Package,
    accent: "amber",
    status: "complete",
    latestOutput:
      "Staged 60 transport + 12 ambulances at NH-01 staging; 8 boats dispatched to Punpun ghat.",
  },
  {
    id: "communications-agent",
    name: "CommunicationsAgent",
    icon: Megaphone,
    accent: "red",
    status: "thinking",
    latestOutput:
      "Queueing district-wide SMS + IVR broadcast to 12,400 subscribers in the flood envelope.",
  },
  {
    id: "validator",
    name: "Validator",
    icon: ShieldCheck,
    accent: "teal",
    status: "error",
    latestOutput:
      "Blocked plan v2 — Rampur School shelter capacity over-allocated by 40 berths.",
  },
];

export default AgentCard;
