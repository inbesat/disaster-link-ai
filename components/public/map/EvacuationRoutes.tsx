"use client";

// ---------------------------------------------------------------------
// components/public/map/EvacuationRoutes.tsx — Phase 1 · Step 9 · Graded
// evacuation route lines.
//
// Draws the mock evacuation route from decide's citizen location to the
// selected shelter, coloured segment-by-segment by the Route Safety
// engine (lib/map/route-safety.ts). Each segment carries one of four
// hazards:
//   • safe    — solid green, the path to follow.
//   • watch   — amber, danger within ~1.5 km: be alert.
//   • flooded — red + animated dashes, drawn over the flood zone:
//               don't linger.
//   • closed  — black over a grey casing: blocked by a road closure.
//
// A dark casing sits underneath, and a lighter grey casing is drawn only
// under closed segments so the near-black closed line stays visible on
// the dark basemap. The dash animation on flooded segments is disabled
// under reduced-motion.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";
import { useReducedMotion } from "framer-motion";
import type { FilterSpecification } from "maplibre-gl";
import { ROUTE_HAZARD_COLORS, type RouteSafetyClassification } from "@/lib/map/route-safety";

/** Base dash pattern — values are multiplied by line-width (6) in px. */
const BASE_DASH = [0.5, 1.75] as const;
const FLOODED_LAYER_ID = "citizen-route-flooded";

/** PWD accessible route — bright blue (distinct from green safe route). */
const PWD_ROUTE_COLOR = "#3b82f6"; // bright blue

type EvacuationRoutesProps = {
  /** Pre-computed per-segment safety grading (null → draw nothing). */
  classification: RouteSafetyClassification | null;
  /** PWD mode — render route in bright blue and show accessibility badge. */
  isPwd?: boolean;
};

export default function EvacuationRoutes({ classification, isPwd = false }: EvacuationRoutesProps) {
  const { current: map } = useMap();
  const reduceMotion = useReducedMotion();

  // Advance the dash phase so flooded segments visually "flow" away from
  // danger. Guarded on the layer existing (it unmounts with the Source).
  useEffect(() => {
    const mlMap = map?.getMap();
    if (!mlMap || !classification || reduceMotion) return;
    let step = 0;
    const timer = window.setInterval(() => {
      if (!mlMap.getLayer(FLOODED_LAYER_ID)) return;
      step = (step + 1) % 6;
      mlMap.setPaintProperty(FLOODED_LAYER_ID, "line-dasharray", [
        BASE_DASH[0] + step,
        BASE_DASH[1],
      ]);
    }, 160);
    return () => window.clearInterval(timer);
  }, [map, classification, reduceMotion]);

  if (!classification) return null;

  const data = { type: "FeatureCollection" as const, features: classification.features };
  const closedFilter: FilterSpecification = ["==", ["get", "hazard"], "closed"];
  const safeFilter: FilterSpecification = ["==", ["get", "hazard"], "safe"];
  const watchFilter: FilterSpecification = ["==", ["get", "hazard"], "watch"];
  const floodedFilter: FilterSpecification = ["==", ["get", "hazard"], "flooded"];

  return (
    <Source id="citizen-evacuation-route" type="geojson" data={data}>
      {/* Dark casing — keeps all colored lines readable over the red fill. */}
      <Layer
        id="citizen-route-casing"
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#0a1120",
          "line-opacity": 0.9,
          "line-width": 9,
        }}
      />
      {/* Grey casing under closed segments so the near-black line shows. */}
      <Layer
        id="citizen-route-closed-casing"
        type="line"
        filter={closedFilter}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#9ca3af",
          "line-opacity": 0.95,
          "line-width": 9,
        }}
      />
      {/* Safe — solid green (or bright blue for PWD), the path to follow. */}
      <Layer
        id="citizen-route-safe"
        type="line"
        filter={safeFilter}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": isPwd ? PWD_ROUTE_COLOR : ROUTE_HAZARD_COLORS.safe,
          "line-width": isPwd ? 7 : 6,
        }}
      />
      {/* Watch — amber (or lighter blue for PWD), near danger but passable. */}
      <Layer
        id="citizen-route-watch"
        type="line"
        filter={watchFilter}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": isPwd ? "#60a5fa" : ROUTE_HAZARD_COLORS.watch,
          "line-width": isPwd ? 7 : 6,
        }}
      />
      {/* Flooded — red, dashed, animated away from danger. */}
      <Layer
        id={FLOODED_LAYER_ID}
        type="line"
        filter={floodedFilter}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": ROUTE_HAZARD_COLORS.flooded,
          "line-width": 6,
          "line-dasharray": [BASE_DASH[0], BASE_DASH[1]],
        }}
      />
      {/* Closed — blocked by a road closure, rendered over the grey casing. */}
      <Layer
        id="citizen-route-closed"
        type="line"
        filter={closedFilter}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": ROUTE_HAZARD_COLORS.closed,
          "line-width": 6,
        }}
      />
    </Source>
  );
}