"use client";

// ---------------------------------------------------------------------
// components/public/GoogleMapsButton.tsx — Phase 1 · Steps 6 + 10 ·
// "Open in Google Maps" deep link (online) / offline route fallback.
//
// ONLINE — a prominent hand-off button that lets citizens leave DRIP and
// continue navigating in Google Maps. Clicking it shows a quick overlay
// card ("You are leaving DRIP to open Google Maps. Route: Origin →
// Destination. ETA: X min") with a Cancel escape hatch, then auto-
// redirects to the Google Maps walking-directions URL after 2 seconds.
//
// OFFLINE (Step 10) — Google Maps is unreachable without a network, so
// the same button degrades to a neutral "View Offline Route" action that
// opens a directions panel built from the cached mock geometry
// (lib/offline/step-directions): "Head north-east for 1.2 km", … "You
// have arrived". No URL, no redirect — just a straight-line interpolation
// of the same route the map renders.
//
// The URL is built by the pure helper in lib/map/google-maps-directions
// (strict deep-link format); ETA comes from the same module. The overlay
// uses a fixed-position backdrop + framer-motion AnimatePresence, and the
// auto-redirect timer is cleaned up on unmount / cancel (and never armed
// while offline).
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Map, Navigation, X } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import {
  estimateGoogleMapsEtaMinutes,
  googleMapsDirectionsUrl,
} from "@/lib/map/google-maps-directions";
import {
  buildStepDirections,
  type OfflineStep,
} from "@/lib/offline/step-directions";

/** Seconds to wait on the overlay before auto-redirecting. */
export const REDIRECT_DELAY_MS = 2000;

export type GoogleMapsButtonProps = {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  /** Short label shown as "Origin" on the overlay, e.g. "My location". */
  originLabel?: string;
  /** Short label shown as "Destination", e.g. "Patna Central Hall". */
  destinationLabel?: string;
};

export default function GoogleMapsButton({
  originLat,
  originLng,
  destLat,
  destLng,
  originLabel = "Origin",
  destinationLabel = "Destination",
}: GoogleMapsButtonProps) {
  const [open, setOpen] = useState(false);
  const offline = useOfflineStatus();

  const url = googleMapsDirectionsUrl(originLat, originLng, destLat, destLng);
  const etaMinutes = estimateGoogleMapsEtaMinutes(
    originLat,
    originLng,
    destLat,
    destLng,
  );

  // Step 10 — offline fallback steps, computed only while disconnected.
  const offlineSteps = useMemo<OfflineStep[]>(() => {
    if (!offline) return [];
    return buildStepDirections([
      [originLng, originLat],
      [destLng, destLat],
    ]);
  }, [offline, originLat, originLng, destLat, destLng]);

  // Auto-redirect after 2s once the online overlay is shown. Never armed
  // offline — the offline panel has no redirect.
  useEffect(() => {
    if (!open || offline) return;
    const timer = window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setOpen(false);
    }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open, offline, url]);

  return (
    <>
      {offline ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-amber-400"
        >
          <Map aria-hidden="true" className="h-4 w-4" />
          View Offline Route
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--dl-blue)] px-4 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition hover:bg-blue-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-blue)]"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          Open in Google Maps
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-70" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={offline ? "Offline route directions" : "Leaving DRIP"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative w-full max-w-sm rounded-[var(--dl-radius-sm)] border border-white/15 bg-panel-deep p-5 text-[var(--dl-text-on-navy)] shadow-[var(--dl-shadow-soft)]"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={offline ? "Close offline directions" : "Cancel redirect"}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-white/25 hover:text-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>

              {offline ? (
                <>
                  <p className="text-sm font-bold text-white">Offline directions</p>
                  <p className="mt-1 text-xs text-[var(--dl-text-muted)]">
                    No network — using cached route data. {originLabel} →{" "}
                    {destinationLabel}.
                  </p>
                  <ol className="mt-4 space-y-2.5">
                    {offlineSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-severity-amber-500/40 bg-severity-amber-500/15 text-[0.625rem] font-bold text-severity-amber-300">
                          {step.bearingLabel}
                        </span>
                        <span className="pt-0.5 text-xs font-medium leading-relaxed text-white/85">
                          {step.instruction}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 rounded-lg border border-severity-amber-500/30 bg-severity-amber-500/10 px-3 py-2 text-[0.6875rem] font-semibold text-severity-amber-300">
                    Verify conditions before proceeding.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">
                    You are leaving DRIP to open Google Maps.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--dl-text-muted)]">
                    <span className="max-w-[40%] truncate rounded-md bg-white/5 px-2 py-1">
                      {originLabel}
                    </span>
                    <span aria-hidden="true" className="text-[var(--dl-orange-light)]">
                      →
                    </span>
                    <span className="max-w-[40%] truncate rounded-md bg-white/5 px-2 py-1">
                      {destinationLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--dl-text-muted)]">
                    ETA: <span className="font-bold text-white">{etaMinutes} min</span>{" "}
                    (walking)
                  </p>

                  {/* 2s countdown bar */}
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: REDIRECT_DELAY_MS / 1000, ease: "linear" }}
                      className="h-full rounded-full bg-[var(--dl-blue)]"
                    />
                  </div>

                  <p className="mt-2 text-center text-[0.6875rem] text-[var(--dl-text-muted)]">
                    Redirecting in {REDIRECT_DELAY_MS / 1000}s…
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}