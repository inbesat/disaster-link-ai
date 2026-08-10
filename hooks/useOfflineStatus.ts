"use client";

// ---------------------------------------------------------------------
// hooks/useOfflineStatus.ts — Phase 3 · Step 7 · connectivity hook.
//
// Thin inversion of the battle-tested hooks/useOnlineStatus.ts (single
// online/offline listener pair, hydration-safe: starts online on both
// server render and first client paint, corrected right after mount).
// The alerts page drives its amber "cached alerts" banner from this.
// ---------------------------------------------------------------------

import useOnlineStatus from "@/hooks/useOnlineStatus";

export function useOfflineStatus(): boolean {
  return !useOnlineStatus();
}

export default useOfflineStatus;
