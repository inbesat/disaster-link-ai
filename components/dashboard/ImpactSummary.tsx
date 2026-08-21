"use client";

import { useMemo } from "react";
import {
  applyScenario,
  calculateAffectedPopulation,
  type FloodRiskLevel,
} from "@/lib/map/flood-geojson";
import { generateHazardPolygons } from "@/lib/map/hazard-geojson";
import type { DisasterType } from "@/lib/disasters/disaster-types";
import { DISASTER_META } from "@/lib/disasters/disaster-types";

type ImpactSummaryProps = {
  hoursAhead: number;
  severity: FloodRiskLevel;
  scenarioMultiplier: number;
  disasterType: DisasterType;
  centerLat: number;
  centerLng: number;
};

export default function ImpactSummary({
  hoursAhead,
  severity,
  scenarioMultiplier,
  disasterType,
  centerLat,
  centerLng,
}: ImpactSummaryProps) {
  const impact = useMemo(() => {
    const { riskLevel, hoursAhead: effectiveHours } =
      scenarioMultiplier > 1
        ? applyScenario(severity, hoursAhead, scenarioMultiplier)
        : { riskLevel: severity, hoursAhead };

    const polygons = generateHazardPolygons(
      disasterType,
      centerLat,
      centerLng,
      riskLevel,
      effectiveHours,
    );
    return calculateAffectedPopulation(polygons, centerLat, centerLng);
  }, [hoursAhead, severity, scenarioMultiplier, disasterType, centerLat, centerLng]);

  const meta = DISASTER_META[disasterType];

  return (
    <div className="eoc-panel p-5">
      <p className="eoc-label mb-2 text-accent">
        ESTIMATED AFFECTED POPULATION · {meta.label.toUpperCase()}
      </p>

      <div className="text-4xl font-bold text-foreground">
        {impact.totalAffected.toLocaleString()}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        people · {impact.villagesAffected}/{impact.villagesChecked} settlements ·{" "}
        {impact.pctOfDistrict}% of district
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
        <div>
          <p className="eoc-label text-eoc-tiny text-slate-500">CHILDREN</p>
          <p className="mt-1 text-xl font-bold text-severity-amber-400">
            {impact.children.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="eoc-label text-eoc-tiny text-slate-500">ELDERLY</p>
          <p className="mt-1 text-xl font-bold text-severity-purple-400">
            {impact.elderly.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="eoc-label text-eoc-tiny text-slate-500">ADULTS</p>
          <p className="mt-1 text-xl font-bold text-severity-green-400">
            {impact.adults.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
