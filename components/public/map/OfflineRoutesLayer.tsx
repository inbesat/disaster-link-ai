"use client";

// ---------------------------------------------------------------------
// components/public/map/OfflineRoutesLayer.tsx — Phase 8 · Offline Maps
// Renders cached evacuation routes from the offline `routes` table as
// glowing green lines on the map, fully offline.
//
// Reads db.routes (OfflineRecord rows: data = { geometry, distanceMeters,
// durationSeconds }, cached by the Phase 2 sync engine) and draws every
// cached route with a soft casing + bright core so the evacuation paths
// stay visible over any basemap.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { getOfflineDb } from "@/lib/offline-sync/db";
import type { OfflineRecord } from "@/lib/offline-sync/types";
import type { EvacuationRoute } from "@/lib/map/routing";
import type { FeatureCollection } from "geojson";

type OfflineRoutesLayerProps = {
  db?: ReturnType<typeof getOfflineDb> | null;
  /** Only draw routes for a specific district (e.g. the user's area). */
  district?: string;
  beforeId?: string;
};

function rowToFeature(row: OfflineRecord): GeoJSON.Feature | null {
  const data = row.data as Partial<EvacuationRoute> | undefined;
  const geometry = data?.geometry?.geometry;
  if (!geometry || geometry.type !== "LineString") return null;
  return {
    type: "Feature",
    properties: {
      distanceMeters: data.distanceMeters ?? 0,
      durationSeconds: data.durationSeconds ?? 0,
      district: row.district,
    },
    geometry,
  };
}

export default function OfflineRoutesLayer({
  db = typeof indexedDB === "undefined" ? null : getOfflineDb(),
  district,
  beforeId,
}: OfflineRoutesLayerProps) {
  const [features, setFeatures] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    const load = async () => {
      try {
        let rows = await db.routes.toArray();
        if (district) rows = rows.filter((r) => r.district === district);
        if (!cancelled) {
          setFeatures({
            type: "FeatureCollection",
            features: rows.map(rowToFeature).filter((f): f is GeoJSON.Feature => f !== null),
          });
        }
      } catch {
        // IndexedDB unavailable (SSR/privacy) → nothing to draw.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [db, district]);

  const memoized = useMemo(
    () => (
      <Source id="offline-routes" type="geojson" data={features}>
        <Layer
          id="offline-routes-casing"
          type="line"
          beforeId={beforeId}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": "#052e16", "line-opacity": 0.85, "line-width": 9 }}
        />
        <Layer
          id="offline-routes-core"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": "#22c55e",
            "line-width": 5,
            "line-opacity": 0.95,
          }}
        />
      </Source>
    ),
    [features, beforeId],
  );

  return memoized;
}
