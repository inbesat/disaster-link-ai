"use client";

// ---------------------------------------------------------------------
// components/gov/map/AnnotationDrawControl.tsx — Phase 8 · Step 3 ·
// Drawing & Annotation Tools.
//
// Wraps @mapbox/mapbox-gl-draw into the MapLibre canvas. Configured for
// the three shapes commanders need:
//   • Polygons   → affected areas
//   • LineStrings → custom evacuation routes
//   • Points     → incident markers
//
// When a shape is finished (draw.create), a mock sync fires — console.log
// plus a toast — standing in for the real "persist + broadcast to all
// officials" flow.
//
// Implementation note: the control is mounted with useMap() + useEffect
// rather than react-map-gl's useControl, because MapboxDraw's onAdd
// signature doesn't structurally satisfy react-map-gl's IControl (a known
// interop typing gap) — this codebase already uses the useMap() pattern
// for map child components (e.g. ShelterMarkers, UserLocationDot).
//
// Install: npm install @mapbox/mapbox-gl-draw @types/mapbox__mapbox-gl-draw
// The modern ESM build works against MapLibre directly (it only reads the
// map instance handed to it — no mapbox-gl global dependency), which is
// why no window shim is needed here. Dark-theme button + cursor styling
// lives in app/globals.css scoped under .gov-ops-map (the workspace root).
// ---------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { IControl } from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useToast } from "@/hooks/useToast";

const SYNC_MESSAGE = "Annotation saved and synced to all officials.";

export function AnnotationDrawControl() {
  const toast = useToast();
  const { current: map } = useMap();
  const drawRef = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true,
      },
      defaultMode: "simple_select",
      // Complete dark-theme style set. MapboxDraw's modes reference these
      // ids by name (active/inactive + vertex/midpoint handles) — a partial
      // array silently breaks the active-editing visuals, so all 14 rules
      // the plugin expects are provided here, restyled for the gov theme.
      styles: [
        // Polygon — inactive fill + stroke.
        {
          id: "gl-draw-polygon-fill-inactive",
          type: "fill",
          filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#3b82f6",
            "fill-outline-color": "#3b82f6",
            "fill-opacity": 0.2,
          },
        },
        {
          id: "gl-draw-polygon-stroke-inactive",
          type: "line",
          filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-opacity": 0.9,
          },
        },
        // Polygon — active (being edited).
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#60a5fa",
            "fill-outline-color": "#93c5fd",
            "fill-opacity": 0.3,
          },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          paint: {
            "line-color": "#93c5fd",
            "line-width": 2.5,
            "line-opacity": 1,
          },
        },
        // LineString — inactive + active.
        {
          id: "gl-draw-line-inactive",
          type: "line",
          filter: ["all", ["==", "active", "false"], ["==", "$type", "LineString"]],
          paint: {
            "line-color": "#22d3ee",
            "line-width": 3,
            "line-dasharray": [4, 3],
            "line-opacity": 0.9,
          },
        },
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "LineString"]],
          paint: {
            "line-color": "#67e8f9",
            "line-width": 3.5,
            "line-dasharray": [2, 2],
            "line-opacity": 1,
          },
        },
        // Point incident markers — inactive + active.
        {
          id: "gl-draw-point-inactive",
          type: "circle",
          filter: ["all", ["==", "active", "false"], ["==", "$type", "Point"], ["==", "meta", "feature"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#f472b6",
            "circle-stroke-color": "#0a0f1a",
            "circle-stroke-width": 2,
          },
        },
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "Point"], ["==", "meta", "feature"]],
          paint: {
            "circle-radius": 8,
            "circle-color": "#f9a8d4",
            "circle-stroke-color": "#0a0f1a",
            "circle-stroke-width": 2,
          },
        },
        // Polygon vertex handles + midpoints.
        {
          id: "gl-draw-polygon-point-inactive",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": 4,
            "circle-color": "#0a0f1a",
            "circle-stroke-color": "#93c5fd",
            "circle-stroke-width": 1.5,
          },
        },
        {
          id: "gl-draw-polygon-point-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["==", "active", "true"]],
          paint: {
            "circle-radius": 4.5,
            "circle-color": "#fbbf24",
            "circle-stroke-color": "#0a0f1a",
            "circle-stroke-width": 1.5,
          },
        },
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 3,
            "circle-color": "#f472b6",
          },
        },
        // LineString vertex handles + midpoints.
        {
          id: "gl-draw-line-point-inactive",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": 4,
            "circle-color": "#0a0f1a",
            "circle-stroke-color": "#67e8f9",
            "circle-stroke-width": 1.5,
          },
        },
        {
          id: "gl-draw-line-point-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["==", "active", "true"]],
          paint: {
            "circle-radius": 4.5,
            "circle-color": "#fbbf24",
            "circle-stroke-color": "#0a0f1a",
            "circle-stroke-width": 1.5,
          },
        },
        {
          id: "gl-draw-line-midpoint",
          type: "circle",
          filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 3,
            "circle-color": "#f472b6",
          },
        },
      ],
    });
    drawRef.current = draw;
    // The @types/mapbox__mapbox-gl-draw declares onAdd(map: mapboxgl.Map)
    // while maplibre's IControl expects maplibregl.Map — a runtime no-op
    // difference, so the instance is cast at the control boundary only.
    map.addControl(draw as unknown as IControl);

    // Finished shape → mock "persist + sync to all officials".
    const handleCreate = (e: {
      features?: Array<{ geometry?: { type?: string } }>;
    }) => {
      const type = e.features?.[0]?.geometry?.type ?? "shape";
      console.log(`[draw] ${type} → ${SYNC_MESSAGE}`);
      toast.success({
        title: "Annotation saved",
        description: `${type} drawn on the map and synced to all officials.`,
      });
    };
    map.on("draw.create", handleCreate);

    return () => {
      map.off("draw.create", handleCreate);
      if (drawRef.current) map.removeControl(drawRef.current as unknown as IControl);
      drawRef.current = null;
    };
  }, [map, toast]);

  return null;
}

export default AnnotationDrawControl;
