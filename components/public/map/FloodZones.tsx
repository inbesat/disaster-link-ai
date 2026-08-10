"use client";

// ---------------------------------------------------------------------
// components/public/map/FloodZones.tsx — Phase 4 · Step 3 · Binary flood
// zone overlay.
//
// Citizens don't need to know water depth; they just need to know "Am I
// in danger?". So this renders the danger polygons with a single BINARY
// style: solid semi-transparent red fill (bg-red-500/40 equivalent) with
// a crisp red boundary. There are deliberately NO amber/yellow zones on
// the public map — if it's not red, it's implicitly safe.
//
// The polygons come from generateCitizenFloodZones() (lib/map/
// citizen-flood-zones.ts), computed once in PublicMap and passed down so
// the route renderer can reuse the exact same shapes.
// ---------------------------------------------------------------------

import { Layer, Source } from "react-map-gl/maplibre";
import type { CitizenFloodZones } from "@/lib/map/citizen-flood-zones";

/** bg-red-500/40, as a MapLibre paint color. */
const DANGER_FILL = "rgba(239, 68, 68, 0.40)";
/** Crisp boundary so the zone edge stays readable on the dark base. */
const DANGER_BORDER = "rgba(248, 113, 113, 0.85)";

export default function FloodZones({ zones }: { zones: CitizenFloodZones }) {
  return (
    <Source id="citizen-flood-zones" type="geojson" data={zones}>
      <Layer
        id="citizen-flood-fill"
        type="fill"
        paint={{
          "fill-color": DANGER_FILL,
          "fill-outline-color": DANGER_BORDER,
        }}
      />
      <Layer
        id="citizen-flood-line"
        type="line"
        paint={{
          "line-color": DANGER_BORDER,
          "line-width": 1.5,
        }}
      />
    </Source>
  );
}
