import { cookies } from "next/headers";
import CitizenSettingsPanel from "@/components/public/settings/CitizenSettingsPanel";

// ---------------------------------------------------------------------
// app/public/settings/page.tsx — Phase 2 · Step 1 · Citizen settings.
//
// Thin server shell: reads the httpOnly `citizen_phone` / `guest_mode`
// cookies (the same ones the public dashboard uses) and hands them to the
// client <CitizenSettingsPanel/>, which owns the whole mobile-first
// settings screen — Personal & Medical Info, Emergency Contacts (Family
// Circle), Alert & Language preferences and Device & Connectivity.
// ---------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default function PublicSettingsPage() {
  const store = cookies();
  const phone = store.get("citizen_phone")?.value ?? "";
  const isGuest = store.get("guest_mode")?.value === "true";

  return <CitizenSettingsPanel initialPhone={phone} isGuest={isGuest} />;
}