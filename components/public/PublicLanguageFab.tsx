"use client";

// ---------------------------------------------------------------------
// components/public/PublicLanguageFab.tsx — mobile-only language picker
// for the citizen portal.
//
// The desktop PublicSidebar carries a LanguageSelector in its footer, but
// on <md the sidebar is hidden and citizens navigate via the BottomNav.
// This floating pill sits above the bottom nav (left edge, clear of the
// NovaChat FAB), so the language switch is one tap from EVERY /public
// page. Hidden during an active SOS (emergency lockdown) and in extreme
// low-bandwidth mode where the chrome drops to the essentials.
// ---------------------------------------------------------------------

import LanguageSelector from "@/components/ui/LanguageSelector";
import { useSOS } from "@/components/public/sos/SOSContext";
import { useBandwidth } from "@/lib/contexts/BandwidthContext";

export default function PublicLanguageFab() {
  const { emergency } = useSOS();
  const { isLowBandwidthMode } = useBandwidth();

  if (emergency || isLowBandwidthMode) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-3 z-[60] md:hidden">
      <LanguageSelector />
    </div>
  );
}