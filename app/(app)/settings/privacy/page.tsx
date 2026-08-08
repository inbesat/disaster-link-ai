import type { Metadata } from "next";
import PrivacySettingsWrapper from "@/components/settings/privacy/PrivacySettingsWrapper";

export const metadata: Metadata = {
  title: "Privacy, Security & Data Management | Settings | DRIP",
};

// ---------------------------------------------------------------------
// app/(app)/settings/privacy/page.tsx — Privacy & Security (Phase 6 · Step 1).
//
// Thin server shell. The sectioned layout (Data Visibility, Login & 2FA,
// API Keys, Audit Log, Data Retention, Account Actions) lives in
// PrivacySettingsWrapper.
// ---------------------------------------------------------------------

export default function PrivacySettingsPage() {
  return <PrivacySettingsWrapper />;
}