"use client";

// ---------------------------------------------------------------------
// hooks/useAlertPreferences.ts — Phase 3 · Step 5 · citizen alert
// preferences hook.
//
// Hydration-safe wrapper over lib/mock-data/alert-preferences.ts:
// starts at the defaults on BOTH server render and first client paint
// (so toggles never flash), then swaps in the persisted value right
// after mount. `setPreferences` writes through to localStorage on every
// change, so the alerts page and the settings page stay in sync.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  DEFAULT_ALERT_PREFERENCES,
  readAlertPreferences,
  writeAlertPreferences,
  type AlertPreferences,
} from "@/lib/mock-data/alert-preferences";

export function useAlertPreferences() {
  // Server + first client paint agree on defaults; real value arrives
  // post-hydration (same pattern as LiveClock / PullToRefresh).
  const [preferences, setPreferences] = useState<AlertPreferences>(
    DEFAULT_ALERT_PREFERENCES,
  );

  useEffect(() => {
    setPreferences(readAlertPreferences());
  }, []);

  const update = (next: AlertPreferences) => {
    setPreferences(next);
    writeAlertPreferences(next);
  };

  return { preferences, setPreferences: update };
}

export default useAlertPreferences;
