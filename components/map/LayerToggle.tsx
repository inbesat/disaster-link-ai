"use client";

export type LayerVisibility = {
  floodZones: boolean;
  shelters: boolean;
  resources: boolean;
};

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  floodZones: true,
  shelters: true,
  resources: true,
};

const LAYER_OPTIONS: { key: keyof LayerVisibility; label: string }[] = [
  { key: "floodZones", label: "Flood Risk Zones" },
  { key: "shelters", label: "Shelters" },
  { key: "resources", label: "Resources" },
];

type LayerToggleProps = {
  layers: LayerVisibility;
  onChange: (layers: LayerVisibility) => void;
};

export default function LayerToggle({ layers, onChange }: LayerToggleProps) {
  function handleToggle(key: keyof LayerVisibility) {
    onChange({ ...layers, [key]: !layers[key] });
  }

  return (
    <div>
      <p className="eoc-label mb-2">MAP LAYERS</p>
      <div className="space-y-2.5">
        {LAYER_OPTIONS.map(({ key, label }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2.5 transition hover:border-accent"
          >
            <span className="text-sm text-slate-300">{label}</span>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => handleToggle(key)}
              className="h-4 w-4 cursor-pointer accent-accent"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
