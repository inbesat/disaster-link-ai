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
// components/gov/ai/AgentCard.tsx — Phase 9 · Step 2 · Agent Visual
// Identity & Status Cards.
//
// A reusable card for one AI agent in the Government Emergency Planner
// swarm. Props: name, icon, colorAccent, status (thinking / complete /
// error) and latestOutput.
//
//   • colorAccent is a closed union (blue | green | amber | red | teal)
//     mapped to a tone table of FULL class strings — never constructed
//     at runtime — so Tailwind's purge keeps every generated utility.
//   • status renders a color-coded pill with a spinner (thinking), a
//     check (complete), a cross (error) or a muted clock (idle).
//   • thinking agents get the .agent-thinking-glow pulsing ring + glow
//     (keyframes in app/globals.css), colored by the inline
//     --agent-accent-rgb var so each agent's accent drives its own glow.
//
// The five-member swarm configuration is exported as EMERGENCY_AGENTS
// so later Phase 9 steps can render the roster with one map() call.
// ---------------------------------------------------------------------

export type AgentStatus = "idle" | "thinking" | "complete" | "error";

export type AgentAccent = "blue" | "green" | "amber" | "red" | "teal";

export type AgentCardProps = {
  /** Display name, e.g. "FloodPredictor". */
  name: string;
  /** Lucide icon marking the agent's specialty. */
  icon: LucideIcon;
  /** Accent key → tone table (drives icon chip, glow and ring color). */
  colorAccent: AgentAccent;
  /** Lifecycle state of the agent's current task. */
  status: AgentStatus;
  /** One-line summary of what the agent last produced. */
  latestOutput: string;
  /** Extra classes merged onto the card root (sizing in grids/pipelines). */
  className?: string;
};

/** Static, purge-safe tone table. `rgb` feeds the --agent-accent-rgb CSS
    var used by the .agent-thinking-glow keyframes (globals.css). */
const TONES: Record<AgentAccent, { rgb: string; chip: string; glow: string }> = {
  blue: {
    rgb: "59 130 246",
    chip: "bg-accent-primary/15 text-accent-primary",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]",
  },
  green: {
    rgb: "52 211 153",
    chip: "bg-severity-green-400/15 text-severity-green-400",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.35)]",
  },
  amber: {
    rgb: "245 158 11",
    chip: "bg-accent-warning/15 text-accent-warning",
    glow: "shadow-[0_0_16px_rgba(245,158,11,0.35)]",
  },
  red: {
    rgb: "239 68 68",
    chip: "bg-accent-danger/15 text-accent-danger",
    glow: "shadow-[0_0_16px_rgba(239,68,68,0.35)]",
  },
  teal: {
    rgb: "45 212 191",
    chip: "bg-teal-400/15 text-teal-300",
    glow: "shadow-[0_0_16px_rgba(45,212,191,0.35)]",
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
    label: "Thinking",
    classes: "border-accent-warning/40 bg-accent-warning/10 text-accent-warning",
    icon: Loader2,
    spin: true,
  },
  complete: {
    label: "Complete",
    classes: "border-accent-success/40 bg-accent-success/10 text-accent-success",
    icon: CheckCircle2,
  },
  error: {
    label: "Error",
    classes: "border-accent-danger/40 bg-accent-danger/10 text-accent-danger",
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

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border bg-secondary p-3 transition-colors ${
        thinking
          ? "border-transparent agent-thinking-glow"
          : idle
            ? "border-white/10 opacity-80"
            : "border-white/10 hover:border-white/20"
      } ${className}`}
      style={thinking ? ({ "--agent-accent-rgb": tone.rgb } as CSSProperties) : undefined}
    >
      {/* Specialty icon chip — tinted in the agent's accent + glow */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.chip} ${tone.glow}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-white">{name}</h3>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.classes}`}
          >
            <StatusIcon
              className={`h-3 w-3 ${meta.spin ? "animate-spin" : ""}`}
              aria-hidden
            />
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

/** The five-agent swarm configuration (Phase 9 · Step 2). */
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
