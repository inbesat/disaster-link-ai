"use client";

// ---------------------------------------------------------------------
// components/gov/map/LegendPanel.tsx — Prompt 10.3
//
// Collapsible legend panel floating bottom-left of the Gov Map.
// Color key for flood zones + icon key for shelters, resources,
// routes, responders. Premium glassmorphism styling.
// ---------------------------------------------------------------------

import { X, MapPin } from "lucide-react";

type LegendPanelProps = {
  onClose: () => void;
};

const FLOOD_ZONES = [
  { color: "#10b981", label: "Safe", description: "No flood risk" },
  { color: "#f59e0b", label: "Watch", description: "Monitor conditions" },
  { color: "#f97316", label: "Warning", description: "Prepare to evacuate" },
  { color: "#ef4444", label: "Critical", description: "Immediate danger" },
];

const MAP_ICONS = [
  { color: "#10b981", icon: "🏠", label: "Shelter" },
  { color: "#f59e0b", icon: "📦", label: "Resource Depot" },
  { color: "#22d3ee", icon: "🛣️", label: "Evacuation Route" },
  { color: "#8b5cf6", icon: "Responder", label: "Responder Position" },
  { color: "#ef4444", icon: "🚧", label: "Road Closure" },
  { color: "#f472b6", icon: "📢", label: "Crowd Report" },
];

export function LegendPanel({ onClose }: LegendPanelProps) {
  return (
    <div className="absolute bottom-16 left-4 z-50 w-64 rounded-xl border border-white/10 bg-[#111827]/90 p-4 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white">Map Legend</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legend"
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-[0.97]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Flood Risk Zones */}
      <div className="mt-3">
        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-500">
          Flood Risk Zones
        </p>
        <ul className="mt-1.5 space-y-1">
          {FLOOD_ZONES.map((zone) => (
            <li key={zone.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-xs font-medium text-white/80">{zone.label}</span>
              <span className="text-[0.625rem] text-slate-500">— {zone.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-white/10" />

      {/* Map Icons */}
      <div>
        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-500">
          Map Icons
        </p>
        <ul className="mt-1.5 space-y-1">
          {MAP_ICONS.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center">
                {item.icon === "Responder" ? (
                  <MapPin className="h-3.5 w-3.5" style={{ color: item.color }} />
                ) : (
                  <span className="text-xs">{item.icon}</span>
                )}
              </span>
              <span className="text-xs font-medium text-white/80">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-white/10 pt-2">
        <p className="text-[0.5625rem] text-slate-500">
          Legend auto-updates based on active layers
        </p>
      </div>
    </div>
  );
}

export default LegendPanel;
