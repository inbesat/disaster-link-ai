"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/AlertTargetMap.tsx — Phase 11 · Step 2 ·
// Geospatial Target Area Selector.
//
// The mini MapLibre canvas (250px) inside the Alert Composer that answers
// "who should this alert reach?" Three targeting modes, driven by the
// parent's TargetMode tab:
//
//   • entire  — a translucent district-coverage polygon around the
//               selected district centre (blue tint; whole district).
//   • villages — every GOV_ALERT_VILLAGE as a tappable marker; selected
//               villages turn red with a check. Parents the Set up/down.
//   • polygon — MapboxDraw in polygon mode: click to drop vertices, the
//               shape auto-closes, and every vertex is streamed up as
//               [lng, lat] coordinates (the "alert radius"). Trash control
//               clears/re-edits; previously drawn polygons re-render.
//
// The camera auto-fits to the selected district, the chosen villages, or
// the drawn polygon. Loaded client-only (ssr: false) from AlertComposer
// because maplibre-gl touches `window` — the codebase-wide convention.
// Draw-button styling is scoped in app/globals.css under .alert-target-map
// (the same dark theme as the Phase 8 .gov-ops-map draw controls).
// ---------------------------------------------------------------------

import { useEffect, useMemo } from "react";
import maplibregl from "maplibre-gl";
import type { IControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { circle } from "@turf/turf";
import { Check, Crosshair } from "lucide-react";
import { Layer, Map, Marker, Source, useMap } from "react-map-gl/maplibre";
import type { FeatureCollection, Polygon } from "geojson";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  GOV_ALERT_VILLAGES,
  GOV_DISTRICT_CENTERS,
  type AlertTargetMode,
  type AlertVillage,
} from "@/lib/mock-data/gov-alert-targets";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export type AlertTargetMapProps = {
  mode: AlertTargetMode;
  district: string;
  selectedVillages: ReadonlySet<string>;
  /** Called with a village id when its marker is tapped (toggle). */
  onVillageToggle: (id: string) => void;
  polygonCoords: readonly [number, number][];
  onPolygonChange: (coords: [number, number][]) => void;
};

const MODE_COPY: Record<AlertTargetMode, { title: string; hint: string }> = {
  entire: {
    title: "Entire district",
    hint: "Broadcast to every registered mobile in the district.",
  },
  villages: {
    title: "Select villages",
    hint: "Tap village markers — only selected villages receive the alert.",
  },
  polygon: {
    title: "Draw custom polygon",
    hint: "Click to drop vertices · double-click to finish · trash to clear.",
  },
};

/** Translucent district-coverage circle for "Entire District" mode. */
function DistrictCoverage({ district }: { district: string }) {
  const center = GOV_DISTRICT_CENTERS[district] ?? GOV_DISTRICT_CENTERS["Patna"];
  const coverage = useMemo<FeatureCollection<Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: circle([center.lng, center.lat], 22, { units: "kilometers" })
            .geometry as Polygon,
        },
      ],
    }),
    [center.lng, center.lat],
  );

  return (
    <Source id="district-coverage" type="geojson" data={coverage}>
      <Layer
        id="district-coverage-fill"
        type="fill"
        paint={{
          "fill-color": "#3b82f6",
          "fill-opacity": 0.12,
        }}
      />
      <Layer
        id="district-coverage-line"
        type="line"
        paint={{
          "line-color": "#60a5fa",
          "line-width": 1.5,
          "line-dasharray": [4, 3],
          "line-opacity": 0.85,
        }}
      />
    </Source>
  );
}

/** Tappable village marker — selected = red + check, unselected = amber. */
function VillageMarker({
  village,
  selected,
  onToggle,
}: {
  village: AlertVillage;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Marker longitude={village.lng} latitude={village.lat} anchor="center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(village.id);
        }}
        aria-pressed={selected}
        aria-label={`${village.name}${selected ? ", selected" : ""}`}
        className={`group relative flex h-7 items-center gap-1 rounded-full border px-2 text-[0.6875rem] font-bold leading-none shadow-lg shadow-black/40 transition-transform duration-150 active:scale-90 ${
          selected
            ? "border-severity-red-500 bg-severity-red-500/20 text-severity-red-300"
            : "border-severity-amber-500/70 bg-severity-amber-500/10 text-severity-amber-300 hover:scale-105"
        }`}
      >
        {selected ? (
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
        ) : (
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-amber-400" />
        )}
        {village.name}
      </button>
    </Marker>
  );
}

/**
 * Auto-fits the camera to the current targeting context. Mounted inside
 * <Map> so useMap() reaches the live instance — same pattern as the gov
 * location selector / citizen user-dot.
 */
