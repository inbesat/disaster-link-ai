"use client";

// ---------------------------------------------------------------------
// components/gov/map/Terrain3D.tsx — Phase 8 · Step 7 · 3D Terrain.
//
// A child of the Gov Map that switches on MapLibre's 3D terrain once the
// raster-dem source (AWS Terrarium elevation tiles — free, no API key)
// has been added and has data. Rendered inside <Map> so useMap() can
// reach the live instance, mirroring the codebase's map-child pattern.
//
// Exaggeration is kept high (2×) because the demo district — Patna on
// the Ganges plain — is nearly flat; the boost makes the relief read on
// screen while fill-extrusion floods supply the visible 3D drama.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

type Terrain3DProps = {
  /** The raster-dem source to pull elevation from. */
  sourceId?: string;
  /** Vertical exaggeration — 1 = real relief, >1 = dramatised. */
  exaggeration?: number;
};

export function Terrain3D({ sourceId = "gov-terrain-dem", exaggeration = 2 }: Terrain3DProps) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    // useMap() hands out a MapRef wrapper; getMap() reaches the real
    // maplibre instance (which has setTerrain).
    const map = mapRef?.getMap();
    if (!map) return;

    const enable = () => {
      // Guarded: only call setTerrain once the source exists and terrain
      // isn't already active (sourcedata fires repeatedly as tiles load).
      if (map.getSource(sourceId) && !map.getTerrain()) {
        void map.setTerrain({ source: sourceId, exaggeration });
      }
    };

    if (map.loaded()) enable();
    else void map.once("load", enable);

    // DEM tiles arrive asynchronously after the source is added — the
    // re-check on sourcedata is cheap because of the getTerrain() guard.
    void map.on("sourcedata", enable);
    return () => {
      void map.off("sourcedata", enable);
      void map.off("load", enable);
    };
  }, [mapRef, sourceId, exaggeration]);

  return null;
}

export default Terrain3D;
