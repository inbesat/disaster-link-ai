import type { Metadata } from "next";
import { cookies } from "next/headers";
import CommandCenterClient from "@/components/command-center/CommandCenterClient";
import DataHealthWidget from "@/components/dashboard/DataHealthWidget";
import AlertSimulator from "@/components/dashboard/AlertSimulator";
import ShelterCapacityWidget from "@/components/dashboard/ShelterCapacityWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import KPICards from "@/components/dashboard/KPICards";
import CommandCenterCharts from "@/components/dashboard/dynamic/CommandCenterChartsLazy";
import GapAnalysisTable from "@/components/dashboard/GapAnalysisTable";
import DisasterTimeline from "@/components/dashboard/DisasterTimeline";
import SitRepGenerator from "@/components/dashboard/SitRepGenerator";
import FieldTasksPlaceholder from "@/components/dashboard/FieldTasksPlaceholder";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import BroadcastMessage from "@/components/dashboard/BroadcastMessage";

// ---------------------------------------------------------------------
// app/(dashboard)/global-map/page.tsx — Global Command Center Map
//
// Full-featured global map page with the complete CommandCenterClient:
//   • Interactive DisasterMap (MapLibre) with flood zones, shelters, resources
//   • Hazard Type selector (Flood / Cyclone / Earthquake / Wildfire)
//   • Map Layer toggles (Flood Risk, Shelters, Resources)
//   • What-If Simulator
//   • Model Accuracy Assessment (AccuracyMetrics)
   //   • Dev Tools / Simulate SMS (WebhookSimulator)
   //   • Live Activity Feed
//   • Prediction Chart
//   • Impact Summary
//   • Evacuation Planner
//   • Scenario Selector + Time Slider
//   • Severity Legend
//
// All extracted from the previous deployment's CommandCenterClient and
// injected into this standalone route. No CSS or dark-theme changes.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Global Map | SafeSphere",
};

export default function GlobalMapPage() {
  const isGuest = cookies().get("guest_mode")?.value === "true";
  const role = isGuest ? "field_responder" : "district_admin";
  const isFieldResponder = role === "field_responder";

  return (
    <CommandCenterClient
      top={
        <div className="px-4 pb-4 pt-4">
          <KPICards />
        </div>
      }
      sidebar={
        isFieldResponder ? (
          <>
            <LiveActivityFeed />
            <FieldTasksPlaceholder />
            <SitRepGenerator />
            <AlertSimulator />
          </>
        ) : (
          <>
            <LiveActivityFeed />
            <BroadcastMessage />
            <DataHealthWidget />
            <ShelterCapacityWidget />
            <LowStockWidget />
            <GapAnalysisTable />
            <CommandCenterCharts />
            <DisasterTimeline />
            <SitRepGenerator />
            <AlertSimulator />
          </>
        )
      }
    />
  );
}
