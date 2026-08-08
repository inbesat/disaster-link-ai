"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/IntegrationsWrapper.tsx — Integrations (Phase 8 · Step 1).
//
// Integrations & Ecosystem page shell (dark emergency-ops theme).
// Responsive grid that hosts the Phase 8 configuration cards as they land:
//   • Weather APIs       — OpenWeather / IMD / GLOFAS data pipelines (Step 2)
//   • SMS / Voice        — Twilio / Fast2SMS gateways (Step 3)
//   • Satellite / GIS    — Bhuvan / Earth Engine / Sentinel Hub (Step 4)
//   • Webhooks           — outbound event callbacks (Step 5)
//   • Sensors / IoT      — incoming device ingestion (Step 6)
//   • Rate Limits        — cost guardrails & monthly quotas (Step 8)
//   • System Health      — external systems ping dashboard (Step 9)
//
// All Phase 8 steps are now live — Weather (Step 2), Telecom (Step 3),
// Satellite/GIS (Step 4), Outgoing Webhooks (Step 5), Incoming IoT
// (Step 6), Rate Limiting (Step 8) and System Health (Step 9). The route
// is admin-only (guarded in middleware) and the header carries a red
// "Super Admin Only" badge.
// ---------------------------------------------------------------------

import { Cable } from "lucide-react";
import { IntegrationsSettingsProvider } from "@/lib/integrations-settings-mock";
import IncomingWebhooksCard from "./IncomingWebhooksCard";
import OutgoingWebhooksCard from "./OutgoingWebhooksCard";
import RateLimitCard from "./RateLimitCard";
import SatelliteGisCard from "./SatelliteGisCard";
import SystemHealthCard from "./SystemHealthCard";
import TelecomApiCard from "./TelecomApiCard";
import WeatherApiCard from "./WeatherApiCard";

export default function IntegrationsWrapper() {
  // Shared persisted state (API keys, webhooks, quotas) — Step 10.
  return (
    <IntegrationsSettingsProvider>
      <IntegrationsPageContent />
    </IntegrationsSettingsProvider>
  );
}

function IntegrationsPageContent() {
  return (
    <div className="space-y-10" data-settings-scope="integrations">
      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eoc-label flex items-center gap-2 text-rose-300/90">
            <Cable className="h-3.5 w-3.5" aria-hidden />
            SETTINGS / INTEGRATIONS &amp; ECOSYSTEM
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Integrations &amp; Ecosystem
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Configure third-party APIs, webhooks, and sensor data pipelines
            to connect the command center with the outside world.
          </p>
        </div>

        {/* Red Super Admin Only badge */}
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-red-300 shadow-[0_0_18px_rgba(220,38,38,0.25)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          Super Admin Only
        </span>
      </header>

      {/* Cards grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weather APIs — built (Step 2) */}
        <div className="lg:col-span-2">
          <WeatherApiCard />
        </div>

        {/* Telecom & SMS gateways — built (Step 3) */}
        <div className="lg:col-span-2">
          <TelecomApiCard />
        </div>

        {/* Satellite & GIS providers — built (Step 4) */}
        <div className="lg:col-span-2">
          <SatelliteGisCard />
        </div>

        {/* Outgoing Event Webhooks — built (Step 5) */}
        <div className="lg:col-span-2">
          <OutgoingWebhooksCard />
        </div>

        {/* Incoming Data & IoT Pipelines — built (Step 6) */}
        <div className="lg:col-span-2">
          <IncomingWebhooksCard />
        </div>

        {/* API Quotas & Rate Limiting — built (Step 8) */}
        <div className="lg:col-span-2">
          <RateLimitCard />
        </div>

        {/* External Systems Health — built (Step 9) */}
        <div className="lg:col-span-2">
          <SystemHealthCard />
        </div>
      </div>
    </div>
  );
}
