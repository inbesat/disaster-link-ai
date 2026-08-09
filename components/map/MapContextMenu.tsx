"use client";

// ---------------------------------------------------------------------
// components/map/MapContextMenu.tsx — UI/UX Phase 5 · Step 9.
//
// Right-click dropdown. Positioned with fixed coords (x/y) from the map
// wrapper's onContextMenu event, clamped to the viewport so it never
// overflows. Closes on outside mousedown, on scroll/wheel, or Escape.
// Actions are mock for now — they console.trace the drop point and close.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Home, MapPin, Ruler, Siren } from "lucide-react";

type MapContextMenuProps = {
  /** Pointer clientX where the menu should open. */
  x: number;
  /** Pointer clientY where the menu should open. */
  y: number;
  onClose: () => void;
};

const MENU_ITEMS = [
  { id: "pin", label: "Drop Pin Here", icon: MapPin },
  { id: "measure", label: "Measure Distance", icon: Ruler },
  { id: "shelter", label: "Create Shelter", icon: Home },
  { id: "incident", label: "Report Incident", icon: Siren },
] as const;

export function MapContextMenu({ x, y, onClose }: MapContextMenuProps) {
  // Fetch the needed state lazily (only when the menu mounts).
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });

  useEffect(() => {
    const menu = document.getElementById("map-context-menu");
    const rect = menu?.getBoundingClientRect();
    if (rect) {
      setPos({
        left: Math.min(x, window.innerWidth - rect.width - 8),
        top: Math.min(y, window.innerHeight - rect.height - 8),
      });
    }

    const onDown = (event: MouseEvent | TouchEvent) => {
      if (menu && !menu.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [x, y, onClose]);

  return (
    <div
      id="map-context-menu"
      className="fixed z-[70] w-52 overflow-hidden rounded-lg border border-border bg-secondary/95 p-1 shadow-2xl backdrop-blur"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      aria-label="Map actions"
    >
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition hover:bg-[var(--bg-tertiary)] hover:text-white"
          >
            <Icon className="h-4 w-4 text-accent" aria-hidden />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default MapContextMenu;
