"use client";

// ---------------------------------------------------------------------
// components/map/LayerControl.tsx — UI/UX Phase 5 · Step 2.
//
// Floating collapsible layer panel pinned top-right below the map header.
// The three data layers that DisasterMap actually renders are controlled
// (and lifted to the parent); evacuation routes + road closures are future
// layers that simply hold their own local switch state today. Flood Risk
// Zones additionally exposes an opacity slider.
// ---------------------------------------------------------------------

import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Layers } from "lucide-react";
import Panel from "@/components/ui/Panel";
import IconButton from "@/components/ui/IconButton";
import type { LayerVisibility } from "./LayerToggle";

type LayerControlProps = {
  /** Current map layer visibility — lifted so DisasterMap shares it. */
  layers: LayerVisibility;
  onLayersChange: (layers: LayerVisibility) => void;
  /** Positioning classes, e.g. "absolute right-3 top-16 z-10". */
  className?: string;
};

type ExtraLayer = "evacuationRoutes" | "roadClosures";

const EXTRA_LAYERS: { key: ExtraLayer; label: string }[] = [
  { key: "evacuationRoutes", label: "Evacuation Routes" },
  { key: "roadClosures", label: "Road Closures" },
];

function LayerRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-[var(--bg-tertiary)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated">
        {checked ? (
          <Eye className="h-3.5 w-3.5 text-accent" aria-hidden />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted" aria-hidden />
        )}
      </span>
      <span className="flex-1">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent-primary" : "bg-tertiary"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function LayerControl({
  layers,
  onLayersChange,
  className = "",
}: LayerControlProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [extra, setExtra] = useState<Record<ExtraLayer, boolean>>({
    evacuationRoutes: false,
    roadClosures: false,
  });
  const [opacity, setOpacity] = useState(65);

  const toggleLayer = (key: keyof LayerVisibility) =>
    onLayersChange({ ...layers, [key]: !layers[key] });

  const toggleExtra = (key: ExtraLayer) =>
    setExtra((prev) => ({ ...prev, [key]: !prev[key] }));

  if (collapsed) {
    return (
      <div className={className}>
        <IconButton
          label="Show map layers"
          size="md"
          variant="floating"
          onClick={() => setCollapsed(false)}
        >
          <Layers className="h-5 w-5" aria-hidden />
        </IconButton>
      </div>
    );
  }

  return (
    <Panel
      className={`w-72 ${className}`}
      title={
        <span className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" aria-hidden />
          <span>Layers</span>
        </span>
      }
      action={
        <IconButton
          label="Collapse layers panel"
          size="sm"
          variant="ghost"
          onClick={() => setCollapsed(true)}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </IconButton>
      }
      bodyClassName="max-h-[65vh] overflow-y-auto p-2"
    >
      <div className="flex flex-col">
        <LayerRow
          label="Flood Risk Zones"
          checked={layers.floodZones}
          onToggle={() => toggleLayer("floodZones")}
        />

        {/* Indented opacity slider under Flood Risk Zones */}
        <div className="ml-7 pb-1 pr-3">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Layer Opacity</span>
            <span className="tabular-nums">{opacity}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            aria-label="Flood layer opacity"
            className="h-1.5 w-full cursor-pointer accent-[#3b82f6]"
          />
        </div>

        <LayerRow
          label="Active Shelters"
          checked={layers.shelters}
          onToggle={() => toggleLayer("shelters")}
        />
        <LayerRow
          label="Deployed Resources"
          checked={layers.resources}
          onToggle={() => toggleLayer("resources")}
        />

        {EXTRA_LAYERS.map(({ key, label }) => (
          <LayerRow
            key={key}
            label={label}
            checked={extra[key]}
            onToggle={() => toggleExtra(key)}
          />
        ))}
      </div>
    </Panel>
  );
}

export default LayerControl;
