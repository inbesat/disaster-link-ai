"use client";

// ---------------------------------------------------------------------
// components/public/map/UserLocationDot.tsx — Phase 4 · Step 2 · Pulsing
// user-location marker + Locate Me FAB.
//
// Rendered inside the public <Map> so useMap() can reach the live map
// instance (same pattern as the gov LocationSelector). Draws the
// citizen's saved location (GPS pin or district-centroid pin for manual
// mode) as a blue dot with a CSS pulse ring (Tailwind animate-ping,
// disabled under reduced motion), and provides the "Locate Me" FAB that
// flies the camera back to them — falling back to the resolved default
// (Patna) when no location has been set up yet.
// ---------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { Crosshair } from "lucide-react";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import type { CitizenLocation } from "@/lib/mock-data/hazard-zones";

export default function UserLocationDot() {
  const { current: map } = useMap();
  // readCitizenLocation returns a stable cached reference, so this never
  // re-runs mid-session; the FAB re-reads fresh on each tap anyway.
  const [location] = useState<CitizenLocation | null>(() =>
    readCitizenLocation(),
  );
  const view = useMemo(() => resolveCitizenMapView(location), [location]);

  const recenter = useCallback(() => {
    if (!map) return;
    const freshView = resolveCitizenMapView(readCitizenLocation());
    map.flyTo({
      center: [freshView.center.lng, freshView.center.lat],
      zoom: freshView.zoom,
      duration: 1800,
      essential: true,
    });
  }, [map]);

  return (
    <>
      {location && (
        <Marker
          longitude={view.center.lng}
          latitude={view.center.lat}
          anchor="center"
        >
          <div className="relative h-4 w-4">
            {/* Pulsing outer ring — disabled when the user prefers reduced motion */}
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-sky-400/60 motion-reduce:animate-none"
            />
            {/* Solid inner dot with a subtle halo */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)] ring-4 ring-sky-400/40"
            />
          </div>
        </Marker>
      )}

      {/* Locate Me FAB */}
      <button
        type="button"
        aria-label="Recenter map on your location"
        title="Recenter on your location"
        onClick={recenter}
        className="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dl-orange)] text-white shadow-[0_8px_24px_rgba(249,115,22,0.45)] transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
      >
        <Crosshair aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}