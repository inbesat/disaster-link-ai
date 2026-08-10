"use client";

// ---------------------------------------------------------------------
// components/public/PublicAlertHost.tsx — Phase 3 · Step 10 · shared
// citizen-alert chrome.
//
// Mounted once in app/public/layout.tsx so every /public page gets:
//
//   • CriticalAlertOverlay — the full-screen takeover. It opens via the
//     drip:citizen-critical-alert window event, which is fired by either
//     the alerts page's once-per-session auto-trigger OR the
//     AlertDemoTrigger's \"Simulate CRITICAL Overlay\" button (so judges
//     can fire it from any page, repeatedly). Dismissing persists the
//     session flag so the auto-trigger doesn't nag again.
//   • AlertDemoTrigger — the bottom-left Dev Tools launcher.
//
// The overlay lives here instead of on the alerts page so the takeover
// works everywhere without duplicating mounts (single-instance pattern).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import AlertDemoTrigger from "@/components/public/AlertDemoTrigger";
import CriticalAlertOverlay, {
  CRITICAL_OVERLAY_SESSION_KEY,
} from "@/components/public/CriticalAlertOverlay";
import { CITIZEN_CRITICAL_ALERT_EVENT } from "@/lib/mock-data/public-alerts";

export function PublicAlertHost() {
  const [criticalOpen, setCriticalOpen] = useState(false);

  useEffect(() => {
    const onCritical = () => setCriticalOpen(true);
    window.addEventListener(CITIZEN_CRITICAL_ALERT_EVENT, onCritical);
    return () =>
      window.removeEventListener(CITIZEN_CRITICAL_ALERT_EVENT, onCritical);
  }, []);

  const dismissCritical = () => {
    setCriticalOpen(false);
    try {
      window.sessionStorage.setItem(CRITICAL_OVERLAY_SESSION_KEY, "1");
    } catch {
      // storage unavailable — the overlay still closes for this render
    }
  };

  return (
    <>
      <AlertDemoTrigger />
      <CriticalAlertOverlay
        open={criticalOpen}
        onDismiss={dismissCritical}
        onAction={dismissCritical}
      />
    </>
  );
}

export default PublicAlertHost;
