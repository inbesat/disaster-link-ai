"use client";

// ---------------------------------------------------------------------
// components/public/sos/LocationTracker.tsx — Phase 5/12 · Live GPS Sharing
// Battery-optimized persistent bar for live location sharing with GPS accuracy indicator.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radar, AlertTriangle } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useSOS } from "./SOSContext";

/** Sharing window — 30 minutes. */
const SHARE_SECONDS = 30 * 60;

/** Format seconds to MM:SS. */
function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LocationTracker() {
  const { emergency, sharingLocation, stopSharingLocation } = useSOS();
  const active = emergency || sharingLocation;

  const [remaining, setRemaining] = useState(SHARE_SECONDS);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Poll geolocation accuracy when active
  useEffect(() => {
    if (!active || typeof window === "undefined" || !("geolocation" in navigator)) return;

    let watchId: number | null = null;

    const startWatch = () => {
      if (document.hidden) return; // Pause polling in background to prevent battery drain
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos.coords.accuracy) {
            setAccuracy(Math.round(pos.coords.accuracy));
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
      );
    };

    const stopWatch = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    startWatch();

    const handleVisibility = () => {
      if (document.hidden) {
        stopWatch();
      } else {
        startWatch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopWatch();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active]);

  // Countdown timer with background throttle check
  useEffect(() => {
    if (!active) return;
    setRemaining(SHARE_SECONDS);

    const timer = window.setInterval(() => {
      if (document.hidden) return; // Throttle timer ticks in background tab
      setRemaining((current) => (current === 0 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active]);

  // Countdown finished → end standalone sharing session
  useEffect(() => {
    if (remaining === 0 && !emergency && sharingLocation) {
      stopSharingLocation();
    }
  }, [remaining, emergency, sharingLocation, stopSharingLocation]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.9 }}
          className={`mx-auto w-full max-w-md px-4 ${
            emergency ? "" : "pt-[env(safe-area-inset-top)]"
          }`}
        >
          <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-xl border border-severity-green-500/40 bg-[#06231a]/95 px-3 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex w-full items-center gap-3">
              {/* Pulsing green radar */}
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-severity-green-500/40 motion-reduce:animate-none"
                />
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-severity-green-500/15 ring-1 ring-severity-green-500/50">
                  <Radar
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin text-severity-green-400 [animation-duration:3s] motion-reduce:animate-none"
                    strokeWidth={2.25}
                  />
                </span>
              </span>

              {/* Copy + countdown */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-bold text-white">
                  Sharing Live GPS with Command Center &amp; Family
                </p>
                <p className="mt-0.5 text-[0.6875rem] font-semibold tabular-nums text-severity-green-300">
                  Active for: {formatDuration(remaining)}
                </p>
              </div>

              {!emergency && (
                <button
                  type="button"
                  onClick={() => {
                    stopSharingLocation();
                    triggerLightHaptic();
                  }}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white/70 transition hover:border-severity-green-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
                >
                  Stop
                </button>
              )}
            </div>

            {/* GPS Accuracy Warning Badge if accuracy > 100m */}
            {accuracy !== null && accuracy > 100 && (
              <div className="flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2 py-1 text-[0.6875rem] text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>Low GPS accuracy (±{accuracy}m) — check sky view</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
