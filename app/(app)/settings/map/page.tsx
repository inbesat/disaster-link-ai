import type { Metadata } from "next";
import MapSettingsWrapper from "@/components/settings/MapSettingsWrapper";

export const metadata: Metadata = {
  title: "Map & Display | Settings | DRIP",
};

// ---------------------------------------------------------------------
// app/(app)/settings/map/page.tsx — Map & GIS Settings (Phase 3 · Step 1).
//
// Thin server shell. The full interactive layout (Default View, Layer
// Preferences, Display Options, Data Refresh & Offline Cache) lives in
// MapSettingsWrapper, wired to the shared MapSettingsContext so the
// command-center map reads every change immediately.
// ---------------------------------------------------------------------

export default function MapSettingsPage() {
  return <MapSettingsWrapper />;
}