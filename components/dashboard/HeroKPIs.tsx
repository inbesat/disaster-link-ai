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
//
// Phase 10 — the numeric metrics (people at risk, shelters, resources)
// count up from 0 on load via CountUpNumber so the row feels alive; the
// risk card is a text badge and keeps its static node.
//
// Phase 10 · Step 3 — subscribes to the demo simulation's
// drip:demo-sim:people-at-risk event: each 5–20 bump animates the People
// at Risk count up from its previous value (CountUpNumber `from`), so the
// pitch demo's numbers drift on their own without re-counting from zero.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Home, Truck, Users, Waves } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import CountUpNumber from "@/components/ui/CountUpNumber";
import { useDashboardDistrict } from "@/components/dashboard/DashboardLayout";
import {
  DEMO_PEOPLE_AT_RISK_EVENT,
  type PeopleAtRiskBumpEvent,
} from "@/hooks/useDemoSimulation";

const CAROUSEL_CELL = "w-[85%] shrink-0 snap-center md:w-auto md:shrink md:snap-none";

export function HeroKPIs() {
  const { district } = useDashboardDistrict();

  // Live People-at-Risk total — { from, value } lets the count-up animate
  // the small demo bumps instead of re-counting from zero.
  const [peopleAtRisk, setPeopleAtRisk] = useState({ from: 0, value: 47230 });

  useEffect(() => {
    const onBump = (e: Event) => {
      const { delta } = (e as PeopleAtRiskBumpEvent).detail;
      setPeopleAtRisk((k) => ({ from: k.value, value: k.value + delta }));
    };
    window.addEventListener(DEMO_PEOPLE_AT_RISK_EVENT, onBump);
    return () => window.removeEventListener(DEMO_PEOPLE_AT_RISK_EVENT, onBump);
  }, []);

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

        {/* Card 2 — People at risk (counts up from 0 on load) */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="People at Risk"
            icon={Users}
            valueNode={
              <p className="mt-2 text-3xl font-bold tabular-nums leading-none text-primary">
                <CountUpNumber from={peopleAtRisk.from} value={peopleAtRisk.value} />
              </p>
            }
            trend="+12% from yesterday"
            trendDirection="up"
            trendClassName="text-accent-danger"
          />
        </div>

        {/* Card 3 — Shelters active (counts the open count, /24 static), with occupancy bar */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="Shelters Active"
            icon={Home}
            valueNode={
              <p className="mt-2 text-3xl font-bold tabular-nums leading-none text-primary">
                <CountUpNumber value={18} />
                /24
              </p>
            }
            trend="4 near capacity"
            subtitle="75% of capacity"
            progress={{ value: 18, max: 24, colorClass: "bg-accent-warning" }}
          />
        </div>

        {/* Card 4 — Resources deployed (counts up, "units" suffix static) */}
        <div className={CAROUSEL_CELL}>
          <StatCard
            label="Resources Deployed"
            icon={Truck}
            valueNode={
              <p className="mt-2 text-3xl font-bold tabular-nums leading-none text-primary">
                <CountUpNumber value={156} /> units
              </p>
            }
            subtitle="Boats, ambulances, tents"
          />
        </div>
      </div>
    </div>
  );
}

export default HeroKPIs;
