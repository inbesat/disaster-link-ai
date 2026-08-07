"use client";

import { useState } from "react";
import { SlidersHorizontal, Save } from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------
// components/agents/AgentConfigPanel.tsx
// Admin tuning panel for agent behavior. Controls are local state for the
// hackathon; "Save Directives" simply commits them upward so the orchestration
// request can carry the chosen boundaries.
// ---------------------------------------------------------------------

export type AgentDirectives = {
  predictorSensitivity: number; // 1–100 % — bias toward risk escalation
  hoardingLimitPercent: number; // max % of inventory used without approval
};

type Props = {
  onSave: (directives: AgentDirectives) => void;
  initial?: Partial<AgentDirectives>;
};

export default function AgentConfigPanel({
  onSave,
  initial = {},
}: Props) {
  const [sensitivity, setSensitivity] = useState(
    initial.predictorSensitivity ?? 75,
  );
  const [hoarding, setHoarding] = useState(initial.hoardingLimitPercent ?? 100);

  function save() {
    onSave({ predictorSensitivity: sensitivity, hoardingLimitPercent: hoarding });
    toast.success("Agent directives saved.");
  }

  return (
    <div className="rounded-eoc border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden />
        <p className="eoc-label text-accent">AGENT TUNING · DIRECTIVES</p>
      </div>

      <div className="mt-5 space-y-6">
        {/* Predictor Sensitivity */}
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Predictor Sensitivity
            </span>
            <span className="font-mono text-sm font-black tabular-nums text-accent">
              {sensitivity}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400"
          />
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Higher sensitivity escalates ambiguous weather reports toward HIGH /
            CRITICAL sooner.
          </p>
        </label>

        {/* Resource Hoarding Limit */}
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Resource Hoarding Limit
            </span>
            <span className="font-mono text-sm font-black tabular-nums text-severity-amber-300">
              {hoarding}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={hoarding}
            onChange={(e) => setHoarding(Number(e.target.value))}
            className="mt-2 w-full accent-severity-amber-400"
          />
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Max % of available inventory the Allocator may deploy without
            commander approval. A low cap triggers a conflict when demand
            exceeds it.
          </p>
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow-accent transition hover:bg-sky-300 active:scale-95"
      >
        <Save className="h-4 w-4" aria-hidden />
        Save Directives
      </button>
    </div>
  );
}