"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import LayerToggle, {
  type LayerVisibility,
} from "@/components/map/LayerToggle";
import PredictionChart from "@/components/dashboard/PredictionChart";
import WhatIfSimulator from "@/components/dashboard/WhatIfSimulator";
import ImpactSummary from "@/components/dashboard/ImpactSummary";
import AlertBanner from "@/components/dashboard/AlertBanner";
import TimeSlider from "@/components/map/TimeSlider";
import ScenarioSelector, {
  SCENARIO_MULTIPLIER,
  type ScenarioId,
} from "@/components/map/ScenarioSelector";
import EvacuationPlanner, {
  type EvacRouteResult,
} from "@/components/dashboard/EvacuationPlanner";
import type { Feature, LineString } from "geojson";
import type { FloodRiskLevel } from "@/lib/map/flood-geojson";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { DisasterType } from "@/lib/disasters/disaster-types";
import { DISASTER_META } from "@/lib/disasters/disaster-types";
import HazardSelector from "@/components/map/HazardSelector";
import AccuracyMetrics from "@/components/dashboard/AccuracyMetrics";
import WebhookSimulator from "@/components/dashboard/WebhookSimulator";
import type { GroundReport } from "@/lib/crowdsourced/report";
import LiveCursors from "@/components/map/LiveCursors";

const DisasterMap = dynamic(() => import("@/components/map/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-lg border border-border bg-surface-muted">
        <span className="text-2xl" aria-hidden>
          🗺️
        </span>
      </div>
      <div className="h-3 w-40 animate-pulse rounded-full bg-surface-muted" />
      <div className="h-3 w-24 animate-pulse rounded-full bg-surface-muted" />
      <p className="eoc-label text-accent">LOADING MAP…</p>
    </div>
  ),
});

const SEVERITY_LEGEND = [
  { label: "Low / Safe", color: "bg-severity-green-500" },
  { label: "Watch", color: "bg-severity-amber-500" },
  { label: "Warning", color: "bg-severity-red-500" },
  { label: "Critical", color: "bg-severity-purple-500" },
];

type CommandCenterClientProps = {
  sidebar: ReactNode;
  top?: ReactNode;
};

