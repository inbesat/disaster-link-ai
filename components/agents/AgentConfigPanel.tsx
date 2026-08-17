"use client";

import { useState } from "react";
import { SlidersHorizontal, Save } from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------
// components/agents/AgentConfigPanel.tsx
// Admin tuning panel for agent behavior. "Save Directives" commits the
// chosen boundaries upward AND persists them to localStorage, so a refresh
// restores the last saved sensitivity / hoarding-limit (B9).
// ---------------------------------------------------------------------

export type AgentDirectives = {
  predictorSensitivity: number; // 1–100 % — bias toward risk escalation
  hoardingLimitPercent: number; // max % of inventory used without approval
};

type Props = {
  onSave: (directives: AgentDirectives) => void;
  initial?: Partial<AgentDirectives>;
};

export const AGENT_DIRECTIVES_STORAGE_KEY = "drip_agent_directives_v1";

const STORAGE_KEY = AGENT_DIRECTIVES_STORAGE_KEY;
const DEFAULTS: AgentDirectives = {
  predictorSensitivity: 75,
  hoardingLimitPercent: 100,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/** Read persisted directives, falling back to the parent's `initial` props. */
function loadDirectives(initial: Partial<AgentDirectives>): AgentDirectives {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgentDirectives>;
        return {
          predictorSensitivity: clamp(
            Number(parsed.predictorSensitivity) || DEFAULTS.predictorSensitivity,
            1,
            100,
          ),
          hoardingLimitPercent: clamp(
            Number(parsed.hoardingLimitPercent) || DEFAULTS.hoardingLimitPercent,
            10,
            100,
          ),
        };
      }
    } catch {
      // Corrupt storage — fall through to defaults.
    }
  }
  return {
    predictorSensitivity: clamp(
      initial.predictorSensitivity ?? DEFAULTS.predictorSensitivity,
      1,
      100,
    ),
    hoardingLimitPercent: clamp(
      initial.hoardingLimitPercent ?? DEFAULTS.hoardingLimitPercent,
      10,
      100,
    ),
  };
}

function persistDirectives(directives: AgentDirectives) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(directives));
  } catch {
    // Storage unavailable — persistence is best-effort.
  }
}

export default function AgentConfigPanel({
  onSave,
  initial = {},
}: Props) {
  const [directives, setDirectives] = useState<AgentDirectives>(() =>
    loadDirectives(initial),
  );
  const sensitivity = directives.predictorSensitivity;
  const hoarding = directives.hoardingLimitPercent;

  function update(next: Partial<AgentDirectives>) {
    const merged = { ...directives, ...next };
    setDirectives(merged);
    persistDirectives(merged);
  }

  function save() {
    onSave(directives);
    persistDirectives(directives);
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
            onChange={(e) => update({ predictorSensitivity: Number(e.target.value) })}
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
            onChange={(e) => update({ hoardingLimitPercent: Number(e.target.value) })}
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