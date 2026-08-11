"use client";

// ---------------------------------------------------------------------
// components/gov/map/GovMapCanvas.tsx — Phase 8 · Step 1–4.
//
// The 100%-screen MapLibre map behind the Gov Map Workspace. Uses the
// same Carto dark-matter base style as the citizen map and the gov
// DisasterMap, and mounts one GeoJSON Source + Layer per operational
// layer — each gated by the visibility and opacity the
// AdvancedLayerControl writes into GovMapLayersContext.
//
// Phase 8 · Steps 3–4 additions:
//   • AnnotationDrawControl — MapboxDraw (polygon/line/point) mounted
//     top-left, syncs a mock console.log + toast on draw.create.
//   • Measurement overlay — while a MeasurementToolbar tool is active,
//     map clicks append waypoints; the live shape is drawn and a
//     turf-computed readout (km / km²) floats near the cursor.
//
// Loaded client-only (ssr: false) from the page because maplibre-gl
// touches `window` — the codebase-wide convention.
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AttributionControl, Layer, Map, Source } from "react-map-gl/maplibre";
import type { FeatureCollection, Geometry, Polygon } from "geojson";
import {
  GOV_LAYER_COLORS,
  GOV_MAP_INITIAL_VIEW,
  GOV_EVACUATION_ROUTES,
  GOV_RESPONDER_POSITIONS,
  GOV_RESOURCE_DEPOTS,
  GOV_ROAD_CLOSURES,
  crowdReportsGeoJson,
  govFloodZonesGeoJson,
  govSheltersGeoJson,
  pointsToGeoJson,
  routesToGeoJson,
  type GovMapLayerKey,
} from "@/lib/map/gov-map-layers";
import { measureLabel, type MeasureMode } from "@/lib/map/gov-measurements";
import { floodScaleForHour, scaleFloodForecast } from "@/lib/map/gov-flood-forecast";
import { useGovMapLayers } from "./GovMapLayersContext";
import AnnotationDrawControl from "./AnnotationDrawControl";
import MapContextMenu, { type ContextMenuState } from "./MapContextMenu";
import Terrain3D from "./Terrain3D";

/** depth_meters (0.3–6 m) × gain → the mock 5–15 m+ 3D visual band the
 * extrusion height uses (MapLibre heights are in metres). */
const EXTRUSION_GAIN = 3;

/** GeoJSON accepted by react-map-gl's Source `data` prop. Widened to
 * FeatureCollection<Geometry> so both the per-layer builders and the
 * live measurement shape (LineString OR Polygon depending on the tool)
 * type-check against the same alias. */
type GovLayerGeoJson = FeatureCollection<Geometry>;

