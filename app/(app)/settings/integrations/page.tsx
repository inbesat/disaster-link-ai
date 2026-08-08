import type { Metadata } from "next";
import IntegrationsWrapper from "@/components/settings/integrations/IntegrationsWrapper";

export const metadata: Metadata = {
  title: "Integrations & Ecosystem | Settings | DRIP",
};

// ---------------------------------------------------------------------
// app/(app)/settings/integrations/page.tsx — Integrations (Phase 8 · Step 1).
//
// Thin server shell. The responsive page layout (header + Super Admin
// badge + card grid for Weather APIs, SMS/Voice, Webhooks, Sensors and
// System Health) lives in IntegrationsWrapper. This route is admin-only
// (guarded in middleware).
// ---------------------------------------------------------------------

export default function IntegrationsSettingsPage() {
  return <IntegrationsWrapper />;
}
