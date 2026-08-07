"use client";

export type ScenarioId = "normal" | "heavy" | "extreme";

// Multiplier applied to the forecast horizon (hours) fed into the
// GeoJSON generator — Extreme also escalates severity one band.
export const SCENARIO_MULTIPLIER: Record<ScenarioId, number> = {
  normal: 1,
  heavy: 1.5,
  extreme: 2,
};

const OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "normal", label: "Normal Rainfall" },
  { id: "heavy", label: "Heavy Downpour (+50%)" },
  { id: "extreme", label: "Extreme Weather (+100%)" },
];

type ScenarioSelectorProps = {
  value: ScenarioId;
  onChange: (value: ScenarioId) => void;
};

export default function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="absolute right-3 top-4 z-20 rounded-eoc border border-border bg-surface/90 p-1 shadow-glow-accent backdrop-blur">
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
              value === option.id
                ? "bg-accent text-slate-950"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
