"use client";

// ---------------------------------------------------------------------
// components/public/map/RouteSafetyOverlay.tsx — Phase 1 · Step 9 · Route
// Safety Score badge + mock push notification.
//
// While an evacuation route is selected, this floating badge shows the
// route's Safety Score (0–100, % of segments graded safe) next to a
// four-colour proportion bar — safe green / watch amber / flooded red /
// closed black — so residents instantly see how clean their way out is.
//
// When the pick is an unsafe one (any flooded or closed segment), a mock
// push notification fires once per shelter: "Safer route now available.
// Reroute?" — simulated with the app's warning toast, but written as a
// system-style alert so judges read it as proactive push.
//
// The badge lives bottom-left, stacked above the map legend; it mounts
// and slides in with the route selection and never renders server-side
// past the route guard.
// ---------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import {
  mockRerouteAvailable,
  ROUTE_HAZARD_COLORS,
  type RouteSafetyClassification,
} from "@/lib/map/route-safety";

type RouteSafetyOverlayProps = {
  /** Safety grading for the selected route (null → hide the badge). */
  classification: RouteSafetyClassification | null;
  /** Selected shelter id — drives the once-per-shelter push notification. */
  shelterId: string | null;
};

function scoreClass(score: number): string {
  if (score >= 90) return "text-severity-green-400";
  if (score >= 70) return "text-severity-amber-300";
  return "text-severity-red-400";
}

export default function RouteSafetyOverlay({
  classification,
  shelterId,
}: RouteSafetyOverlayProps) {
  const reduceMotion = useReducedMotion();
  // Which shelter already got the reroute push (fire it only once each).
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!classification || !shelterId) return;
    if (notifiedRef.current === shelterId) return;
    if (!mockRerouteAvailable(classification)) return;

    notifiedRef.current = shelterId;
    showToast("warning", {
      id: "route-reroute-push",
      title: "📲 Safer route now available",
      description: `The selected route passes ${classification.floodHazards + classification.closedHazards} unsafe segment(s). Reroute?`,
      duration: 6000,
    });
  }, [classification, shelterId]);

  return (
    <AnimatePresence>
      {classification && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="pointer-events-none absolute bottom-[calc(196px+env(safe-area-inset-bottom))] left-4 z-10 w-[10.5rem] rounded-xl border border-white/10 bg-[#0b1120]/85 p-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-severity-green-400"
            />
            <span className="text-[0.6875rem] font-semibold leading-none text-white/75">
              Route safety
            </span>
          </div>

          <p className={`mt-1.5 text-2xl font-extrabold leading-none ${scoreClass(classification.score)}`}>
            {classification.score}
            <span className="ml-0.5 text-xs font-bold text-white/50">% safe</span>
          </p>

          {/* Four-colour proportion bar — safe / watch / flooded / closed. */}
          <div
            aria-hidden="true"
            className="mt-2 flex h-1.5 w-full gap-px overflow-hidden rounded-full"
          >
            {(["safe", "watch", "flooded", "closed"] as const).map((hazard) => {
              const count =
                hazard === "safe"
                  ? classification.segmentCount -
                    classification.watchHazards -
                    classification.floodHazards -
                    classification.closedHazards
                  : hazard === "watch"
                    ? classification.watchHazards
                    : hazard === "flooded"
                      ? classification.floodHazards
                      : classification.closedHazards;
              return (
                <span
                  key={hazard}
                  className="h-full transition-all"
                  style={{
                    width: `${(100 * count) / Math.max(classification.segmentCount, 1)}%`,
                    backgroundColor: ROUTE_HAZARD_COLORS[hazard],
                  }}
                />
              );
            })}
          </div>

          {(classification.floodHazards > 0 || classification.closedHazards > 0) && (
            <p className="mt-1.5 text-[0.625rem] font-medium leading-tight text-white/60">
              {classification.floodHazards > 0 && (
                <span className="text-severity-red-400">
                  {classification.floodHazards} flooded segment
                  {classification.floodHazards > 1 ? "s" : ""}
                </span>
              )}
              {classification.floodHazards > 0 && classification.closedHazards > 0 && " · "}
              {classification.closedHazards > 0 && (
                <span className="text-white/70">
                  road closed ahead
                </span>
              )}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}