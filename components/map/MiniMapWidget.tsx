"use client";

// ---------------------------------------------------------------------
// components/map/MiniMapWidget.tsx — UI/UX Phase 5 · Step 8.
//
// Picture-in-Picture mini-map: a small square overview (desktop only) that
// sits above the Quick Actions dock in the bottom-right corner. Shows a
// zoomed-out static basemap with a red rectangle representing the main
// map's current viewport. A toggle folds it back into a small pill.
// ---------------------------------------------------------------------

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPinned, X } from "lucide-react";

const MiniMapCanvas = dynamic(() => import("@/components/map/MiniMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-800" aria-hidden />,
});

export function MiniMapWidget({ className = "" }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <div className={`${className}`}>
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated/95 px-3 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:border-accent hover:text-accent"
        >
          <MapPinned className="h-4 w-4 text-accent" aria-hidden />
          Overview Map
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="relative">
        {/* Toggle — collapses into the pill above */}
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Hide overview map"
          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-surface-elevated text-slate-200 shadow transition hover:border-accent hover:text-accent"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>

        {/* Square minimap */}
        <div className="relative h-48 w-48 overflow-hidden rounded-lg border-2 border-white/20 shadow-xl shadow-black/40">
          <MiniMapCanvas />

          {/* Current viewport indicator */}
          <div
            className="pointer-events-none absolute left-[30%] top-[35%] z-10 h-[30%] w-[40%] rounded-sm border-2 border-red-500/90"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

export default MiniMapWidget;
