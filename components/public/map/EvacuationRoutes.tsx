"use client";

// ---------------------------------------------------------------------
// components/public/map/EvacuationRoutes.tsx — Phase 4 · Step 5 · Route
// lines from the citizen to a shelter.
//
// When a shelter is selected, draws the mock evacuation route with a very
// thick line (width 6) in two visual states:
//   • Green — safe segments, leading the citizen away from danger.
//   • Red + animated dashes — flooded segments, drawn over the danger
//     zone so the citizen sees exactly where NOT to linger.
//
// A dark casing sits underneath so the red dashes stay readable over the
// red flood fill. The dash animation advances the line-dasharray phase on
// a timer (MapLibre paint-property transition), and is disabled under
// reduced-motion so nothing loops for users who asked for calm.
// ---------------------------------------------------------------------

import { useEffect, useMemo } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";
import { useReducedMotion } from "framer-motion";
import type { CitizenFloodZones } from "@/lib/map/citizen-flood-zones";
import { CITIZEN_SHELTERS } from "@/lib/map/citizen-shelters";
import { buildCitizenEvacuationRoute } from "@/lib/map/citizen-evacuation-route";

/** Base dash pattern — values are multiplied by line-width (6) in px. */
const BASE_DASH = [0.5, 1.75] as const;
const FLOODED_LAYER_ID = "citizen-route-flooded";

type EvacuationRoutesProps = {
  /** Citizen's current location — where every route starts. */
  origin: { lat: number; lng: number };
  /** Binary danger zones — shared with the FloodZones overlay. */
  zones: CitizenFloodZones;
  /** Id of the selected shelter (null → draw nothing). */
  selectedShelterId: string | null;
};

export default function EvacuationRoutes({
  origin,
  zones,
  selectedShelterId,
}: EvacuationRoutesProps) {
  const { current: map } = useMap();
  const reduceMotion = useReducedMotion();

  const route = useMemo(() => {
    const shelter = selectedShelterId
      ? CITIZEN_SHELTERS.find((s) => s.id === selectedShelterId) ?? null
      : null;
    if (!shelter) return null;
    return buildCitizenEvacuationRoute(
      origin.lat,
      origin.lng,
      shelter.lat,
      shelter.lng,
      zones,
    );
  }, [origin, selectedShelterId, zones]);

  // Advance the dash phase so flooded segments visually "flow" away from
  // danger. Guarded on the layer existing (it unmounts with the Source).
  useEffect(() => {
    const mlMap = map?.getMap();
    if (!mlMap || !route || reduceMotion) return;
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
  }, [map, route, reduceMotion]);

  if (!route) return null;

  return (
    <Source id="citizen-evacuation-route" type="geojson" data={route}>
      {/* Dark casing — keeps the colored lines readable over the red fill. */}
      <Layer
        id="citizen-route-casing"
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#0a1120",
          "line-opacity": 0.9,
          "line-width": 8.5,
        }}
      />
      {/* Safe segments — solid green, the path to follow. */}
      <Layer
        id="citizen-route-safe"
        type="line"
        filter={["==", ["get", "flooded"], false]}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#34d399",
          "line-width": 6,
        }}
      />
      {/* Flooded segments — red, dashed, animated away from danger. */}
      <Layer
        id={FLOODED_LAYER_ID}
        type="line"
        filter={["==", ["get", "flooded"], true]}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#ef4444",
          "line-width": 6,
          "line-dasharray": [BASE_DASH[0], BASE_DASH[1]],
        }}
      />
    </Source>
  );
}
