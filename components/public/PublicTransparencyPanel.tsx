// ---------------------------------------------------------------------
// components/public/PublicTransparencyPanel.tsx — server component.
//
// Public, read-only mirror of the Gov "Command Center" sidebar. It keeps
// only the informational widgets citizens can safely see:
//   · Map Layers ............ LayerToggle        (local state only)
//   · Severity Legend ....... static legend      (no data)
//   · Estimated Affected Pop · ImpactSummary     (client math, no API)
//   · Flood Forecast Trend .. FloodChartWidget   (mock data, lazy Recharts)
//   · What-If Simulator ..... WhatIfSimulator    (public /api/predict)
//   · Shelter Capacity ...... ShelterCapacityWidget (public getShelters)
//   · Resource Availability . LowStockWidget     (public getInventory)
//   · Response Timeline ..... DisasterTimeline   (static)
//
// Admin/action widgets are intentionally NOT included: Command Broadcast,
// Webhooks (dev tools), Daily Sitrep generator, Simulated Alert, and the
// Mass Evacuation Planner.
// ---------------------------------------------------------------------

import ImpactSummary from "@/components/dashboard/ImpactSummary";
import WhatIfSimulator from "@/components/dashboard/WhatIfSimulator";
import ShelterCapacityWidget from "@/components/dashboard/ShelterCapacityWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import DisasterTimeline from "@/components/dashboard/DisasterTimeline";
import DisasterPulse from "@/components/public/DisasterPulse";
import PublicFloodChartLazy from "./transparency/PublicFloodChartLazy";
import PublicLayerControl from "./transparency/PublicLayerControl";
import PublicTransparencyFrame from "./transparency/PublicTransparencyFrame";

const SEVERITY_LEGEND = [
  { level: "Critical", dot: "bg-severity-red-400", note: "River ≥ 4.6 m" },
  { level: "High", dot: "bg-severity-amber-400", note: "3.6 – 4.5 m" },
  { level: "Moderate", dot: "bg-severity-purple-400", note: "2.8 – 3.5 m" },
  { level: "Low", dot: "bg-severity-green-400", note: "< 2.8 m" },
];

export default function PublicTransparencyPanel() {
  return (
    <PublicTransparencyFrame>
      <div className="space-y-4">
        {/* Severity Legend */}
        <section className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <p className="eoc-label mb-3 text-white">SEVERITY LEGEND</p>
          <ul className="space-y-2.5">
            {SEVERITY_LEGEND.map(({ level, dot, note }) => (
              <li key={level} className="flex items-center gap-3">
                <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <span className="text-sm font-medium text-slate-200">{level}</span>
                <span className="ml-auto text-xs text-slate-400">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Map Layers */}
        <PublicLayerControl />

        {/* Estimated Affected Population */}
        <ImpactSummary
          hoursAhead={24}
          severity="high"
          scenarioMultiplier={1}
          disasterType="flood"
          centerLat={22}
          centerLng={78}
        />

        {/* Flood Forecast Trend */}
        <PublicFloodChartLazy />

        {/* Live Disaster Pulse — India disaster headlines + USGS quakes */}
        <DisasterPulse />

        {/* What-If Simulator */}
        <WhatIfSimulator />

        {/* Shelter Capacity */}
        <ShelterCapacityWidget />

        {/* Resource Availability */}
        <LowStockWidget />

        {/* Response Timeline */}
        <DisasterTimeline />
      </div>
    </PublicTransparencyFrame>
  );
}
