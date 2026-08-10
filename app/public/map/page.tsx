"use client";

// ---------------------------------------------------------------------
// app/public/map/page.tsx — Phase 4 · Steps 1–2 · "Where do I go?"
//
// Full-screen minimalist citizen map. The map owns the whole viewport
// (h-[100dvh]); a floating gradient header gives the back affordance and
// title, and the fixed BottomNav rides on top with safe-area padding.
// PublicMap is loaded client-only (maplibre-gl touches `window`).
// ---------------------------------------------------------------------

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import BottomNav from "@/components/public/BottomNav";

const PublicMap = dynamic(() => import("@/components/public/map/PublicMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--dl-orange)]" />
        <p className="text-sm text-[var(--dl-text-muted)]">
          Loading your map&hellip;
        </p>
      </div>
    </div>
  ),
});

export default function PublicMapPage() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop while the map streams in */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      {/* Map — fills the entire viewport */}
      <div className="absolute inset-0">
        <PublicMap />
      </div>

      {/* Floating gradient header over the map */}
      <header className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#0a1120]/85 via-[#0a1120]/40 to-transparent px-4 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <Link
            href="/public/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur transition hover:border-[var(--dl-orange)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
              <MapIcon aria-hidden="true" className="h-4 w-4 text-[#FDBA74]" />
            </span>
            <div>
              <h1 className="text-base font-bold text-white">Map</h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
                FIND YOUR WAY TO SAFETY
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Citizen bottom nav — Map tab lights up via route matching */}
      <BottomNav />
    </main>
  );
}