/** Carto dark-matter — same base layer the gov DisasterMap uses. */
const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** The flood polygons — kept as a concrete FeatureCollection<Polygon> so
 * they can feed scaleFloodForecast (the widened GovLayerGeoJson alias
 * wouldn't satisfy that parameter). */
const FLOOD_SOURCE: FeatureCollection<Polygon> = govFloodZonesGeoJson();

/** The crowd-report point cloud (3k seeded reports) that the Step 10
 * clustering source runs on — computed once for a stable source ref. */
const CROWD_SOURCE = crowdReportsGeoJson(3000);

/** GeoJSON per layer, computed once (pure builders, stable refs). */
const LAYER_SOURCES: Record<GovMapLayerKey, GovLayerGeoJson> = {
  floodRiskZones: FLOOD_SOURCE,
  shelters: govSheltersGeoJson(),
  resourceDepots: pointsToGeoJson(GOV_RESOURCE_DEPOTS),
  evacuationRoutes: routesToGeoJson(GOV_EVACUATION_ROUTES),
  responderPositions: pointsToGeoJson(GOV_RESPONDER_POSITIONS),
  roadClosures: pointsToGeoJson(GOV_ROAD_CLOSURES),
  crowdReports: CROWD_SOURCE,
};

type GovMapCanvasProps = {
  /** Active measurement tool — null when idle. */
  measureMode: MeasureMode | null;
  /** Waypoints collected by the measurement tool ([lng, lat]). */
  measurePoints: [number, number][];
  /** Append a waypoint (map click while measuring). */
  onAddMeasurePoint: (lngLat: { lng: number; lat: number }) => void;
  /** Forecast hour (0–72) from the TimeSliderControl — scales the flood
   * polygons to simulate rising water. */
  forecastHour: number;
  /** Called with the live map instance once it loads (export + pitch). */
  onMapReady?: (map: maplibregl.Map) => void;
};

export function GovMapCanvas({
  measureMode,
  measurePoints,
  onAddMeasurePoint,
  forecastHour,
  onMapReady,
}: GovMapCanvasProps) {
  const { layers } = useGovMapLayers();
  // Cursor pixel position — drives the floating measurement readout.
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  // Right-click tactical menu state (pixel pos + lng/lat under cursor).
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Flood polygons scaled to the current forecast hour (water spreads
  // from t0 → t72; recomputed only when the hour changes).
  const floodData = useMemo(() => scaleFloodForecast(FLOOD_SOURCE, forecastHour), [
    forecastHour,
  ]);

  const measuring = measureMode !== null;

  // The live shape: a LineString always; the polygon closes back to the
  // first point once 3+ waypoints exist.
  const shapeGeoJson: GovLayerGeoJson | null =
    measurePoints.length >= 2
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry:
                measureMode === "area" && measurePoints.length >= 3
                  ? {
                      type: "Polygon",
                      coordinates: [[...measurePoints, measurePoints[0]]],
                    }
                  : { type: "LineString", coordinates: measurePoints },
            },
          ],
        }
      : null;

  return (
    <Map
      mapLib={maplibregl}
      mapStyle={CARTO_DARK_STYLE}
      initialViewState={GOV_MAP_INITIAL_VIEW}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      interactiveLayerIds={["gov-crowd-cluster"]}
      onClick={(e) => {
        setContextMenu(null);
        if (measuring) {
          onAddMeasurePoint({ lng: e.lngLat.lng, lat: e.lngLat.lat });
          return;
        }
        // Step 10 — cluster drill-down: fly to the expansion zoom so the
        // cluster splits into its member reports.
        const feature = e.features?.[0];
        if (feature && feature.properties && "cluster" in feature.properties) {
          const source = e.target.getSource("gov-crowd") as GeoJSONSource | undefined;
          const clusterId = Number(feature.properties.cluster_id);
          const coordinates = (
            feature.geometry as unknown as { coordinates: [number, number] }
          ).coordinates;
          if (source && Number.isFinite(clusterId)) {
            void source
              .getClusterExpansionZoom(clusterId)
              .then((zoom) => {
                e.target.flyTo({
                  center: coordinates,
                  zoom,
                  duration: 900,
                  essential: true,
                });
              })
              .catch(() => undefined);
          }
        }
      }}
      onContextMenu={(e) => {
        // Suppress the browser menu and open the tactical menu instead.
        e.originalEvent.preventDefault();
        setContextMenu({
          x: e.point.x,
          y: e.point.y,
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
      }}
      onMouseMove={(e) => {
        if (measuring) setCursor({ x: e.point.x, y: e.point.y });
      }}
      onMouseLeave={() => setCursor(null)}
      onLoad={(e) => onMapReady?.(e.target as unknown as maplibregl.Map)}
    >
      <AttributionControl
        position="bottom-right"
        compact
        style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
      />

      {/* Phase 8 · Step 3 — MapboxDraw annotation tools (top-left). */}
      <AnnotationDrawControl />

      {/* Phase 8 · Step 7 — 3D terrain: AWS Terrarium elevation tiles
          (free, no API key) + MapLibre terrain enabled on load. */}
      <Source
        id="gov-terrain-dem"
        type="raster-dem"
        tiles={[
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ]}
        tileSize={256}
        encoding="terrarium"
      />
      <Terrain3D sourceId="gov-terrain-dem" exaggeration={2} />

      {/* Flood Risk Zones — extruded in 3D, geometry + height scaled by
          the forecast hour (t24 default = 1.0×, so nothing changes on
          first load). */}
      {layers.floodRiskZones.visible && (
        <Source id="gov-flood" type="geojson" data={floodData}>
          <Layer
            id="gov-flood-fill"
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": GOV_LAYER_COLORS.floodRiskZones,
              // The polygons already carry mock depth_meters (0.3–6 m);
              // the gain lifts them into the 5–15 m+ visual band and the
              // forecast factor makes the water physically rise with the
              // time slider.
              "fill-extrusion-height": [
                "*",
                ["get", "depth_meters"],
                EXTRUSION_GAIN * floodScaleForHour(forecastHour),
              ],
              "fill-extrusion-base": 0,
              // Higher base opacity than the old flat fill so the lit
              // vertical faces read clearly in 3D.
              "fill-extrusion-opacity":
                (layers.floodRiskZones.opacity / 100) *
                floodScaleForHour(forecastHour),
              "fill-extrusion-vertical-gradient": true,
            }}
          />
          <Layer
            id="gov-flood-outline"
            type="line"
            paint={{
              "line-color": GOV_LAYER_COLORS.floodRiskZones,
              "line-width": 1.5,
              "line-opacity": layers.floodRiskZones.opacity / 100,
            }}
          />
        </Source>
      )}

      {/* Evacuation Routes — dashed polylines. */}
      {layers.evacuationRoutes.visible && (
        <Source
          id="gov-routes"
          type="geojson"
          data={LAYER_SOURCES.evacuationRoutes}
        >
          <Layer
            id="gov-routes-line"
            type="line"
            paint={{
              "line-color": GOV_LAYER_COLORS.evacuationRoutes,
              "line-width": 3,
              "line-dasharray": [4, 3],
              "line-opacity": layers.evacuationRoutes.opacity / 100,
            }}
          />
        </Source>
      )}

      {/* Point layers — depots / responders / closures / reports / shelters. */}
      <PointLayer
        id="gov-depots"
        color={GOV_LAYER_COLORS.resourceDepots}
        opacity={layers.resourceDepots.opacity}
        visible={layers.resourceDepots.visible}
        data={LAYER_SOURCES.resourceDepots}
        radius={7}
      />
      <PointLayer
        id="gov-responders"
        color={GOV_LAYER_COLORS.responderPositions}
        opacity={layers.responderPositions.opacity}
        visible={layers.responderPositions.visible}
        data={LAYER_SOURCES.responderPositions}
        radius={6}
      />
      <PointLayer
        id="gov-closures"
        color={GOV_LAYER_COLORS.roadClosures}
        opacity={layers.roadClosures.opacity}
        visible={layers.roadClosures.visible}
        data={LAYER_SOURCES.roadClosures}
        radius={6}
      />
      {/* Phase 8 · Step 10 — clustered crowd reports (3k points, a handful
          of circles at 60fps). Zoom ≤ 14 clusters; clicking a cluster
          flies to its expansion zoom. */}
      {layers.crowdReports.visible && (
        <Source
          id="gov-crowd"
          type="geojson"
          data={LAYER_SOURCES.crowdReports}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="gov-crowd-cluster"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#f472b6",
                10,
                "#f97316",
                100,
                "#ef4444",
              ],
              "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 100, 30],
              "circle-opacity": layers.crowdReports.opacity / 100,
              "circle-stroke-color": "#0a0f1a",
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="gov-crowd-cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 12,
            }}
            paint={{ "text-color": "#ffffff" }}
          />
          <Layer
            id="gov-crowd-dot"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": GOV_LAYER_COLORS.crowdReports,
              "circle-radius": 5,
              "circle-opacity": layers.crowdReports.opacity / 100,
              "circle-stroke-color": "#0a0f1a",
              "circle-stroke-width": 1.5,
            }}
          />
        </Source>
      )}
      <PointLayer
        id="gov-shelters"
        color={GOV_LAYER_COLORS.shelters}
        opacity={layers.shelters.opacity}
        visible={layers.shelters.visible}
        data={LAYER_SOURCES.shelters}
        radius={8}
      />

      {/* Phase 8 · Step 4 — live measurement shape. */}
      {shapeGeoJson && (
        <Source id="gov-measure" type="geojson" data={shapeGeoJson}>
          {measureMode === "area" && measurePoints.length >= 3 && (
            <Layer
              id="gov-measure-fill"
              type="fill"
              paint={{
                "fill-color": "#fbbf24",
                "fill-opacity": 0.2,
              }}
            />
          )}
          <Layer
            id="gov-measure-line"
            type="line"
            paint={{
              "line-color": measureMode === "area" ? "#fbbf24" : "#38bdf8",
              "line-width": 3,
              "line-dasharray": [3, 2],
              "line-opacity": 0.95,
            }}
          />
        </Source>
      )}

      {/* Phase 8 · Step 6 — right-click tactical context menu. */}
      {contextMenu && (
        <MapContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {/* Phase 8 · Step 4 — floating readout near the cursor. */}
      {measuring && cursor && (
        <div
          className="pointer-events-none fixed z-40 -translate-x-1/2 rounded-lg border border-white/15 bg-[#0d1526]/95 px-3 py-1.5 text-xs font-bold tabular-nums text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur"
          style={{ left: cursor.x, top: cursor.y + 18 }}
        >
          <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--dl-blue-light)]">
            {measureMode}
          </span>
          {measureLabel(measureMode, measurePoints)}
        </div>
      )}
    </Map>
  );
}

/** A circle-styled point source gated by its layer's visibility. */
function PointLayer({
  id,
  color,
  opacity,
  visible,
  data,
  radius,
}: {
  id: string;
  color: string;
  opacity: number;
  visible: boolean;
  data: GovLayerGeoJson;
  radius: number;
}) {
  if (!visible) return null;

  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={`${id}-dot`}
        type="circle"
        paint={{
          "circle-color": color,
          "circle-radius": radius,
          "circle-opacity": opacity / 100,
          "circle-stroke-color": "#0a0f1a",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.9,
        }}
      />
    </Source>
  );
}

export default GovMapCanvas;
