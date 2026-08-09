"use client";

// ---------------------------------------------------------------------
// hooks/useOnlineStatus.ts
// UI/UX Phase 9 · Step 9 — live connectivity hook.
//
// Subscribes a single set of window listeners ('online' / 'offline') and
// returns a boolean that flips with the browser's network state. Used by
// components/ui/OfflineBanner.tsx (and anything else that needs to react
// to connectivity — map overlays, sync indicators, field forms, …).
//
// SSR note: the hook starts with `true` on BOTH the server render and the
// client's first paint so hydration never mismatches (the banner can't
// exist on the server, so it can never be revealed during hydration).
// The effect then corrects the real state right after mount, and the
// 'online'/'offline' events keep it current from there.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";

/** Current network state — defaults to online when navigator is absent. */
function readNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Correct the initial paint value (the browser may already be offline).
    setOnline(readNavigatorOnline());

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

export default useOnlineStatus;