export default function CommandCenterClient({ sidebar, top }: CommandCenterClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // The map display config is owned by /settings/map via the shared
  // MapSettingsContext — the command-center map honours Default View,
  // layer visibility and refresh cadence set there, and updates the
  // instant the responder tweaks them.
  const { settings } = useMapSettings();

  const [layers, setLayers] = useState<LayerVisibility>(() => ({
    floodZones: settings.layers.floodZones,
    shelters: settings.layers.shelters,
    resources: settings.layers.resources,
  }));
  const [hoursAhead, setHoursAhead] = useState(24);
  const [scenario, setScenario] = useState<ScenarioId>("normal");
  const [severity, setSeverity] = useState<FloodRiskLevel>("high");
  const [disasterType, setDisasterType] = useState<DisasterType>("flood");
  const [mapState, setMapState] = useState<{
    center: { lat: number; lng: number };
    district: string | null;
  }>(() => ({
    center: settings.defaultView.focusDistrict
      ? settings.defaultView.center
      : { lat: settings.defaultView.center.lat, lng: settings.defaultView.center.lng },
    district: settings.defaultView.focusDistrict,
  }));
  const [evacRoute, setEvacRoute] = useState<{
    geometry: Feature<LineString>;
    isSafe: boolean;
    villageName: string;
    shelterName: string;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  } | null>(null);
  const [groundReports, setGroundReports] = useState<GroundReport[]>([]);

  const handleEvacRoute = useCallback((result: EvacRouteResult) => {
    setEvacRoute({
      geometry: result.geometry,
      isSafe: result.isSafe,
      villageName: result.villageName,
      shelterName: result.shelterName,
      start: result.start,
      end: result.end,
    });
  }, []);

  // Reroute triggered from the map when a new road closure blocks the path:
  // keep destination metadata, swap in the regenerated geometry.
  const handleReroute = useCallback(
    (route: { geometry: Feature<LineString>; isSafe: boolean }) => {
      setEvacRoute((prev) =>
        prev ? { ...prev, geometry: route.geometry, isSafe: route.isSafe } : prev,
      );
    },
    [],
  );

  const handleMapStateChange = useCallback(
    (state: { center: { lat: number; lng: number }; district: string | null }) =>
      setMapState(state),
    [],
  );

  const focusLabel = mapState.district?.toUpperCase() ?? "GLOBAL";

  const controls = (
    <>
      <p className="eoc-label text-accent">COMMAND CENTER · {focusLabel}</p>
      <h1 className="text-xl font-bold">{DISASTER_META[disasterType].label} Response</h1>

      <div className="mt-4">
        <HazardSelector value={disasterType} onChange={setDisasterType} />
      </div>

      <LayerToggle layers={layers} onChange={setLayers} />

      <div className="mt-4">
        <p className="eoc-label mb-2">SEVERITY LEGEND</p>
        <ul className="space-y-2">
          {SEVERITY_LEGEND.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 text-sm text-slate-300"
            >
              <span className={`h-3 w-3 rounded-full ${item.color}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <ImpactSummary
          hoursAhead={hoursAhead}
          severity={severity}
          scenarioMultiplier={SCENARIO_MULTIPLIER[scenario]}
          disasterType={disasterType}
          centerLat={mapState.center.lat}
          centerLng={mapState.center.lng}
        />
      </div>

      <div className="mt-4">
        <PredictionChart />
      </div>

      <div className="mt-4">
        <WhatIfSimulator lat={mapState.center.lat} lng={mapState.center.lng} />
      </div>

      <div className="mt-4">
        <AccuracyMetrics
          reports={groundReports.length > 0 ? groundReports : undefined}
        />
      </div>

      <div className="mt-4">
        <WebhookSimulator
          onNewReport={(report) =>
            setGroundReports((prev) => [...prev, report])
          }
        />
      </div>

      <div className="mt-4">{sidebar}</div>

      <div className="mt-4">
        <EvacuationPlanner onEvacRoute={handleEvacRoute} />
      </div>
    </>
  );

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {top}
      <AlertBanner riskLevel={severity} hours={hoursAhead} disasterType={disasterType} />
      <div className="relative flex-1 overflow-hidden">
        <DisasterMap
          visibleLayers={layers}
          hoursAhead={hoursAhead}
          disasterType={disasterType}
          scenarioMultiplier={SCENARIO_MULTIPLIER[scenario]}
          onSeverityChange={setSeverity}
          onMapStateChange={handleMapStateChange}
          evacRoute={evacRoute}
          onReroute={handleReroute}
          groundReports={groundReports}
        />
        <LiveCursors />
        <ScenarioSelector value={scenario} onChange={setScenario} />

        <aside className="absolute left-4 top-4 z-10 hidden w-80 flex-col gap-4 overflow-y-auto rounded-eoc border border-border bg-surface/90 p-5 shadow-glow-accent backdrop-blur md:flex md:max-h-[calc(100%-2rem)]">
          {controls}
        </aside>

        <TimeSlider value={hoursAhead} onChange={setHoursAhead} />

        <section
          className={`fixed inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-in-out md:hidden ${
            sheetOpen ? "translate-y-0" : "translate-y-[calc(100%_-_56px)]"
          }`}
        >
          <div className="mx-4 mb-3 max-h-[75vh] overflow-y-auto rounded-eoc border border-border bg-surface/95 p-5 shadow-glow-accent backdrop-blur">
            <button
              type="button"
              onClick={() => setSheetOpen((open) => !open)}
              aria-label={sheetOpen ? "Collapse panel" : "Expand panel"}
              className="mx-auto mb-4 flex h-8 w-16 items-center justify-center rounded-full border border-border bg-surface-elevated"
            >
              <span
                className={`h-1 w-8 rounded-full bg-slate-400 transition-transform duration-300 ${
                  sheetOpen ? "rotate-45" : ""
                }`}
              />
            </button>
            {controls}
          </div>
        </section>
      </div>
    </main>
  );
}
