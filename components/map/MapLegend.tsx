"use client";

// ---------------------------------------------------------------------
// components/map/MapLegend.tsx — UI/UX Phase 5 · Step 3.
//
// Small floating legend pinned bottom-left. Two sections:
//   • Flood Severity — swatches matching DisasterMap's zone fill colors
//     (they mirror the severity-green/amber/red/purple-500 theme tokens),
//   • Points of Interest — shelter / resource / roadblock icons.
// Minimize (-) folds the card into a "Legend" pill to free screen space.
// ---------------------------------------------------------------------

import { useState } from "react";
import { Construction, Home, Layers, Minus, Truck } from "lucide-react";

type SeveritySwatch = { label: string; swatchClass: string };

const SEVERITY_SWATCHES: SeveritySwatch[] = [
  { label: "Safe", swatchClass: "bg-severity-green-500" },
  { label: "Watch", swatchClass: "bg-severity-amber-500" },
  { label: "Warning", swatchClass: "bg-severity-red-500" },
  { label: "Critical", swatchClass: "bg-severity-purple-500" },
];

function Divider() {
  return <div className="my-2.5 h-px bg-border" aria-hidden />;
}

export function MapLegend({ className = "" }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className={className}>
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/95 px-3 py-2.5 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:border-accent hover:text-accent active:scale-[0.97]"
          >
            <Layers className="h-4 w-4 text-accent" aria-hidden />
            Legend
          </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <section
        className="w-52 rounded-lg border border-border bg-secondary/95 p-3.5 shadow-card backdrop-blur"
        aria-label="Map legend"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Map Legend
          </h3>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Minimize map legend"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted transition hover:border-accent hover:text-accent active:scale-[0.97]"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Flood Severity
        </h4>
        <ul className="mt-2 flex flex-col gap-1.5">
          {SEVERITY_SWATCHES.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${s.swatchClass}`}
                aria-hidden
              />
              <span className="text-xs text-slate-200">{s.label}</span>
            </li>
          ))}
        </ul>

        <Divider />

        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Points of Interest
        </h4>
        <ul className="mt-2 flex flex-col gap-2">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-severity-green-600/20 text-severity-green-400">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs text-slate-300">Shelter</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-severity-amber-600/20 text-severity-amber-400">
              <Truck className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs text-slate-300">Resource</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-danger/20 text-accent-danger">
              <Construction className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs text-slate-300">Roadblock</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default MapLegend;
