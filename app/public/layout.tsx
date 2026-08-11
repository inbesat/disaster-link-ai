import type { ReactNode } from "react";
import PreviewModeBanner from "@/components/gov/PreviewModeBanner";
import PublicAlertHost from "@/components/public/PublicAlertHost";
import BandwidthGate from "@/components/public/BandwidthGate";
import { SOSProvider } from "@/components/public/sos/SOSContext";
import SOSModal from "@/components/public/sos/SOSModal";
import EmergencyModeBanner from "@/components/public/sos/EmergencyModeBanner";
import LocationTracker from "@/components/public/sos/LocationTracker";
import SafetyNudge from "@/components/public/sos/SafetyNudge";
import ShakeToSOSHost from "@/components/public/sos/ShakeToSOSHost";
import SahayakChat from "@/components/public/ai/SahayakChat";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { BandwidthProvider } from "@/lib/contexts/BandwidthContext";

// ---------------------------------------------------------------------
// app/public/layout.tsx — Phase 1 · Step 10. Wraps every citizen page
// (/public/*). While a gov official is previewing (view_as_public=true),
// the sticky red PreviewModeBanner renders at the top of every screen so
// they always know they're seeing the citizen app and can return to the
// command center. Citizens and guests never hold that cookie, so the
// banner is invisible to them.
//
// PublicAlertHost (client island, Phase 3 · Steps 9–10) mounts the
// shared citizen-alert chrome: the bottom-left Dev Tools judge trigger
// and the full-screen critical takeover overlay — both event-driven, so
// they work on every /public page.
//
// Phase 5 · Steps 1–5 — SOSProvider gives every /public page a global
// SOS modal (useSOS().open() — the BottomNav SOS tab is the trigger),
// the single SOSModal instance renders once here above every page, the
// EmergencyModeBanner pins a red bar + hold-to-cancel across all pages
// while an SOS is active, and the LocationTracker rides below it while
// live GPS is being shared.
// ---------------------------------------------------------------------
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <SOSProvider>
      {/* Phase 13 · Step 2 — extreme low-bandwidth flag for every /public
          page (maps/images/AI hidden while active). */}
      <BandwidthProvider>
        <PreviewModeBanner />
        {children}
        <PublicAlertHost />

        {/* Phase 13 · Step 3 — install banner: appears above the BottomNav
            when the browser can install the app (beforeinstallprompt) and
            the citizen hasn't dismissed it. Renders nothing otherwise. */}
        <PwaInstallPrompt />
        <SOSModal />

      {/* Phase 5 · Steps 4–5 — one fixed top stack hosts the Emergency
          banner and the live-location tracker, so the tracker always sits
          exactly below the banner (both bars are static; this wrapper is
          fixed and pointer-events-none so empty space never blocks taps). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <EmergencyModeBanner />
        <LocationTracker />
      </div>

      {/* Phase 5 · Step 8 — periodic safety check-in (also triggered via
          the Dev Tools simulator). Never interrupts an active SOS. */}
      <SafetyNudge />

      {/* Phase 5 · Step 9 — Shake-to-SOS (or 3 rapid Spacebar presses on
          desktop). Renders nothing; only opens the SOS modal. */}
      <ShakeToSOSHost />

      {/* Phase 6 · Steps 1–2 — the Sahayak safety companion: FAB + draggable
          bottom sheet with the WhatsApp-style welcome bubble. Hidden in
          low-bandwidth mode (it streams AI tokens — Phase 13 · Step 2). */}
      <BandwidthGate>
        <SahayakChat />
      </BandwidthGate>
      </BandwidthProvider>
    </SOSProvider>
  );
}
