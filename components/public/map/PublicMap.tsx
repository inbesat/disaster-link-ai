"use client";

// ---------------------------------------------------------------------
// components/public/map/PublicMap.tsx — Phase 4 · Steps 1–9 · Minimalist
// panic-proof citizen map.
//
// A full-viewport MapLibre map (react-map-gl) with ZERO chrome: no zoom
// controls, no measure tools, no layer panels, no search bar — just the
// base layer, the user's location pin + Locate Me FAB (Step 2), the
// binary red flood overlay (Step 3), tappable shelter markers with a
// bottom sheet (Step 4), evacuation route lines (Step 5), the turn-by-
// turn guidance overlay (Step 6), road-closure barricade markers (Step
// 7), the Find-My-Family avatar layer (Step 8, toggled from its own
// FAB), the citizen reporter FAB + temporary report pins (Step 9), a
// tiny area chip in the corner, and the minimal legal attribution
// (moved to the top right so the fixed BottomNav doesn't hide it).
//
// Same Carto dark-matter style as the gov DisasterMap; the camera opens
// on the citizen's saved location (GPS fix, manual district centroid, or
// Patna by default). Selecting a shelter here drives both the bottom
// sheet and the evacuation route, so they always agree.
//
// Loaded client-only (ssr: false) from the page because maplibre-gl
// touches `window` — same convention as DisasterMap / MiniMapCanvas.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AttributionControl, Map } from "react-map-gl/maplibre";
import { MapPin, Users } from "lucide-react";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import type { CitizenMapView } from "@/lib/map/citizen-view";
import { generateCitizenFloodZones } from "@/lib/map/citizen-flood-zones";
import { classifyCitizenRoute, type RouteSafetyClassification } from "@/lib/map/route-safety";
import { CITIZEN_ROAD_CLOSURES } from "@/lib/map/citizen-road-closures";
import { CITIZEN_SHELTERS, type CitizenShelter } from "@/lib/map/citizen-shelters";
import UserLocationDot from "./UserLocationDot";
import FloodZones from "./FloodZones";
import ShelterMarkers from "./ShelterMarkers";
import EvacuationRoutes from "./EvacuationRoutes";
import RouteSafetyOverlay from "./RouteSafetyOverlay";
import OfflineRouteDirections from "./OfflineRouteDirections";
import TurnByTurnNav from "./TurnByTurnNav";
import RoadClosures from "./RoadClosures";
import FamilyLayer from "./FamilyLayer";
import ReportIncidentFAB, { type CitizenReportType } from "./ReportIncidentFAB";
import ReportPins, { type ReportPin } from "./ReportPins";

