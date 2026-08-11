"use client";

// ---------------------------------------------------------------------
// components/public/sos/NearestHelpCard.tsx — Phase 5 · Step 6 · the
// "Nearest Help" auto-finder.
//
// While an SOS is active (Emergency Mode), a card appears directly on
// the public dashboard: "Help Nearby", listing the three closest help
// entities — Police Station, Govt Hospital, Relief Camp — with their
// distance computed from the citizen's saved location (haversine, same
// helper as the shelters). Each row has a one-tap navigate arrow that
// deep-links into Google Maps walking directions.
//
// Renders nothing when no SOS is active, so it can be mounted
// unconditionally as a client island in the server dashboard page.
// ---------------------------------------------------------------------

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  LifeBuoy,
  Navigation,
  Shield,
  Tent,
  type LucideIcon,
} from "lucide-react";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import {
  nearestHelpList,
  type NearestHelpEntry,
} from "@/lib/mock-data/nearest-help";
import { useSOS } from "./SOSContext";

const PLACE_ICONS: Record<string, LucideIcon> = {
  police: Shield,
  hospital: HeartPulse,
  camp: Tent,
};

export default function NearestHelpCard() {
  const { emergency } = useSOS();

  const { entries, origin } = useMemo(() => {
    const view = resolveCitizenMapView(readCitizenLocation());
    return {
      entries: nearestHelpList(view.center.lat, view.center.lng),
      origin: view.center,
    };
  }, []);

  if (!emergency) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      aria-label="Help nearby"
      className="rounded-[var(--dl-radius-sm)] border border-severity-red-500/40 bg-severity-red-500/[0.06] p-4 backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-severity-red-500/15 ring-1 ring-severity-red-500/40">
          <LifeBuoy aria-hidden="true" className="h-[18px] w-[18px] text-severity-red-300" />
        </span>
        <div>
          <h2 className="text-base font-bold text-white">Help Nearby</h2>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
            Closest help while you wait
          </p>
        </div>
      </div>

      {/* Entities with computed distances */}
      <ul className="mt-3 space-y-1">
        {entries.map((entry) => (
          <NearestHelpRow key={entry.id} entry={entry} origin={origin} />
        ))}
      </ul>
    </motion.section>
  );
}

function NearestHelpRow({
  entry,
  origin,
}: {
  entry: NearestHelpEntry;
  origin: { lat: number; lng: number };
}) {
  const Icon = PLACE_ICONS[entry.id] ?? Shield;
  const directionsUrl = useMemo(() => {
    const params = new URLSearchParams({
      api: "1",
      origin: `${origin.lat},${origin.lng}`,
      destination: `${entry.lat},${entry.lng}`,
      travelmode: "walking",
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [entry, origin]);

  return (
    <li>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-400"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
          <Icon aria-hidden="true" className="h-[18px] w-[18px] text-white/85" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">
            {entry.name}
          </span>
          <span className="block text-xs font-semibold tabular-nums text-[var(--dl-text-muted)]">
            {entry.distanceKm.toFixed(1)} km away
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition group-hover:border-severity-red-400/60 group-hover:bg-severity-red-500/20 group-hover:text-white"
        >
          <Navigation className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </a>
    </li>
  );
}
