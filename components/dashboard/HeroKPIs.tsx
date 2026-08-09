"use client";

// ---------------------------------------------------------------------
// components/dashboard/HeroKPIs.tsx
// UI/UX Phase 4 · Step 3 (+ Phase 9 · Step 1 — mobile carousel).
//
// The top row of critical numbers: risk level · people at risk · shelters
// active · resources deployed. The district name in card 1 follows the live
// district selection from DashboardLayout (via useDashboardDistrict).
//
// Phase 9 — on mobile (<md) the four StatCards become a swipeable,
// snap-scrolling carousel: each card snaps to center and occupies ~85% of
// the screen so a thumb can page through them. From md up they return to
// the 2/4-column grid for the desktop Command Center.
// ---------------------------------------------------------------------

import { Home, Truck, Users, Waves } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { useDashboardDistrict } from "@/components/dashboard/DashboardLayout";

const CAROUSEL_CELL = "w-[85%] shrink-0 snap-center md:w-auto md:shrink md:snap-none";

export function HeroKPIs() {
  const { district } = useDashboardDistrict();

  return (
    <div>
      {/* Mobile = horizontal snap carousel; md+ = the 2/4-col grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
        {/* Card 1 — Current risk level: CRITICAL */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="Current Risk Level"
            icon={Waves}
            valueNode={
              <span className="mt-2 inline-flex items-center gap-2 text-3xl font-bold uppercase leading-none text-accent-danger">
                <span
                  className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-danger"
                  aria-hidden
                />
                Critical
              </span>
            }
            subtitle={`${district} District`}
            className="border-accent-danger/30"
          />
        </div>

        {/* Card 2 — People at risk */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="People at Risk"
            icon={Users}
            value="47,230"
            trend="+12% from yesterday"
            trendDirection="up"
            trendClassName="text-accent-danger"
          />
        </div>

        {/* Card 3 — Shelters active, with occupancy bar */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="Shelters Active"
            icon={Home}
            value="18/24"
            trend="4 near capacity"
            subtitle="75% of capacity"
            progress={{ value: 18, max: 24, colorClass: "bg-accent-warning" }}
          />
        </div>

        {/* Card 4 — Resources deployed */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="Resources Deployed"
            icon={Truck}
            value="156 units"
            subtitle="Boats, ambulances, tents"
          />
        </div>
      </div>
    </div>
  );
}

export default HeroKPIs;
