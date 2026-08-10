"use client";

// ---------------------------------------------------------------------
// components/public/map/ShelterMarkers.tsx — Phase 4 · Step 4 · Shelter
// markers + Framer Motion bottom sheet.
//
// Renders every mock shelter as a massive 40px tappable 🏠 marker,
// colour-coded strictly by capacity:
//   • Green  — available (space to spare)
//   • Amber  — filling up fast
//   • Red    — FULL — Do Not Go
//
// Tapping a marker fits the camera to the route (origin → shelter) and
// slides a bottom sheet up from the bottom of the screen showing the
// shelter name, distance, capacity readout, facility chips (food /
// medical) and a massive "Navigate Here" button that switches into
// Step 6 guidance mode (the sheet closes, the TurnByTurnNav overlay
// takes over the top of the screen, and the route stays drawn).
//
// The sheet renders through a portal to <body> so it is never trapped
// inside the map's own positioning context (fixed still means "pinned to
// the viewport"). Selection state lives in PublicMap so the evacuation
// route layer can draw the matching path.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Marker, useMap } from "react-map-gl/maplibre";
import { Footprints, Navigation, Stethoscope, UtensilsCrossed, X } from "lucide-react";
import {
  CITIZEN_SHELTERS,
  shelterDistanceKm,
  shelterOccupancyPct,
  shelterStatus,
  type CitizenShelter,
  type CitizenShelterStatus,
} from "@/lib/map/citizen-shelters";

const STATUS_META: Record<
  CitizenShelterStatus,
  { label: string; badge: string; marker: string; bar: string }
> = {
  available: {
    label: "Available",
    badge: "border-severity-green-500/40 bg-severity-green-500/15 text-severity-green-300",
    marker: "bg-severity-green-500",
    bar: "bg-severity-green-500",
  },
  filling: {
    label: "Filling Up",
    badge: "border-severity-amber-500/40 bg-severity-amber-500/15 text-severity-amber-300",
    marker: "bg-severity-amber-500",
    bar: "bg-severity-amber-500",
  },
  full: {
    label: "Full — Do Not Go",
    badge: "border-severity-red-500/40 bg-severity-red-500/15 text-severity-red-300",
    marker: "bg-severity-red-500",
    bar: "bg-severity-red-500",
  },
};

type ShelterMarkersProps = {
  /** Citizen's current location — route origin + distance reference. */
  origin: { lat: number; lng: number };
  /** Id of the shelter whose sheet is open (drives the route layer too). */
  selectedShelterId: string | null;
  /** Tap a marker → open its sheet; dismiss → null. */
  onSelect: (id: string | null) => void;
  /** True while guidance mode is active — hides the sheet, keeps the route. */
  navigating: boolean;
  /** Tap "Navigate Here" on the sheet → enter guidance mode for this shelter. */
  onNavigate: (shelter: CitizenShelter) => void;
};

