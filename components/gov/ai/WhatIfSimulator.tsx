"use client";

// ---------------------------------------------------------------------
// components/gov/ai/WhatIfSimulator.tsx — Phase 9 · Step 8 · "What-If"
// Scenario Simulator.
//
// A collapsible panel in the right pane that lets officials stress-test
// the AI plan before executing it:
//
//   • Rainfall Intensity slider (+0…100%) and Shelter Capacity slider
//     (-0…50%) plus a "Simulate Bridge Collapse" toggle.
//   • "Re-run AI Planner" — dispatches PLANNER_RERUN_EVENT so the
//     OrchestrationFlow pipeline cascades again, and surfaces a "Delta
//     Alert" banner (e.g. "Route changed due to bridge collapse") above
//     the regenerated plan.
//
// The delta banner is rendered below the panel (directly above the
// PlanVisualizer in the right pane) and stays until dismissed or the
// scenario re-runs.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CloudRain,
  FlaskConical,
  Home,
  Loader2,
  Play,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { PLANNER_RERUN_EVENT } from "./OrchestrationFlow";

type Delta = { id: string; message: string };

export function WhatIfSimulator() {
  const [open, setOpen] = useState(true);
  const [rainfall, setRainfall] = useState(50);
  const [shelterCut, setShelterCut] = useState(20);
  const [bridgeDown, setBridgeDown] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [running, setRunning] = useState(false);
  const runningTimer = useRef<number | null>(null);

  // Clear the re-run busy timer if the panel unmounts mid-run.
  useEffect(() => {
    return () => {
      if (runningTimer.current !== null) window.clearTimeout(runningTimer.current);
    };
  }, []);

  const handleRerun = () => {
    if (running) return;

    const next: Delta[] = [];
    if (bridgeDown) {
      next.push({
        id: "bridge",
        message:
          "Route changed due to bridge collapse — Daulatpur bridge offline, rerouting via NH-01 staging.",
      });
    }
    if (rainfall > 0) {
      next.push({
        id: "rain",
        message: `Rainfall +${rainfall}% — evacuation window shortened to 4 h.`,
      });
    }
    if (shelterCut > 0) {
      next.push({
        id: "shelter",
        message: `Shelter capacity -${shelterCut}% — 260 evacuees reassigned to Shelter D.`,
      });
    }
    if (next.length === 0) {
      next.push({
        id: "recalc",
        message: "Plan recalculated under current scenario — no material deltas.",
      });
    }

    setDeltas(next);
    setRunning(true);
    // Re-run the swarm pipeline (Step 8 → Step 3 loop).
    window.dispatchEvent(new CustomEvent(PLANNER_RERUN_EVENT));
    runningTimer.current = window.setTimeout(() => setRunning(false), 2600);
  };

  return (
    <section className="shrink-0 rounded-xl border border-white/10 bg-panel-deep">
      {/* Panel header (collapsible) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="whatif-controls"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span>
            <span className="block text-xs font-bold uppercase tracking-wider text-white">
              What-If Scenario Simulator
            </span>
            <span className="block text-[0.625rem] uppercase tracking-wider text-muted">
              Stress-test the plan before execution
            </span>
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* Controls */}
      {open && (
        <div
          id="whatif-controls"
          className="flex flex-col gap-2.5 border-t border-white/10 px-3 py-3 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Rainfall Intensity */}
          <label className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-[0.6875rem] font-semibold text-slate-300">
              <CloudRain className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Rainfall
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              aria-label="Rainfall intensity increase"
              className="w-full accent-accent-purple"
            />
            <span className="w-10 shrink-0 text-right font-mono text-[0.6875rem] font-bold tabular-nums text-accent-warning">
              +{rainfall}%
            </span>
          </label>

          {/* Shelter Capacity */}
          <label className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-[0.6875rem] font-semibold text-slate-300">
              <Home className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Shelter
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={shelterCut}
              onChange={(e) => setShelterCut(Number(e.target.value))}
              aria-label="Shelter capacity reduction"
              className="w-full accent-accent-purple"
            />
            <span className="w-10 shrink-0 text-right font-mono text-[0.6875rem] font-bold tabular-nums text-severity-amber-300">
              -{shelterCut}%
            </span>
          </label>

          {/* Simulate Bridge Collapse */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-slate-300">
              <TriangleAlert
                className={`h-3.5 w-3.5 shrink-0 ${bridgeDown ? "text-accent-danger" : "text-muted"}`}
                aria-hidden
              />
              Simulate Bridge Collapse
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={bridgeDown}
              aria-label="Simulate Bridge Collapse"
              onClick={() => setBridgeDown((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                bridgeDown ? "bg-accent-danger" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  bridgeDown ? "translate-x-5" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>

          {/* Re-run AI Planner */}
          <button
            type="button"
            onClick={handleRerun}
            disabled={running}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-purple px-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-accent-purple/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Re-running…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden />
                Re-run AI Planner
              </>
            )}
          </button>
        </div>
      )}

      {/* Delta Alert — above the (re)generated plan */}
      {deltas.length > 0 && (
        <div className="flex items-start gap-2.5 border-t border-accent-danger/30 bg-accent-danger/10 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-accent-danger"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[0.625rem] font-black uppercase tracking-wider text-accent-danger">
              Delta Alert
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {deltas.map((delta) => (
                <li key={delta.id} className="text-[0.6875rem] leading-relaxed text-slate-200">
                  {delta.message}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setDeltas([])}
            aria-label="Dismiss delta alert"
            className="shrink-0 rounded p-1 text-slate-400 transition hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      {/* Slim footer readout */}
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[0.5625rem] font-bold uppercase tracking-wider text-muted">
          <SlidersHorizontal className="h-3 w-3" aria-hidden />
          Scenario parameters
        </span>
        <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-muted">
          {bridgeDown ? "Bridge offline" : "All routes nominal"}
        </span>
      </div>
    </section>
  );
}

export default WhatIfSimulator;
