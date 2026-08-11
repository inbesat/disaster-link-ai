"use client";

// ---------------------------------------------------------------------
// components/public/PublicOfflineBanner.tsx — Phase 1 · Step 10 · Offline
// mode banner for the citizen portal.
//
// When the device loses connectivity, a sticky amber strip pins to the top
// of the dashboard: "Offline Mode — Using cached route data. Verify
// conditions before proceeding." It uses the same hydration-safe
// useOfflineStatus hook as the gov OfflineBanner and the map's
// OfflineMapBadge, so it can never flash during server render / first
// paint.
//
// Intentionally a plain <div> (no animations): an outage is not a moment
// for motion, and a full-width strip needs no framer overhead.
// ---------------------------------------------------------------------

import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff } from "lucide-react";

export default function PublicOfflineBanner() {
  const offline = useOfflineStatus();

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex w-full items-center justify-center gap-2 border-b border-severity-amber-500/40 bg-severity-amber-500/15 px-4 py-2 backdrop-blur-sm"
    >
      <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0 text-severity-amber-300" />
      <p className="text-center text-xs font-bold text-severity-amber-300">
        Offline Mode — Using cached route data. Verify conditions before proceeding.
      </p>
    </div>
  );
}