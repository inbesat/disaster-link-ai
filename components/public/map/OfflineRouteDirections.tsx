"use client";

// ---------------------------------------------------------------------
// components/public/map/OfflineRouteDirections.tsx — Phase 1 · Step 10 ·
// Offline route directions panel.
//
// While the device is offline AND a shelter is selected, this compact card
// shows turn-by-turn text for the PRE-CACHED route to that shelter
// (lib/offline/cache.ts + step-directions): "Head north-east for 1.2 km"…
// "You have arrived". The steps are computed purely from the cached
// geometry — nothing to fetch, nothing that depends on the network.
//
// Positioned top-left, just below the Offline Map badge, so both offline
// affordances stack together while the map stays uncluttered. Renders null
// unless offline + a cached route exists (hydration-safe: the cache is
// read in an effect after mount).
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import {
  loadOfflineRouteCache,
  type OfflineRouteCache,
} from "@/lib/offline/cache";
import {
  buildStepDirections,
  flattenRoute,
  type OfflineStep,
} from "@/lib/offline/step-directions";

type OfflineRouteDirectionsProps = {
  /** Selected shelter id (null → hide the panel). */
  shelterId: string | null;
};

export default function OfflineRouteDirections({
  shelterId,
}: OfflineRouteDirectionsProps) {
  const offline = useOfflineStatus();
  const [cache, setCache] = useState<OfflineRouteCache | null>(null);

  useEffect(() => {
    setCache(loadOfflineRouteCache());
  }, []);

  const steps = useMemo<OfflineStep[]>(() => {
    if (!offline || !shelterId || !cache) return [];
    const route = cache.routes[shelterId];
    if (!route || route.length === 0) return [];
    return buildStepDirections(
      flattenRoute({ type: "FeatureCollection", features: route }),
    );
  }, [offline, shelterId, cache]);

  const shelter = shelterId
    ? cache?.shelters.find((s) => s.id === shelterId) ?? null
    : null;

  if (!offline || !shelter || steps.length === 0) return null;

  return (
    <div className="absolute left-4 top-[calc(140px+env(safe-area-inset-top))] z-10 w-[16rem] rounded-xl border border-severity-amber-500/30 bg-[#0b1120]/90 p-3 shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <Database aria-hidden="true" className="h-3.5 w-3.5 text-severity-amber-300" />
        <p className="min-w-0 text-xs font-bold leading-tight text-white">
          {shelter.name}
        </p>
        <span className="ml-auto shrink-0 rounded-full bg-severity-amber-500/15 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-severity-amber-300">
          Cached
        </span>
      </div>

      <ol className="mt-2.5 space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-severity-amber-500/40 bg-severity-amber-500/15 text-[0.5625rem] font-bold text-severity-amber-300">
              {step.bearingLabel}
            </span>
            <span className="text-[0.6875rem] font-medium leading-snug text-white/85">
              {step.instruction}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}