"use client";

// ---------------------------------------------------------------------
// components/gov/map/AdvancedLayerControl.tsx — Phase 8 · Step 2.
//
// Collapsible sidebar floating on the right edge of the Gov Map. Every
// one of the seven operational layers gets a visibility toggle AND a
// 0–100 % opacity slider; both write straight into GovMapLayersContext,
// which the map canvas reads to mount/style each GeoJSON source.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Layers, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  GOV_LAYER_COLORS,
  GOV_LAYER_LABELS,
  GOV_MAP_LAYER_KEYS,
  type GovMapLayerKey,
} from "@/lib/map/gov-map-layers";
import { useGovMapLayers } from "./GovMapLayersContext";

export function AdvancedLayerControl() {
  const { reset } = useGovMapLayers();
  const [collapsed, setCollapsed] = useState(false);

  // Vertical centering lives on this plain wrapper — framer-motion's
  // inline transform would otherwise clobber Tailwind's -translate-y-1/2.
  return (
    <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show layer controls"
          title="Show layer controls"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-panel-deep/85 text-[var(--dl-blue-light)] shadow-[var(--shadow-float-md)] backdrop-blur transition hover:bg-panel-deep hover:scale-105 active:scale-95"
        >
          <Layers aria-hidden="true" className="h-5 w-5" />
        </button>
      ) : (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="flex max-h-[calc(100vh-2rem)] w-72 flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel-deep/90 shadow-[var(--shadow-float-xl)] backdrop-blur-md"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
              Data Layers
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                aria-label="Reset layer defaults"
                title="Reset layer defaults"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse layer controls"
                title="Collapse layer controls"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {/* Layer rows */}
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {GOV_MAP_LAYER_KEYS.map((key) => (
              <LayerRow key={key} layerKey={key} />
            ))}
          </ul>

          <footer className="border-t border-white/10 px-4 py-2.5">
            <p className="text-[0.625rem] leading-relaxed text-[var(--dl-text-muted)]">
              Opacity applies per layer. Flood zones render at half strength
              for readability under route lines.
            </p>
          </footer>
        </motion.aside>
      )}
    </div>
  );
}

/** One layer: name + colour dot + switch + opacity slider. */
function LayerRow({ layerKey }: { layerKey: GovMapLayerKey }) {
  const { layers, setLayer, toggleLayer } = useGovMapLayers();
  const state = layers[layerKey];

  return (
    <li className="rounded-lg border border-transparent px-2 py-1.5 transition hover:border-white/10 hover:bg-white/5">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: GOV_LAYER_COLORS[layerKey], opacity: state.visible ? 1 : 0.3 }}
          aria-hidden
        />
        <button
          type="button"
          role="switch"
          aria-checked={state.visible}
          onClick={() => toggleLayer(layerKey)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <span className="truncate text-[0.8125rem] font-medium text-white/90">
            {GOV_LAYER_LABELS[layerKey]}
          </span>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              state.visible ? "bg-[var(--dl-blue)]" : "bg-white/15"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                state.visible ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {state.visible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1.5 flex items-center gap-2 pr-1">
              <Eye aria-hidden="true" className="h-3 w-3 shrink-0 text-white/40" />
              <input
                type="range"
                min={0}
                max={100}
                value={state.opacity}
                onChange={(event) =>
                  setLayer(layerKey, { opacity: Number(event.target.value) })
                }
                aria-label={`${GOV_LAYER_LABELS[layerKey]} opacity`}
                className="h-1.5 w-full cursor-pointer accent-[var(--dl-blue-light)]"
              />
              <span className="w-9 shrink-0 text-right text-[0.6875rem] font-semibold tabular-nums text-white/70">
                {state.opacity}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default AdvancedLayerControl;
