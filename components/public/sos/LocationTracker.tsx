"use client";

// ---------------------------------------------------------------------
// components/public/sos/LocationTracker.tsx — Phase 5 · Step 5 · Live
// Location Sharing banner.
//
// A persistent bar that mounts below the Emergency Banner whenever live
// GPS sharing is active — either because an SOS is running (Emergency
// Mode implies sharing) or because the citizen tapped "Share Location"
// in the SOS modal. It shows:
//   • Text:  "Sharing Live GPS with Command Center & Family"
//   • A mock countdown of the sharing duration ("Active for: 29:45")
//   • A pulsing green radar icon to signal active transmission
//
// The countdown runs from 30:00; when it hits zero the session ends (and
// standalone sharing stops itself — an active SOS keeps the bar with
// 00:00 since the banner governs cancellation). A "Stop" pill appears
// only for standalone sharing; during an SOS, cancelling goes through the
// banner's hold-to-cancel.
//
// This bar is STATIC (not fixed) — app/public/layout.tsx wraps it and the
// EmergencyModeBanner in one fixed top stack, so it always lands exactly
// below the banner with no magic-number overlap. The wrapper is
// pointer-events-none; the card opts back in for its Stop button.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radar } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useSOS } from "./SOSContext";

/** Mock sharing window — 30 minutes. */
const SHARE_SECONDS = 30 * 60;

/** 1800 → "30:00", 1785 → "29:45". */
function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LocationTracker() {
  const { emergency, sharingLocation, stopSharingLocation } = useSOS();
  const active = emergency || sharingLocation;

  const [remaining, setRemaining] = useState(SHARE_SECONDS);

  // (Re)start the countdown whenever a sharing session begins.
  useEffect(() => {
    if (!active) return;
    setRemaining(SHARE_SECONDS);
    const timer = window.setInterval(() => {
      setRemaining((current) => (current === 0 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  // Countdown finished → a standalone sharing session ends itself.
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
          <div className="pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-severity-green-500/40 bg-[#06231a]/95 px-3 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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

            {/* Stop — only for standalone sharing (SOS cancellation lives
                in the Emergency banner's hold-to-cancel). */}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
