"use client";

// ---------------------------------------------------------------------
// components/settings/org/OperationalParamsCard.tsx — Organization (Phase 5 · Step 6).
//
// Global operational automation settings:
//   • Default Shelter Capacity Warning — slider %, warns the Control Room.
//   • Resource Low-Stock Threshold — number input (units per depot).
//   • Auto-Trigger Evacuation Protocol on predicted Level 4 Crisis toggle.
// ---------------------------------------------------------------------

import { AlertTriangle, Crosshair, Home, Layers } from "lucide-react";
import { useOrgSettings } from "@/lib/org-settings-mock";

export default function OperationalParamsCard() {
  const { settings, setParams } = useOrgSettings();
  const capacityWarning = settings.params.shelterCapacityWarning;
  const lowStock = settings.params.resourceLowStockThreshold;
  const autoEvacuation = settings.params.autoEvacuation;

  return (
    <section
      data-settings-key="org-operational-params"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10">
          <Layers className="h-5 w-5 text-fuchsia-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-fuchsia-300/80">PARAMETERS</p>
          <h2 className="mt-0.5 text-lg font-bold">Global Operational Parameters</h2>
        </div>
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <Crosshair className="h-3.5 w-3.5" aria-hidden />
        Applied organisation-wide to every district unless overridden locally.
      </p>

      <div className="mt-6 space-y-6">
        {/* Shelter capacity warning */}
        <div className="rounded-eoc border border-panel-border bg-surface-muted/40 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
              <Home className="h-4 w-4 text-emerald-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Default Shelter Capacity Warning
              </p>
              <p className="text-xs text-slate-500">
                Alert the Control Room when a shelter passes this occupancy
                level.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <input
              id="shelter-capacity-warning"
              type="range"
              min={50}
              max={95}
              step={5}
              value={capacityWarning}
              onChange={(e) =>
                setParams({ shelterCapacityWarning: Number(e.target.value) })
              }
              className="w-full accent-emerald-500"
              aria-label="Default shelter capacity warning level"
            />
            <span className="w-20 shrink-0 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-center font-mono text-sm font-bold text-emerald-200">
              {capacityWarning}%
            </span>
          </div>

          <p
            className={`mt-2 text-[11px] ${
              capacityWarning <= 70
                ? "text-emerald-400"
                : capacityWarning >= 90
                  ? "text-red-300"
                  : "text-slate-400"
            }`}
          >
            {capacityWarning <= 70
              ? "Conservative — early heads-up for field teams."
              : capacityWarning >= 90
                ? "Aggressive — Control Room only notified near full occupancy."
                : "Balanced — aligns with typical NDMA shelter guidance."}
          </p>
        </div>

        {/* Resource low-stock threshold */}
        <div className="rounded-lg border border-panel-border bg-surface-muted/40 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10">
              <Home className="h-4 w-4 text-sky-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Resource Low-Stock Threshold
              </p>
              <p className="text-xs text-slate-500">
                Flag a depot as low when remaining units fall at or below this
                number.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              id="resource-low-stock"
              type="number"
              min={0}
              max={100}
              step={1}
              value={lowStock}
              onChange={(e) =>
                setParams({
                  resourceLowStockThreshold: clamp(
                    Number(e.target.valueAsNumber),
                    0,
                    100,
                  ),
                })
              }
              className="w-28 rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-sky-400/60"
            />
            <span className="text-xs font-semibold text-slate-500">
              units per depot — e.g. min 10 boats per dispatch point
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[2, 10, 25, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setParams({ resourceLowStockThreshold: preset })}
                aria-pressed={lowStock === preset}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                  lowStock === preset
                    ? "border-sky-400/60 bg-sky-500/10 text-sky-200"
                    : "border-panel-border bg-[#0a0f1a] text-slate-400 hover:border-sky-400/40"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-trigger evacuation protocol */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition ${
            autoEvacuation ? "border-red-400/50 bg-red-500/[0.06]" : "border-panel-border bg-surface-muted/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Auto-Trigger Evacuation Protocol
              </p>
              <p className="text-xs text-slate-500">
                When a Level 4 Crisis is predicted, begin evacuations without
                manual approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoEvacuation}
            aria-label="Auto-trigger evacuation protocol on predicted Level 4 crisis"
            onClick={() => setParams({ autoEvacuation: !autoEvacuation })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              autoEvacuation ? "bg-red-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                autoEvacuation ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {autoEvacuation && (
          <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
            INTENSE MODE — evacuations will fire automatically on high-severity
            predictions. Confirm this with the command post.
          </p>
        )}
      </div>

      <p className="mt-5 text-[11px] text-slate-500">
        Changes save instantly and apply organisation-wide — no submit needed.
      </p>
    </section>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}