"use client";

// ---------------------------------------------------------------------
// components/gov/map/MapContextMenu.tsx — Phase 8 · Step 6 ·
// Right-Click Context Menu.
//
// An absolutely-positioned tactical menu that appears where the commander
// right-clicks the map. It receives the cursor's pixel position (x, y —
// relative to the map container) plus the lng/lat under the cursor, and
// offers four instant actions:
//   • Drop Alert Pin
//   • Create Shelter Here
//   • Mark Road Closed
//   • Dispatch Team to Coordinate
//
// Actions are mock-synced (console.log + toast) standing in for the real
// incident-create flow — the same pattern as the draw annotations. The
// menu clamps itself inside the viewport, closes on Escape or any
// left-click (the canvas clears the state in onClick).
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { Ban, MapPin, Navigation, Tent } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export type ContextMenuState = {
  x: number;
  y: number;
  lng: number;
  lat: number;
};

type MapContextMenuProps = ContextMenuState & {
  onClose: () => void;
};

type MenuAction = {
  id: string;
  label: string;
  hint: string;
  icon: typeof MapPin;
  tone: string;
};

const ACTIONS: MenuAction[] = [
  {
    id: "alert-pin",
    label: "Drop Alert Pin",
    hint: "Publish to citizen app",
    icon: MapPin,
    tone: "text-[var(--dl-blue-light)]",
  },
  {
    id: "shelter",
    label: "Create Shelter Here",
    hint: "Register capacity + team",
    icon: Tent,
    tone: "text-severity-green-300",
  },
  {
    id: "road-closed",
    label: "Mark Road Closed",
    hint: "Block for navigation",
    icon: Ban,
    tone: "text-severity-red-300",
  },
  {
    id: "dispatch",
    label: "Dispatch Team to Coordinate",
    hint: "Assign nearest responder unit",
    icon: Navigation,
    tone: "text-severity-purple-300",
  },
];

export function MapContextMenu({ x, y, lng, lat, onClose }: MapContextMenuProps) {
  const toast = useToast();

  // Escape closes the menu (the canvas also closes it on any left-click).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const runAction = (action: MenuAction) => {
    const coord = `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
    console.log(`[map-action] ${action.label} @ ${coord}`);
    toast.success({
      title: `${action.label}`,
      description: `${action.hint} at ${coord}.`,
    });
    onClose();
  };

  // Clamp inside the viewport (client-only context — always rendered
  // inside the ssr:false map, so `window` is safe here).
  const left = Math.max(8, Math.min(x, window.innerWidth - 224));
  const top = Math.max(8, Math.min(y, window.innerHeight - 248));

  return (
    <div
      role="menu"
      aria-label="Map actions"
      className="absolute z-40 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0d1526]/95 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      style={{ left, top }}
    >
      <p className="border-b border-white/10 px-3.5 py-2 font-mono text-[0.625rem] tabular-nums text-white/40">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </p>

      <ul className="py-1.5">
        {ACTIONS.map((action) => (
          <li key={action.id}>
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(action)}
              className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition hover:bg-white/10 active:bg-white/15"
            >
              <action.icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${action.tone}`} />
              <span className="min-w-0">
                <span className="block text-[0.8125rem] font-semibold text-white">
                  {action.label}
                </span>
                <span className="block truncate text-[0.625rem] text-white/40">{action.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MapContextMenu;
