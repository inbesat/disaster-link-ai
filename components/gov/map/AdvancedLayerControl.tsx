"use client";

// ---------------------------------------------------------------------
// components/gov/map/AdvancedLayerControl.tsx — Phase 8 · Step 2.
//
// Collapsible layer control panel floating on the right edge of the Gov
// Map. Accordion-style layer groups with visibility toggles + opacity
// sliders. Premium glassmorphism styling.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  GOV_LAYER_COLORS,
  GOV_LAYER_LABELS,
  GOV_MAP_LAYER_KEYS,
  type GovMapLayerKey,
} from "@/lib/map/gov-map-layers";
import { useGovMapLayers } from "./GovMapLayersContext";

/** Layer groups for accordion organization. */
const LAYER_GROUPS = [
  {
    label: "Hazard Zones",
    layers: ["floodRiskZones"] as GovMapLayerKey[],
  },
  {
    label: "Infrastructure",
    layers: ["shelters", "resourceDepots", "roadClosures"] as GovMapLayerKey[],
  },
  {
    label: "Operations",
    layers: ["evacuationRoutes", "responderPositions"] as GovMapLayerKey[],
  },
  {
    label: "Intelligence",
    layers: ["crowdReports"] as GovMapLayerKey[],
  },
];

export function AdvancedLayerControl() {
  const { reset } = useGovMapLayers();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(LAYER_GROUPS.map((g) => g.label))
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="absolute right-3 top-20 z-50">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show layer controls"
          title="Show layer controls"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#111827]/90 text-blue-400 shadow-2xl backdrop-blur-md transition hover:bg-[#111827] hover:scale-105 active:scale-95"
        >
          <Layers aria-hidden="true" className="h-5 w-5" />
        </button>
      ) : (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="flex max-h-[calc(100vh-7rem)] w-72 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827]/90 shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-blue-400" />
              Data Layers
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                aria-label="Reset layer defaults"
                title="Reset layer defaults"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-[0.97]"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse layer controls"
                title="Collapse layer controls"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-[0.97]"
              >
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Layer groups */}
          <div className="flex-1 overflow-y-auto p-2">
            {LAYER_GROUPS.map((group) => (
              <LayerGroup
                key={group.label}
                label={group.label}
                layers={group.layers}
                isOpen={openGroups.has(group.label)}
                onToggle={() => toggleGroup(group.label)}
              />
            ))}
          </div>

          <footer className="border-t border-white/10 px-4 py-2.5">
            <p className="text-[0.625rem] leading-relaxed text-slate-500">
              Adjust opacity per layer. Flood zones render at half strength
              for readability under route lines.
            </p>
          </footer>
        </motion.aside>
      )}
    </div>
  );
}

/** Accordion group of layers. */
function LayerGroup({
  label,
  layers,
  isOpen,
  onToggle,
}: {
  label: string;
  layers: GovMapLayerKey[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        {label}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <ul className="space-y-0.5 pb-1">
              {layers.map((key) => (
                <LayerRow key={key} layerKey={key} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One layer: name + color dot + toggle switch + opacity slider. */
function LayerRow({ layerKey }: { layerKey: GovMapLayerKey }) {
  const { layers, setLayer, toggleLayer } = useGovMapLayers();
  const state = layers[layerKey];

  return (
    <li className="rounded-lg border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/5">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: GOV_LAYER_COLORS[layerKey],
            opacity: state.visible ? 1 : 0.3,
          }}
          aria-hidden
        />
        <button
          type="button"
          role="switch"
          aria-checked={state.visible}
          onClick={() => toggleLayer(layerKey)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left active:scale-[0.97]"
        >
          <span className="truncate text-[0.8125rem] font-medium text-white/90">
            {GOV_LAYER_LABELS[layerKey]}
          </span>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              state.visible ? "bg-blue-500" : "bg-white/15"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                state.visible ? "left-[22px]" : "left-1"
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
              <Eye aria-hidden="true" className="h-3 w-3 shrink-0 text-slate-500" />
              <input
                type="range"
                min={0}
                max={100}
                value={state.opacity}
                onChange={(event) =>
                  setLayer(layerKey, { opacity: Number(event.target.value) })
                }
                aria-label={`${GOV_LAYER_LABELS[layerKey]} opacity`}
                className="h-1.5 w-full cursor-pointer accent-blue-400"
              />
              <span className="w-9 shrink-0 text-right text-[0.6875rem] font-semibold tabular-nums text-slate-400">
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
