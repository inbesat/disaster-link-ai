// ---------------------------------------------------------------------
// app/(dashboard)/dashboard/page.tsx
// UI/UX Phase 4 · Step 2 — Command Center hero screen scaffold.
//
// Renders inside the auth-protected (dashboard) layout's DashboardShell
// and uses the new Command Center DashboardLayout (sticky header + district
// context). The 12-column responsive grid (`xl:grid-cols-12`) hosts the
// staggered dashboard widgets (UI/UX Phase 8 · Step 2).
// ---------------------------------------------------------------------

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import HeroKPIs from "@/components/dashboard/HeroKPIs";
import LiveMapWidget from "@/components/dashboard/LiveMapWidget";
import AlertFeedWidget from "@/components/dashboard/AlertFeedWidget";
import AIPlannerWidget from "@/components/dashboard/AIPlannerWidget";
import ResponderStatusBoard from "@/components/dashboard/ResponderStatusBoard";
import FloodPredictionChart from "@/components/dashboard/FloodPredictionChart";
import ResourceDonutChart from "@/components/dashboard/ResourceDonutChart";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <section className="p-4 sm:p-6">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">
          Command Center Overview
        </h1>
        <p className="mt-1 text-sm text-muted">
          Live situational awareness across all active districts.
        </p>

        {/* Staggered widget grid — 1 col on mobile, 2 on tablet, 12 × on xl. */}
        <DashboardGrid
          items={[
            { key: "kpis", className: "xl:col-span-12", children: <HeroKPIs /> },
            {
              key: "map",
              className: "md:col-span-2 xl:col-span-8 xl:row-span-2",
              children: <LiveMapWidget />,
            },
            {
              key: "alerts",
              className: "md:col-span-2 xl:col-span-4 xl:row-span-2",
              children: <AlertFeedWidget />,
            },
            {
              key: "planner",
              className: "md:col-span-2 xl:col-span-4",
              children: <AIPlannerWidget />,
            },
            {
              key: "responders",
              className: "md:col-span-2 xl:col-span-4",
              children: <ResponderStatusBoard />,
            },
            {
              key: "flood",
              className: "md:col-span-2 xl:col-span-8",
              children: <FloodPredictionChart />,
            },
            {
              key: "donut",
              className: "md:col-span-2 xl:col-span-4",
              children: <ResourceDonutChart />,
            },
          ]}
        />
      </section>
    </DashboardLayout>
  );
}
