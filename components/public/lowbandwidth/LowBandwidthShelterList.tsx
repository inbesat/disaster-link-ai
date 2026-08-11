// ---------------------------------------------------------------------
// components/public/lowbandwidth/LowBandwidthShelterList.tsx — Phase 13 ·
// Step 2 · text-only shelter list.
//
// Replaces the MapLibre map on /public/map (and anything map-like) while
// extreme low-bandwidth mode is active: three nearest shelters rendered as
// a plain-text list — no tiles, no images, <1KB of HTML. Reuses the exact
// mock shelters + distance helper the map pins come from, so the story
// stays consistent between normal and data-saver views.
// ---------------------------------------------------------------------

import { MapPin } from "lucide-react";
import { CITIZEN_MAP_DEFAULTS } from "@/lib/map/citizen-view";
import {
  CITIZEN_SHELTERS,
  shelterDistanceKm,
  shelterStatus,
} from "@/lib/map/citizen-shelters";

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  filling: "Filling up",
  full: "Full — do not go",
};

export function LowBandwidthShelterList() {
  const { center } = CITIZEN_MAP_DEFAULTS;

  // Nearest 3 shelters to the demo base location, cheapest data first.
  const nearest = [...CITIZEN_SHELTERS]
    .map((shelter) => ({
      shelter,
      distanceKm: shelterDistanceKm(shelter, center.lat, center.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  return (
    <section aria-label="Nearest shelters (text mode)" className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="eoc-label text-[var(--dl-text-muted)]">NEAREST SHELTERS · TEXT MODE</p>
        <span className="rounded-full border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--dl-orange-light)]">
          ~0.5 KB
        </span>
      </div>

      <ul className="space-y-2.5">
        {nearest.map(({ shelter, distanceKm }) => {
          const status = shelterStatus(shelter);
          return (
            <li
              key={shelter.id}
              className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <MapPin
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-[var(--dl-orange-light)]"
                  />
                  {shelter.name}
                </p>
                <p className="shrink-0 text-xs font-semibold text-[var(--dl-orange-light)]">
                  {distanceKm.toFixed(1)} km
                </p>
              </div>
              <p className="mt-1.5 text-[0.6875rem] text-[var(--dl-text-muted)]">
                {shelter.occupancy}/{shelter.capacity} occupied ·{" "}
                <span
                  className={
                    status === "full"
                      ? "font-semibold text-severity-red-400"
                      : status === "filling"
                        ? "font-semibold text-severity-amber-400"
                        : "font-semibold text-severity-green-400"
                  }
                >
                  {STATUS_LABEL[status]}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default LowBandwidthShelterList;
