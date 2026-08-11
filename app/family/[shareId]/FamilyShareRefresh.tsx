"use client";

// ---------------------------------------------------------------------
// app/family/[shareId]/FamilyShareRefresh.tsx — Phase 13 · Step 9 ·
// "Refresh Status" client island for the read-only share page.
//
// The page itself is a Server Component (panic-simple, works with JS
// disabled); this small island adds the refresh affordance: a simulated
// network fetch (~1.2s) that re-resolves the citizen from the shareId,
// haptics on tap, and a spinner while "in flight". The status itself is
// deterministic per shareId, so a refresh re-confirms the same status
// with a fresh "last updated" stamp — exactly what a worried relative
// needs (confirmation, not churn).
// ---------------------------------------------------------------------

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getSharedCitizen, type SharedCitizen } from "@/lib/mock-data/family-share";
import { formatSavedAt } from "@/lib/mock-data/hazard-zones";
import { triggerLightHaptic } from "@/hooks/useHaptics";

const REFRESH_MS = 1200;

type Props = {
  shareId: string;
  /** The citizen snapshot the server rendered (initial state). */
  initial: SharedCitizen;
};

export function FamilyShareRefresh({ shareId, initial }: Props) {
  const [citizen, setCitizen] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    triggerLightHaptic();
    // Mock network fetch — re-resolve the citizen from the shareId.
    window.setTimeout(() => {
      const next = getSharedCitizen(shareId);
      if (next) setCitizen(next);
      setRefreshing(false);
    }, REFRESH_MS);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--dl-orange)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[#EA5B0C] active:scale-[0.99] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {refreshing ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw aria-hidden="true" className="h-5 w-5" />
        )}
        {refreshing ? "Checking…" : "Refresh Status"}
      </button>
      <p className="text-center text-[0.8125rem] text-[var(--dl-text-on-navy)]/70">
        Last updated {formatSavedAt(citizen.updatedAt.toISOString()) ?? "…"}
      </p>
    </div>
  );
}

export default FamilyShareRefresh;