export default function ShelterMarkers({
  origin,
  selectedShelterId,
  onSelect,
  navigating,
  onNavigate,
}: ShelterMarkersProps) {
  const { current: map } = useMap();

  const selected =
    selectedShelterId === null
      ? null
      : CITIZEN_SHELTERS.find((s) => s.id === selectedShelterId) ?? null;

  const handleSelect = useCallback(
    (shelter: CitizenShelter) => {
      if (selected?.id === shelter.id) {
        onSelect(null);
        return;
      }
      // Fit origin + shelter (and therefore the route) into view.
      map?.fitBounds(
        [
          [Math.min(origin.lng, shelter.lng), Math.min(origin.lat, shelter.lat)],
          [Math.max(origin.lng, shelter.lng), Math.max(origin.lat, shelter.lat)],
        ],
        { padding: { top: 120, bottom: 240, left: 48, right: 48 }, duration: 1200, maxZoom: 14 },
      );
      onSelect(shelter.id);
    },
    [map, onSelect, origin, selected?.id],
  );

  return (
    <>
      {CITIZEN_SHELTERS.map((shelter) => (
        <ShelterMarker
          key={shelter.id}
          shelter={shelter}
          distanceKm={shelterDistanceKm(shelter, origin.lat, origin.lng)}
          isSelected={shelter.id === selectedShelterId}
          onTap={() => handleSelect(shelter)}
        />
      ))}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selected && !navigating && (
              <ShelterSheet
                key={selected.id}
                shelter={selected}
                distanceKm={shelterDistanceKm(selected, origin.lat, origin.lng)}
                onNavigate={() => onNavigate(selected)}
                onClose={() => onSelect(null)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// ---------------------------------------------------------------------
// Marker — a big, tappable 🏠 pin. 40px + status colour, with a white
// ring when its sheet is open.
// ---------------------------------------------------------------------

type ShelterMarkerProps = {
  shelter: CitizenShelter;
  distanceKm: number;
  isSelected: boolean;
  onTap: () => void;
};

function ShelterMarker({ shelter, distanceKm, isSelected, onTap }: ShelterMarkerProps) {
  const status = shelterStatus(shelter);
  const meta = STATUS_META[status];

  return (
    <Marker
      longitude={shelter.lng}
      latitude={shelter.lat}
      anchor="bottom"
      style={{ zIndex: isSelected ? 10 : undefined }}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={`${shelter.name}, ${distanceKm.toFixed(1)} km away, ${meta.label}`}
        aria-pressed={isSelected}
        // `anchor="bottom"` on the Marker already centers the pin
        // horizontally, so no translate is needed here.
        className={`group flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          isSelected
            ? "scale-110 border-white ring-2 ring-white/40"
            : "border-white/25 group-hover:scale-105"
        } ${meta.marker} ${status === "full" ? "opacity-90" : ""}`}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          🏠
        </span>
      </button>
    </Marker>
  );
}

// ---------------------------------------------------------------------
// Bottom sheet — slides up with a spring, fades in a backdrop. Pinned
// above the citizen BottomNav (z-50 vs z-40) and width-matched to it.
// ---------------------------------------------------------------------

type ShelterSheetProps = {
  shelter: CitizenShelter;
  distanceKm: number;
  onNavigate: () => void;
  onClose: () => void;
};

function ShelterSheet({ shelter, distanceKm, onNavigate, onClose }: ShelterSheetProps) {
  const status = shelterStatus(shelter);
  const meta = STATUS_META[status];
  const pct = shelterOccupancyPct(shelter);
  const isFull = status === "full";
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the sheet when it opens and let Escape dismiss it —
  // the sheet claims aria-modal, so it should behave like a dialog.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — tap to dismiss. */}
      <motion.div
        key="shelter-sheet-backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60"
      />

      <motion.section
        key="shelter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelter-sheet-title"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#0F2A4F]/95 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-2xl backdrop-blur-xl"
      >
        {/* Grab handle */}
        <div aria-hidden="true" className="flex justify-center pt-3">
          <span className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-4">
          {/* Header row: status badge + close */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.badge}`}
            >
              {isFull ? "⚠" : status === "available" ? "✓" : "◐"} {meta.label}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close shelter details"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* Name + distance */}
          <h2
            id="shelter-sheet-title"
            className="mt-3 text-lg font-bold leading-snug text-white"
          >
            {shelter.name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--dl-text-muted)]">
            <Footprints aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
            <span className="font-semibold text-white">{distanceKm.toFixed(1)} km</span>
            from your location
          </p>

          {/* Capacity readout + bar */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
                Capacity
              </span>
              <span className="tabular-nums text-white">
                <span className="font-bold">{shelter.occupancy}</span>/{shelter.capacity} beds
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={`${pct} percent of beds occupied`}
            >
              <div
                className={`h-full rounded-full ${meta.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Facility chips */}
          <div className="mt-4 flex gap-2">
            {shelter.medical && <FacilityChip icon={Stethoscope} label="Medical" />}
            {shelter.food && <FacilityChip icon={UtensilsCrossed} label="Food" />}
            {!shelter.medical && !shelter.food && (
              <span className="text-xs text-[var(--dl-text-muted)]">Basic shelter only</span>
            )}
          </div>

          {/* Massive CTA */}
          {isFull ? (
            <button
              type="button"
              disabled
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-severity-red-500/50 bg-severity-red-500/10 text-base font-bold text-severity-red-300"
            >
              <Navigation aria-hidden="true" className="h-5 w-5" />
              Full — Do Not Go
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigate}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--dl-orange)] text-base font-bold text-white shadow-[0_8px_24px_rgba(249,115,22,0.4)] transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
            >
              <Navigation aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
              Navigate Here
            </button>
          )}
        </div>
      </motion.section>
    </>
  );
}

function FacilityChip({ icon: Icon, label }: { icon: typeof Stethoscope; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[var(--dl-text-on-navy)]">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-[var(--dl-orange-light)]" />
      {label}
    </span>
  );
}
