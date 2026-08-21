"use client";

// ---------------------------------------------------------------------
// components/ai/PlanVisualization.tsx — UI/UX Phase 6 · Step 6.
//
// The right pane. Converts the AI plan into a visual vertical flowchart.
// Each step is a clickable card that expands to show its operational
// detail (ETA, assigned team, notes). Steps are joined by accent-purple
// connector lines, and the whole container is ringed with a soft purple
// glow to signal AI-generated content.
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Clock,
  Radio,
  ShieldCheck,
  Ship,
  Sparkles,
  Users,
} from "lucide-react";
import DataRow from "@/components/ui/DataRow";
import PlanApproval, { type PlanStatus } from "./PlanApproval";

type PlanStep = {
  id: number;
  title: string;
  detailLine: string;
  details: {
    eta: string;
    team: string;
    notes: string;
  };
  icon: typeof Radio;
};

const STEPS: PlanStep[] = [
  {
    id: 1,
    title: "Alert & Broadcast",
    detailLine: "District-wide SMS + siren network",
    details: {
      eta: "12:30 IST",
      team: "District Control Room",
      notes: "Push to 12,400 residents in the Punpun envelope via IVR + cell broadcast.",
    },
    icon: Radio,
  },
  {
    id: 2,
    title: "Evacuate Zone A",
    detailLine: "Sonepur & Rampur low-lying pockets",
    details: {
      eta: "13:00 IST",
      team: "NDRF + 120 volunteers",
      notes:
        "Move along NH-01. Daulatpur bridge approach closed — reroute via staging point.",
    },
    icon: Users,
  },
  {
    id: 3,
    title: "Deploy 15 Boats",
    detailLine: "Punpun ghat → flooded clusters",
    details: {
      eta: "12:45 IST",
      team: "Boat Unit 4",
      notes:
        "60 transport + 12 ambulances staged. Boats split 2-3 per submerged cluster.",
    },
    icon: Ship,
  },
  {
    id: 4,
    title: "Monitor Status",
    detailLine: "Live telemetry & shelter occupancy",
    details: {
      eta: "Continuous",
      team: "Ops Watch",
      notes: "Gauge telemetry refreshes every 5 min; auto-escalation past 3.2 m.",
    },
    icon: Activity,
  },
];

type PlanVisualizationProps = {
  /** Overrides the operations team/ETA shown in each step (future wiring). */
  override?: Partial<Record<number, { eta?: string; team?: string }>>;
};

export function PlanVisualization({ override }: PlanVisualizationProps) {
  const [expanded, setExpanded] = useState<number | null>(1);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("idle");

  const live = planStatus === "monitoring";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-accent-purple/30 bg-secondary p-4 shadow-[0_0_32px_rgba(168,85,247,0.18)]">
      {/* AI-generated plan header */}
      <div className="flex items-center justify-between rounded-lg border border-accent-purple/40 bg-accent-purple/5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-purple" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Live Plan
          </p>
        </div>
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-eoc-tiny font-bold uppercase tracking-wider text-accent-success">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-success"
              aria-hidden
            />
            Monitoring — Plan Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-eoc-tiny font-bold uppercase tracking-wider text-accent-purple">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
              aria-hidden
            />
            AI Generated
          </span>
        )}
      </div>

      {/* Vertical flowchart */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ol className="flex flex-col" aria-label="Emergency plan steps">
          {STEPS.map((step, index) => {
            const isExpanded = expanded === step.id;
            const Icon = step.icon;
            const eta = override?.[step.id]?.eta ?? step.details.eta;
            const team = override?.[step.id]?.team ?? step.details.team;

            return (
              <li key={step.id} className="relative pl-9 pb-1">
                {/* connector line */}
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[15px] top-9 bottom-1 w-0.5 bg-gradient-to-b from-accent-purple to-accent-purple/25"
                  />
                )}

                {/* step node */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-accent-purple bg-accent-purple/15 text-accent-purple"
                >
                  <Icon className="h-4 w-4" />
                </span>

                {/* step card */}
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === step.id ? null : step.id)}
                  aria-expanded={isExpanded}
                  className={`w-full rounded-lg border bg-secondary px-3 text-left transition ${
                    expanded === step.id
                      ? "border-accent-purple/50"
                      : "border-border hover:border-accent-purple/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">
                        {step.id}. {step.title}
                      </p>
                      <p className="truncate text-muted">{step.detailLine}</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                        expanded === step.id ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </div>

                  {isExpanded && (
                    <div className="mb-3 flex flex-col gap-1 rounded-md border border-border bg-[var(--bg-tertiary)]/50 p-3">
                      <DataRow icon={Clock} title={eta} subtitle="ETA" />
                      <DataRow icon={ShieldCheck} title={team} subtitle="Assigned team" />
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {step.details.notes}
                      </p>
                    </div>
                  )}
                </button>

                {/* arrowhead between steps */}
                {index < STEPS.length - 1 && (
                  <span aria-hidden className="mt-2 flex justify-center">
                    <span className="block h-2 w-2 scale-x-50 rotate-45 border-b border-r border-accent-purple/50" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Human-in-the-loop sign-off (Step 8) */}
      <PlanApproval onStatusChange={setPlanStatus} />
    </div>
  );
}

export default PlanVisualization;
