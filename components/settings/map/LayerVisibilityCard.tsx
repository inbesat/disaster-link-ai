"use client";

// ---------------------------------------------------------------------
// components/settings/map/LayerVisibilityCard.tsx — Map & GIS (Phase 3 · Step 3).
//
// Granular layer visibility matrix for /settings/map. A grid of styled
// toggle switches grouped logically:
//
//   Hazards   → Flood Risk Zones · Road Closures · Evacuation Routes
//   Assets    → Shelter Locations · Resource Depots · Responder Positions
//   Field Intel → Crowdsourced Reports
//
// Helper hint nudges field operators to trim layers on low-end devices,
// and the "Reset to Default Tactical View" button restores the standard
// command-center configuration (hazards + assets + intel on by default,
// evacuation routes only when the planner opts in).
//
// Fully controlled by useMapSettings — the layered map re-renders the
// instant any toggle is flipped.
// ---------------------------------------------------------------------

import {
  AlertTriangle,
  Droplets,
  FolderGit2,
  MapPinned,
  RotateCcw,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { MapLayerPreferences } from "@/lib/settings/map-settings";

type LayerToggleMeta = {
  key: keyof MapLayerPreferences;
  label: string;
  description: string;
  icon: typeof Droplets;
};

type LayerGroup = {
  key: string;
  label: string;
  blurb: string;
  layers: LayerToggleMeta[];
};

const LAYER_GROUPS: LayerGroup[] = [
  {
    key: "hazards",
    label: "HAZARDS",
    blurb: "Active threat & planning layers",
    layers: [
      {
        key: "floodZones",
        label: "Flood Risk Zone",
        description: "Predicted inundation polygons by severity.",
        icon: Droplets,
      },
      {
        key: "roadClosures",
        label: "Road & Evacuation Closures",
        description: "Blocked corridors from field + AI sourcing.",
        icon: AlertTriangle,
      },
      {
        key: "evacRoutes",
        label: "Evacuation Routes",
        description: "Planned mass-evacuation paths…",
        icon: MapPinned,
      },
    ],
  },
  {
    key: "assets",
    label: "ASSETS & PERSONNEL",
    blurb: "Deployable resources & responder positions",
    layers: [
      {
        key: "shelters",
        label: "Shelter Locations",
        description: "Registered relief shelters with live capacity.",
        icon: Shield,
      },
      {
        key: "resources",
        label: "Resource Depot",
        description: "Boats, pumps, sandbags, medicine stockpiles.",
        icon: Truck,
      },
      {
        key: "responderPositions",
        label: "Responder Positions",
        description: "Live GPS markers of field teams.",
        icon: Users,
      },
    ],
  },
  {
    key: "intel",
    label: "FIELD INTEL",
    blurb: "Crowdsourced ground truth",
    layers: [
      {
        key: "groundReports",
        label: "Crowdsourced Reports",
        description: "Verified citizen flood reports from the field.",
        icon: FolderGit2,
      },
    ],
  },
];

export default function LayerVisibilityCard() {
  const { settings, update } = useMapSettings();
  const layers = settings.layers;

  function toggle(key: keyof MapLayerPreferences) {
    update({ layers: { ...layers, [key]: !layers[key] } });
  }

  function resetToDefault() {
    update({
      layers: {
        floodZones: true,
        shelters: true,
        resources: true,
        evacRoutes: false,
        responderPositions: true,
        roadClosures: true,
        groundReports: true,
      },
    });
  }

  const activeCount = Object.values(layers).filter(Boolean).length;
  const total = Object.keys(layers).length;

  return (
    <section
      data-settings-key="map-layers"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <LayersIcon />
        </div>
        <div className="flex-1">
          <p className="eoc-label text-cyan-300/80">DATA OVERLAYS</p>
          <h2 className="mt-0.5 text-lg font-bold">Layer Visibility</h2>
        </div>
        <span className="rounded-md border border-panel-border bg-surface-muted/60 px-2.5 py-1 text-xs text-cyan-300">
          {activeCount}/{total} active
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Choose which tactical overlays load on the map by default. All layers
        can still be toggled live in the command center.
      </p>

      {/* Grouped toggles */}
      <div className="mt-5 space-y-5">
        {LAYER_GROUPS.map((group) => (
          <div key={group.key} role="gridcell">
            <div className="flex items-center justify-between gap-2">
              <p className="eoc-label text-slate-500">{group.label}</p>
              <span className="text-[10px] uppercase tracking-wider text-slate-600">
                {group.blurb}
              </span>
            </div>
            <div className="mt-2 space-y-2.5">
              {group.layers.map(({ key, label, description, icon: Icon }) => {
                const on = layers[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between gap-4 rounded-md border p-3 transition ${
                      on
                        ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                        : "border-panel-border bg-surface-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                          on ? "bg-cyan-500/15" : "bg-slate-500/10"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            on ? "text-cyan-300" : "text-slate-500"
                          }`}
                          aria-hidden
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`Toggle ${label}`}
                      onClick={() => toggle(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        on ? "bg-cyan-500" : "bg-[#2c3f6d]"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          on ? "translate-x-[22px]" : "-translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Helper hint */}
      <p className="mt-5 flex items-start gap-2 rounded-md border border-panel-border bg-surface-muted/40 p-3 text-[11px] leading-relaxed text-slate-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
        Turn off unnecessary layers to improve map performance on low-end field
        devices.
      </p>

      {/* Reset */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          If you get lost in the overlay, restore the standard setup.
        </p>
        <button
          type="button"
          onClick={resetToDefault}
          className="inline-flex items-center gap-2 rounded-md border border-panel-borderHover bg-[#0a0f1d] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset to Default Tactical View
        </button>
      </div>
    </section>
  );
}

function LayersIcon() {
  // A small stacked-layers glyph for the header tile.
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-cyan-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}