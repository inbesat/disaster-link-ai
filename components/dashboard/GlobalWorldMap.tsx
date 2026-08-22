"use client";

// ---------------------------------------------------------------------
// components/dashboard/GlobalWorldMap.tsx — Global Command Center map.
//
// Full-width section appended below the main dashboard grid. Split layout:
//   Left  (25 %) — dark-mode controls for Hazard Type + Map Layers.
//   Right (75 %) — interactive MapLibre world view centred on the
//                   Europe / North-Africa / South-Asia corridor.
// ---------------------------------------------------------------------

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Globe, Layers, ChevronDown } from "lucide-react";
import Panel from "@/components/ui/Panel";

// MapLibre loaded client-only — same convention as LiveMapCanvas.
const WorldMapCanvas = dynamic(
  () => import("@/components/dashboard/WorldMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[500px] items-center justify-center rounded-lg bg-[#0a0f1a]">
        <p className="text-sm text-slate-500 animate-pulse">Loading world map…</p>
      </div>
    ),
  },
);

// ---------------------------------------------------------------------
// Layer toggle definition
// ---------------------------------------------------------------------
const LAYER_OPTIONS = [
  { id: "flood-risk", label: "Flood Risk Zones", defaultOn: true },
  { id: "shelters", label: "Shelters", defaultOn: true },
  { id: "resources", label: "Resources", defaultOn: false },
] as const;

type LayerId = (typeof LAYER_OPTIONS)[number]["id"];

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
export default function GlobalWorldMap() {
  const [hazardType, setHazardType] = useState("flood");
  const [activeLayers, setActiveLayers] = useState<Record<LayerId, boolean>>({
    "flood-risk": true,
    shelters: true,
    resources: false,
  });

  const toggleLayer = useCallback((id: LayerId) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <section className="mt-6 border-t border-panel-border pt-6">
      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          COMMAND CENTER &bull; GLOBAL
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
          Flood Response
        </h2>
      </div>

      {/* ── Split grid: controls (25 %) + map (75 %) ───────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* ── Left panel: controls ──────────────────────────────────── */}
        <Panel
          className="lg:col-span-1"
          bodyClassName="space-y-5 p-4"
          title={
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <Layers className="h-3.5 w-3.5" aria-hidden />
              Controls
            </span>
          }
        >
          {/* Hazard Type dropdown */}
          <div>
            <label
              htmlFor="hazard-type"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              Hazard Type
            </label>
            <div className="relative">
              <select
                id="hazard-type"
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/30"
              >
                <option value="flood">Flood</option>
                <option value="cyclone">Cyclone</option>
                <option value="earthquake">Earthquake</option>
                <option value="wildfire">Wildfire</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
            </div>
          </div>

          {/* Map Layers checkboxes */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Map Layers
            </p>
            <div className="space-y-2">
              {LAYER_OPTIONS.map((layer) => (
                <label
                  key={layer.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={activeLayers[layer.id]}
                    onChange={() => toggleLayer(layer.id)}
                    className="h-4 w-4 rounded border-white/20 bg-[#0a0f1a] text-amber-400 focus:ring-amber-400/30"
                  />
                  {layer.label}
                </label>
              ))}
            </div>
          </div>

          {/* Active layers summary */}
          <div className="rounded-lg border border-white/5 bg-[#0a0f1a]/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Active Layers
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {LAYER_OPTIONS.filter((l) => activeLayers[l.id]).map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                >
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  {l.label}
                </span>
              ))}
              {LAYER_OPTIONS.every((l) => !activeLayers[l.id]) && (
                <span className="text-[10px] text-slate-600">None</span>
              )}
            </div>
          </div>
        </Panel>

        {/* ── Right panel: world map ────────────────────────────────── */}
        <Panel
          className="lg:col-span-3"
          bodyClassName="relative p-0 h-[500px] sm:h-[560px] lg:h-[600px]"
          title={
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Global View
            </span>
          }
        >
          <WorldMapCanvas
            activeLayers={activeLayers}
            hazardType={hazardType}
          />
        </Panel>
      </div>
    </section>
  );
}