/** Carto dark-matter — same base layer the gov DisasterMap uses. */
const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function PublicMap() {
  const view = useMemo<CitizenMapView>(
    () => resolveCitizenMapView(readCitizenLocation()),
    [],
  );

  // Which shelter's sheet + route is open (null = none).
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  // Guidance mode (Step 6): the sheet hides, TurnByTurnNav takes over the
  // top of the screen, and the selected shelter's route stays drawn.
  const [navigating, setNavigating] = useState(false);

  // Tapping any shelter marker leaves guidance mode before opening its sheet.
  const handleSelectShelter = useCallback((id: string | null) => {
    setNavigating(false);
    setSelectedShelterId(id);
  }, []);

  // "Navigate Here" on the sheet — keep the route, close the sheet, start.
  const startNavigation = useCallback((shelter: CitizenShelter) => {
    setSelectedShelterId(shelter.id);
    setNavigating(true);
  }, []);

  // Red X on the overlay — back to the shelter sheet.
  const exitNavigation = useCallback(() => setNavigating(false), []);

  const navigationShelter =
    navigating && selectedShelterId
      ? CITIZEN_SHELTERS.find((s) => s.id === selectedShelterId) ?? null
      : null;

  // Step 8 — is the Find-My-Family avatar layer visible?
  const [familyVisible, setFamilyVisible] = useState(false);

  // Step 9 — temporary report pins dropped via the reporter FAB. Each
  // pin auto-expires after 12 s ("temporary" by design).
  const [pins, setPins] = useState<ReportPin[]>([]);
  const pinIdRef = useRef(0);
  const pinTimersRef = useRef<number[]>([]);

  // Clear any pending pin-expiry timers if the map unmounts.
  useEffect(
    () => () => {
      pinTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const handleSubmitReport = useCallback(
    (type: CitizenReportType) => {
      const id = `pin-${(pinIdRef.current += 1)}`;
      setPins((prev) => [
        ...prev,
        { id, type, lat: view.center.lat, lng: view.center.lng },
      ]);
      const timer = window.setTimeout(() => {
        setPins((prev) => prev.filter((p) => p.id !== id));
      }, 12_000);
      pinTimersRef.current.push(timer);
    },
    [view.center],
  );

  // Binary danger zones — computed once, shared by the overlay and the
  // route renderer so both draw the exact same shapes.
  const zones = useMemo(
    () => generateCitizenFloodZones(view.center.lat, view.center.lng),
    [view],
  );

  // Phase 1 · Step 9 — one shared safety grading for the selected route,
  // feeding both the route lines and the safety-score badge so they can
  // never disagree.
  const routeSafety = useMemo<RouteSafetyClassification | null>(() => {
    const shelter = selectedShelterId
      ? CITIZEN_SHELTERS.find((s) => s.id === selectedShelterId) ?? null
      : null;
    if (!shelter) return null;
    return classifyCitizenRoute(
      view.center.lat,
      view.center.lng,
      shelter.lat,
      shelter.lng,
      zones,
      CITIZEN_ROAD_CLOSURES,
    );
  }, [selectedShelterId, view, zones]);

  return (
    <div className="relative h-full w-full">
      <Map
        mapLib={maplibregl}
        mapStyle={CARTO_DARK_STYLE}
        initialViewState={{
          latitude: view.center.lat,
          longitude: view.center.lng,
          zoom: view.zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        // We render our own attribution at the top right so the fixed
        // BottomNav at the bottom doesn't hide the legal credit.
        attributionControl={false}
      >
        <AttributionControl
          position="top-right"
          compact
          style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
        />
        <UserLocationDot />
        <FloodZones zones={zones} />
        <ShelterMarkers
          origin={view.center}
          selectedShelterId={selectedShelterId}
          onSelect={handleSelectShelter}
          navigating={navigating}
          onNavigate={startNavigation}
        />
        <EvacuationRoutes classification={routeSafety} />
        {/* Phase 1 · Step 9 — safety-score badge over the route. */}
        <RouteSafetyOverlay
          classification={routeSafety}
          shelterId={selectedShelterId}
        />
        {/* Phase 1 · Step 10 — cached turn-by-turn text while offline. */}
        <OfflineRouteDirections shelterId={selectedShelterId} />
        {/* Step 7 — barricade markers stay on top of the route lines. */}
        <RoadClosures />
        {/* Step 8 — family avatars (mounted only while the layer is on). */}
        {familyVisible && <FamilyLayer origin={view.center} />}
        {/* Step 9 — temporary pins from the reporter FAB. */}
        <ReportPins pins={pins} />
      </Map>

      {/* Step 6 — guidance mode: a big arrow, instruction, ETA and a red
          X exit button pinned to the top of the screen. */}
      <AnimatePresence>
        {navigationShelter && (
          <TurnByTurnNav
            shelter={navigationShelter}
            origin={view.center}
            onExit={exitNavigation}
          />
        )}
      </AnimatePresence>

      {/* Step 8 — Find-My-Family layer toggle, stacked above the other
          FABs on the right. */}
      <button
        type="button"
        onClick={() => setFamilyVisible((v) => !v)}
        aria-pressed={familyVisible}
        aria-label={familyVisible ? "Hide my family on the map" : "Show my family on the map"}
        title="Find my family"
        className={`absolute bottom-[calc(208px+env(safe-area-inset-bottom))] right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
          familyVisible
            ? "border-white/40 bg-[var(--dl-orange)] text-white"
            : "border-white/15 bg-[#0a1120]/80 text-white/80 backdrop-blur"
        }`}
      >
        <Users aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
      </button>

      {/* Step 9 — citizen reporter FAB, just above the Locate Me FAB. */}
      <ReportIncidentFAB onSubmit={handleSubmitReport} />

      {/* Legend — binary by design: red is danger, everything else is safe.
          Stacked above the area chip so the BottomNav never hides it. */}
      <div
        role="img"
        aria-label="Legend: red areas are danger zones, everything else is safe"
        className="pointer-events-none absolute bottom-[calc(140px+env(safe-area-inset-bottom))] left-4 z-10 flex items-center gap-3 rounded-full bg-[#0a1120]/70 px-3 py-1.5 text-[0.6875rem] font-medium text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-severity-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          Danger
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-severity-green-400" />
          Safe
        </span>
      </div>

      {/* Area chip — subtle readout of where the map is centred,
          positioned above the BottomNav */}
      <p className="pointer-events-none absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 z-10 flex items-center gap-1.5 rounded-full bg-[#0a1120]/70 px-3 py-1.5 text-xs font-medium text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm">
        <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-[var(--dl-orange)]" />
        {view.label}
      </p>
    </div>
  );
}
