import type { ReactNode } from "react";
import PreviewModeBanner from "@/components/gov/PreviewModeBanner";
import PublicAlertHost from "@/components/public/PublicAlertHost";

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
// ---------------------------------------------------------------------
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreviewModeBanner />
      {children}
      <PublicAlertHost />
    </>
  );
}
