"use client";

// ---------------------------------------------------------------------
// components/public/OfflineRouteCacheSync.tsx — Phase 1 · Step 10 ·
// Offline cache builder (invisible).
//
// Renders nothing. Its only job is to rebuild the offline route snapshot
// (lib/offline/cache.ts) while the network is up — every time the app
// comes back online — so the next outage already has fresh shelter
// markers, help centers and route geometry waiting in localStorage.
//
// It resolves the citizen's actual map view (GPS fix, district, or Patna
// default) before building, so the cached lines match what the online map
// draws. Hydration-safe: pure `useEffect` work, no state, no DOM.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import {
  buildOfflineRouteCache,
  saveOfflineRouteCache,
} from "@/lib/offline/cache";

export default function OfflineRouteCacheSync() {
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) return;
    const view = resolveCitizenMapView(readCitizenLocation());
    saveOfflineRouteCache(buildOfflineRouteCache(view.center.lat, view.center.lng));
  }, [online]);

  return null;
}