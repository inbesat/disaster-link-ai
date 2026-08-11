"use client";

// ---------------------------------------------------------------------
// components/public/map/TurnByTurnNav.tsx — Phase 4 · Step 6 · Simplified
// turn-by-turn guidance overlay.
//
// Mounted at the top of the citizen map when the user taps "Navigate
// Here". Shows one maneuver at a time in panic-proof, high-contrast
// fashion: a massive directional arrow, big instruction text ("Turn Left
// in 200 meters"), a walking ETA sub-line, progress dots, and a red
// circular "Exit Navigation" button.
//
// Maneuvers auto-advance every few seconds until the arrival step, then
// hold (the flag + "You have arrived"). The step sequence comes from
// buildCitizenNavigation() (lib/map/citizen-navigation.ts) so it always
// matches the route the map is drawing. Screen readers get the current
// instruction via aria-live.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ExternalLink,
  Flag,
  X,
} from "lucide-react";
import type { CitizenShelter } from "@/lib/map/citizen-shelters";
import { buildCitizenNavigation, type NavArrow } from "@/lib/map/citizen-navigation";

/** Arrow key → icon. `arrived` renders a flag instead of a turn arrow. */
const ARROW_ICONS: Record<NavArrow, typeof ArrowUp> = {
  up: ArrowUp,
  "up-right": ArrowUpRight,
  right: ArrowRight,
  "down-right": ArrowDownRight,
  down: ArrowDown,
  "down-left": ArrowDownLeft,
  left: ArrowLeft,
  "up-left": ArrowUpLeft,
  arrived: Flag,
};

/** How long each maneuver stays on screen before advancing. */
const STEP_MS = 4200;

type TurnByTurnNavProps = {
  /** Shelter the citizen is walking to. */
  shelter: CitizenShelter;
  /** Citizen's current location — route origin for the ETA. */
  origin: { lat: number; lng: number };
  /** Tap the red X → leave guidance mode. */
  onExit: () => void;
};

export default function TurnByTurnNav({ shelter, origin, onExit }: TurnByTurnNavProps) {
  const nav = useMemo(
    () => buildCitizenNavigation(origin.lat, origin.lng, shelter),
    [origin, shelter],
  );
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  const step = nav.steps[stepIndex];
  const isArrived = step.arrow === "arrived";
  const ArrowIcon = ARROW_ICONS[step.arrow];

  // Navigating to a different shelter resets the sequence.
  useEffect(() => {
    setStepIndex(0);
  }, [shelter.id]);

  // Escape leaves guidance mode — same convention as the shelter sheet.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  // Auto-advance one maneuver at a time; hold on arrival.
  useEffect(() => {
    if (stepIndex >= nav.steps.length - 1) return;
    const timer = window.setTimeout(
      () => setStepIndex((i) => Math.min(i + 1, nav.steps.length - 1)),
      STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [stepIndex, nav.steps.length]);

  const directionsUrl = useMemo(() => {
    const params = new URLSearchParams({
      api: "1",
      origin: `${origin.lat},${origin.lng}`,
      destination: `${shelter.lat},${shelter.lng}`,
      travelmode: "walking",
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [origin, shelter]);

  return (
    <div className="absolute inset-x-0 top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <motion.section
        role="region"
        aria-label={`Turn-by-turn navigation to ${shelter.name}`}
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -72, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 30,
          mass: 0.9,
          ...(reduceMotion ? { type: "tween", duration: 0 } : {}),
        }}
        className={`rounded-2xl border bg-[#0a1120]/92 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
          isArrived ? "border-severity-green-500/40" : "border-white/10"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Massive directional arrow */}
          <div
            aria-hidden="true"
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${
              isArrived ? "bg-severity-green-500/15 text-severity-green-400" : "bg-[var(--dl-orange)]/15 text-[var(--dl-orange)]"
            }`}
          >
            <ArrowIcon
              className={isArrived ? "h-11 w-11" : "h-14 w-14"}
              strokeWidth={2.25}
            />
          </div>

          {/* Instruction + ETA — re-announced on every maneuver change */}
          <div className="min-w-0 flex-1" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
              >
                <p className="text-[1.375rem] font-extrabold leading-tight text-white">
                  {step.instruction}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--dl-text-muted)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--dl-orange)]" />
                  ETA: {nav.etaMinutes} mins · {nav.distanceKm.toFixed(1)} km
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Red circular Exit Navigation */}
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit navigation"
            title="Exit navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-severity-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition hover:brightness-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-400"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.75} />
          </button>
        </div>

        {/* Footer: progress dots + step counter + real Maps deep link */}
        <div className="mt-3 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5"
            role="img"
            aria-label={`Maneuver ${stepIndex + 1} of ${nav.steps.length}`}
          >
            {nav.steps.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? "w-5 bg-[var(--dl-orange)]"
                    : i < stepIndex
                      ? "w-1.5 bg-[var(--dl-orange)]/40"
                      : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--dl-text-muted)] transition hover:text-white"
          >
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
            Open in Maps
          </a>
        </div>
      </motion.section>
    </div>
  );
}
