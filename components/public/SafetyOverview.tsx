"use client";

// ---------------------------------------------------------------------
// components/public/SafetyOverview.tsx — Phase 2 · Steps 2–5 · citizen
// safety stack.
//
// Single client island so the server-rendered dashboard page can host
// the client-only safety widgets. Calls useSafetyStatus() ONCE and feeds
// the result into the three stacked cards:
//
//   1. SafetyHero       — massive status card (Step 2)
//   2. ActionCard       — contextual "what to do next" (Step 4)
//   3. WeatherCarousel  — 3-day forecast (Step 5)
//
// Server pages just mount <SafetyOverview />; no prop-threading needed.
// ---------------------------------------------------------------------

import SafetyHero from "@/components/public/SafetyHero";
import ActionCard from "@/components/public/ActionCard";
import WeatherCarousel from "@/components/public/WeatherCarousel";
import { useSafetyStatus } from "@/hooks/useSafetyStatus";

export function SafetyOverview() {
  const { status, area, updatedAt } = useSafetyStatus();

  return (
    <div className="space-y-4">
      <SafetyHero status={status} area={area} updatedAt={updatedAt} />
      <ActionCard status={status} />
      <WeatherCarousel />
    </div>
  );
}

export default SafetyOverview;
