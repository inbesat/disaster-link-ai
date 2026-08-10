"use client";

// ---------------------------------------------------------------------
// components/public/map/RoadClosures.tsx — Phase 4 · Step 7 · Road
// closure indicators.
//
// Citizens need to see blocked paths clearly, so every mock closure
// renders as a distinct barricade marker: a red circle with a 🚧 and a
// small red-X badge. Tapping a marker pops a tiny tooltip above the pin
// — "Road Closed — Route automatically recalculated." — with the reason
// (e.g. "Frazer Road sinkhole") as the title. Tapping the marker again
// (or another closure) moves/ dismisses the tooltip.
//
// Closure coordinates come from CITIZEN_ROAD_CLOSURES
// (lib/map/citizen-road-closures.ts) — the same RoadClosureLike shape
// the gov road-closure tool uses, so live data can drop in later.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Marker } from "react-map-gl/maplibre";
import { X } from "lucide-react";
import { CITIZEN_ROAD_CLOSURES } from "@/lib/map/citizen-road-closures";
import type { RoadClosureLike } from "@/lib/map/road-closures-client";

export default function RoadClosures() {
  // Only one tooltip open at a time; null = all closed.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      {CITIZEN_ROAD_CLOSURES.map((closure) => (
        <RoadClosureMarker
          key={closure.id}
          closure={closure}
          isOpen={closure.id === openId}
          onToggle={() => setOpenId((current) => (current === closure.id ? null : closure.id))}
        />
      ))}
    </>
  );
}

type RoadClosureMarkerProps = {
  closure: RoadClosureLike;
  isOpen: boolean;
  onToggle: () => void;
};

function RoadClosureMarker({ closure, isOpen, onToggle }: RoadClosureMarkerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Marker
      longitude={closure.lng}
      latitude={closure.lat}
      anchor="bottom"
      style={{ zIndex: isOpen ? 10 : undefined }}
    >
      <div className="relative">
        {/* Barricade pin — red circle + red-X badge */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Road closed: ${closure.reason}. Tap for details`}
          aria-expanded={isOpen}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 bg-severity-red-500/90 shadow-[0_4px_14px_rgba(239,68,68,0.45)] transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            isOpen ? "scale-110 border-white ring-2 ring-white/40" : "border-white/30 hover:scale-105"
          }`}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            🚧
          </span>
          {/* Small red-X badge */}
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white ring-1 ring-red-500/40"
          >
            <X className="h-3 w-3 text-red-600" strokeWidth={3.5} />
          </span>
        </button>

        {/* Tiny tooltip above the pin */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="absolute bottom-full left-1/2 mb-2 w-60 -translate-x-1/2 rounded-xl border border-severity-red-500/40 bg-[#0a1120]/95 p-3 text-left shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              {/* Pointing caret */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-severity-red-500/40 bg-[#0a1120]"
              />
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-severity-red-300">
                <span aria-hidden="true" className="text-xs leading-none">
                  🚧
                </span>
                {closure.reason}
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-white">
                Road Closed — Route automatically recalculated.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Marker>
  );
}