function TargetMapController({
  district,
  mode,
  selectedVillages,
  polygonCoords,
}: {
  district: string;
  mode: AlertTargetMode;
  selectedVillages: ReadonlySet<string>;
  polygonCoords: readonly [number, number][];
}) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const center = GOV_DISTRICT_CENTERS[district] ?? GOV_DISTRICT_CENTERS["Patna"];

    if (mode === "villages" && selectedVillages.size > 0) {
      const chosen = GOV_ALERT_VILLAGES.filter((v) => selectedVillages.has(v.id));
      const lngs = chosen.map((v) => v.lng);
      const lats = chosen.map((v) => v.lat);
      map.fitBounds(
        [
          [Math.min(...lngs) - 0.03, Math.min(...lats) - 0.03],
          [Math.max(...lngs) + 0.03, Math.max(...lats) + 0.03],
        ],
        { padding: 28, duration: 650 },
      );
    } else if (mode === "polygon" && polygonCoords.length >= 3) {
      const lngs = polygonCoords.map(([lng]) => lng);
      const lats = polygonCoords.map(([, lat]) => lat);
      map.fitBounds(
        [
          [Math.min(...lngs) - 0.02, Math.min(...lats) - 0.02],
          [Math.max(...lngs) + 0.02, Math.max(...lats) + 0.02],
        ],
        { padding: 32, duration: 650 },
      );
    } else {
      map.easeTo({ center: [center.lng, center.lat], zoom: 10.6, duration: 650 });
    }
  }, [map, district, mode, selectedVillages, polygonCoords]);

  return null;
}

/**
 * MapboxDraw instance for "Draw Custom Polygon" mode. Auto-enters polygon
 * draw mode on mount, streams finished vertices up, and clears on delete.
 * Previously drawn polygons (from a mode round-trip) are re-added.
 */
function PolygonDrawControl({
  initialCoords,
  onChange,
}: {
  initialCoords: readonly [number, number][];
  onChange: (coords: [number, number][]) => void;
}) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    // Interop typing gap: MapboxDraw's onAdd signature doesn't satisfy
    // maplibre's IControl — cast at the boundary only (Phase 8 pattern).
    map.addControl(draw as unknown as IControl);

    if (initialCoords.length >= 3) {
      draw.add({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[...initialCoords, initialCoords[0]]],
        },
      });
      draw.changeMode("simple_select");
    } else {
      draw.changeMode("draw_polygon");
    }

    const handleCreate = (e: {
      features?: Array<{ geometry?: { type: string; coordinates?: unknown } }>;
    }) => {
      const coords = e.features?.[0]?.geometry?.coordinates as number[][][] | undefined;
      const ring = coords?.[0] ?? [];
      onChange(ring.map(([lng, lat]) => [Number(lng), Number(lat)] as [number, number]));
    };
    const handleDelete = () => onChange([]);

    map.on("draw.create", handleCreate);
    map.on("draw.delete", handleDelete);

    return () => {
      map.off("draw.create", handleCreate);
      map.off("draw.delete", handleDelete);
      map.removeControl(draw as unknown as IControl);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps -- mount once

  return null;
}

export function AlertTargetMap({
  mode,
  district,
  selectedVillages,
  onVillageToggle,
  polygonCoords,
  onPolygonChange,
}: AlertTargetMapProps) {
  const center = GOV_DISTRICT_CENTERS[district] ?? GOV_DISTRICT_CENTERS["Patna"];
  const copy = MODE_COPY[mode];

  return (
    <div className="alert-target-map relative h-[250px] w-full overflow-hidden rounded-xl border border-white/10 bg-panel-deep">
      <Map
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 10.6,
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {mode === "entire" && <DistrictCoverage district={district} />}

        {mode === "villages" &&
          GOV_ALERT_VILLAGES.map((village) => (
            <VillageMarker
              key={village.id}
              village={village}
              selected={selectedVillages.has(village.id)}
              onToggle={onVillageToggle}
            />
          ))}

        {mode === "polygon" && (
          <PolygonDrawControl initialCoords={polygonCoords} onChange={onPolygonChange} />
        )}

        <TargetMapController
          district={district}
          mode={mode}
          selectedVillages={selectedVillages}
          polygonCoords={polygonCoords}
        />
      </Map>

      {/* Mode chip + instruction */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[70%] flex-col gap-0.5 rounded-lg border border-white/10 bg-[rgb(var(--bg-primary-rgb)/90)] px-2.5 py-1.5 backdrop-blur">
        <p className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-200">
          <Crosshair className="h-3 w-3 text-[var(--dl-blue-light)]" aria-hidden />
          {copy.title}
        </p>
        <p className="text-[0.625rem] leading-snug text-slate-400">{copy.hint}</p>
      </div>
    </div>
  );
}

export default AlertTargetMap;
