// ---------------------------------------------------------------------
// lib/mock-data/gov-districts.ts — Phase 7 · Step 10 · Multi-District
// Overview (Super Admin).
//
// State-HQ comparison data for the super-admin /gov/overview page. Each
// district card summarises its Active Risk Level, evacuees and deployed
// resources. `sortDistrictsByRisk` orders the grid automatically so the
// highest-severity districts surface first — pure, so the ordering is
// unit-tested and deterministic.
//
// The risk score drives both the sort and the card's risk meter; the
// severity label is derived from the score with a documented threshold.
// ---------------------------------------------------------------------

export type DistrictRiskLevel = "critical" | "high" | "moderate" | "low";

export type DistrictSummary = {
  id: string;
  name: string;
  /** 0–100 composite of water level, exposure and event load. */
  riskScore: number;
  /** People evacuated or awaiting evacuation. */
  evacuees: number;
  /** Boats, teams and equipment actively deployed. */
  resourcesDeployed: number;
  /** Live events feeding the risk model. */
  activeEvents: number;
};

export const DISTRICT_SUMMARIES: DistrictSummary[] = [
  { id: "patna", name: "Patna", riskScore: 92, evacuees: 12840, resourcesDeployed: 118, activeEvents: 3 },
  { id: "gaya", name: "Gaya", riskScore: 64, evacuees: 3420, resourcesDeployed: 47, activeEvents: 1 },
  { id: "bhagalpur", name: "Bhagalpur", riskScore: 81, evacuees: 7315, resourcesDeployed: 82, activeEvents: 2 },
];

/** Derive the severity label from the risk score. */
export function riskLevelFor(score: number): DistrictRiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  return "low";
}

/**
 * Sort districts by risk — highest first (ties broken by evacuees, then
 * name for a stable, deterministic order). Pure — returns a new array.
 */
export function sortDistrictsByRisk(districts: DistrictSummary[]): DistrictSummary[] {
  return [...districts].sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    if (b.evacuees !== a.evacuees) return b.evacuees - a.evacuees;
    return a.name.localeCompare(b.name);
  });
}

/** Number format for evacuee counts (12,840). */
export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}
