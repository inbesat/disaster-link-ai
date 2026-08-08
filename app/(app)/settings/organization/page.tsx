import type { Metadata } from "next";
import OrgSettingsWrapper from "@/components/settings/org/OrgSettingsWrapper";

export const metadata: Metadata = {
  title: "Organization & District Management | Settings | DRIP",
};

// ---------------------------------------------------------------------
// app/(app)/settings/organization/page.tsx — Organization & District (Phase 5 · Step 1).
//
// Thin server shell. The tabbed layout (Districts & Thresholds, Team &
// Roles, Operational Parameters, Branding) lives in OrgSettingsWrapper.
// ---------------------------------------------------------------------

export default function OrganizationSettingsPage() {
  return <OrgSettingsWrapper />;
}