"use client";

// ---------------------------------------------------------------------
// components/public/map/PublicMapSidebar.tsx — citizen-safe info panel
// for the public map.
//
// Collapsible glass-morphism overlay carrying ONLY read-only, citizen-safe
// widgets (mirroring the public transparency panel — never the gov command
// tools):
//
//   • Map Layers        — Flood Risk Zones / Shelters toggles. State is
//                         owned by the map page and passed down INTO
//                         <PublicMap layerVisibility>, so toggles really
//                         hide/show canvas layers (display filter only —
//                         no writes anywhere).
//   • Severity Legend   — river-level colour key (Low → Critical).
//   • Flood Forecast    — the Actual-vs-Predicted 72h chart, lazy-loaded
//                         (mock series, zero API).
//
// Deliberately EXCLUDED from the gov sidebar this mirrors: Command
// Broadcast, Simulate Critical Alert, Mass Evacuation Planner, Data
// Pipeline Health — those stay strictly behind /gov auth.
// ---------------------------------------------------------------------

import { useState } from "react";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import LayerToggle, { type LayerVisibility } from "@/components/map/LayerToggle";
import PublicFloodChartLazy from "@/components/public/transparency/PublicFloodChartLazy";

/** River-level legend — identical values to PublicTransparencyPanel. */
const SEVERITY_LEGEND = [
  { level: "Critical", dot: "bg-severity-red-400", note: "River ≥ 4.6 m" },
  { level: "High", dot: "bg-severity-amber-400", note: "3.6 – 4.5 m" },
  { level: "Moderate", dot: "bg-severity-purple-400", note: "2.8 – 3.5 m" },
  { level: "Low", dot: "bg-severity-green-400", note: "< 2.8 m" },
];

type PublicMapSidebarProps = {
  layers: LayerVisibility;
  onLayersChange: (layers: LayerVisibility) => void;
};

export default function PublicMapSidebar({
  layers,
  onLayersChange,
}: PublicMapSidebarProps) {
  const [open, setOpen] = useState(false);

  // ── Collapsed: compact glass trigger, top-right under the header ──
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Open map layers and flood info panel"
        className="absolute right-3 top-[88px] z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a1120]/85 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 shadow-lg backdrop-blur-xl transition hover:border-[var(--dl-orange)]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
      >
        <SlidersHorizontal className="h-4 w-4 text-[var(--dl-orange-light)]" aria-hidden />
        Layers &amp; Info
      </button>
    );
  }

  // ── Expanded: scrollable glass panel ──
  return (
    <aside
      role="complementary"
      aria-label="Map layers and flood information"
      className="absolute right-3 top-[88px] z-30 flex max-h-[calc(100dvh-200px)] w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120]/90 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--dl-orange-light)]" aria-hidden />
          </span>
          <p className="text-sm font-bold text-white">Live Map Info</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close map info panel"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Scrollable widget stack */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {/* 1 · Map layers — wired to <PublicMap layerVisibility> */}
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <LayerToggle layers={layers} onChange={onLayersChange} />
          <p className="mt-2 text-[0.625rem] leading-relaxed text-slate-500">
            Toggles instantly show or hide zones and markers on your map.
          </p>
        </section>

        {/* 2 · River severity legend */}
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="mb-2.5 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">
            Severity Legend
          </p>
          <ul className="space-y-2">
            {SEVERITY_LEGEND.map(({ level, dot, note }) => (
              <li key={level} className="flex items-center gap-2.5">
                <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <span className="text-sm font-medium text-slate-200">{level}</span>
                <span className="ml-auto text-xs text-slate-400">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 · Flood forecast trend (Actual vs Predicted) — lazy chart */}
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">
              Flood Forecast Trend
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" aria-hidden />
              Official
            </span>
          </div>
          <PublicFloodChartLazy />
          <p className="mt-1 flex items-center gap-1 text-[0.625rem] text-slate-500">
            <ChevronRight className="h-3 w-3" aria-hidden />
            Central Water Commission · 72-hour outlook
          </p>
        </section>
      </div>
    </aside>
  );
}
