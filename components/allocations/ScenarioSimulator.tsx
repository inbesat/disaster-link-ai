"use client";

import { useState } from "react";

export default function ScenarioSimulator({
  onRecalculate,
  unmetGap,
  baselineGap,
  running,
}: {
  onRecalculate: (fleetAvailability: number, demandSurge: number) => void;
  unmetGap: number | null;
  baselineGap: number | null;
  running: boolean;
}) {
  const [fleet, setFleet] = useState(100);
  const [surge, setSurge] = useState(0);

  const delta = unmetGap !== null && baselineGap !== null ? unmetGap - baselineGap : null;

  return (
    <div className="rounded-eoc border border-border bg-surface p-5">
      <p className="eoc-label text-accent">WHAT-IF SIMULATOR</p>
      <h2 className="mt-1 font-bold">Scenario Testing</h2>

      {/* Fleet availability slider */}
      <label className="mt-4 block">
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Available Fleet Availability</span>
          <span className="tabular-nums text-accent">{fleet}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={fleet}
          onChange={(e) => setFleet(Number(e.target.value))}
          className="mt-2 w-full accent-sky-400"
        />
      </label>

      {/* Demand surge slider */}
      <label className="mt-4 block">
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Demand Surge Spike</span>
          <span className="tabular-nums text-accent">+{surge}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={200}
          step={10}
          value={surge}
          onChange={(e) => setSurge(Number(e.target.value))}
          className="mt-2 w-full accent-sky-400"
        />
      </label>

      <button
        type="button"
        disabled={running}
        onClick={() => onRecalculate(fleet, surge)}
        className="mt-5 w-full rounded-lg border border-accent/60 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-accent transition hover:bg-accent/20 active:scale-95 disabled:opacity-50"
      >
        {running ? "Recalculating…" : "Recalculate Scenario"}
      </button>

      {unmetGap !== null && (
        <div className="mt-4 rounded-lg border border-border bg-surface-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Unmet Demand Gap
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-severity-red-400">
            {unmetGap} units
          </p>
          {delta !== null && delta > 0 && (
            <p className="mt-0.5 text-xs font-semibold text-severity-red-400">
              ▲ +{delta} vs baseline
            </p>
          )}
          {delta !== null && delta <= 0 && (
            <p className="mt-0.5 text-xs font-semibold text-severity-green-400">
              No increase vs baseline
            </p>
          )}
        </div>
      )}
    </div>
  );
}
