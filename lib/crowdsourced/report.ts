// ---------------------------------------------------------------------
// lib/crowdsourced/report.ts
// Phase 17 — shared shape for citizen ground-truth reports used by the
// triage dashboard, the map, and the social ingestion pipeline.
// ---------------------------------------------------------------------

export type GroundReport = {
  id: string;
  lat: number;
  lng: number;
  report_type: "flooding" | "road_blocked" | "shelter_needed" | "rescue";
  source: "social" | "app" | "sms";
  raw_text: string;
  confidence_score: number; // 0..1 (normalised from AI severity / 100)
  verification_status: "unverified" | "verified" | "rejected";
  severity: number; // 0..100 from the NLP parser
  people_trapped: boolean;
  people_count: number;
  locations: string[];
  summary: string;
  image_url?: string | null;
  created_at?: string;
  // PWD (Persons with Disabilities) — priority rescue flag. When true the
  // report jumps to the top of the triage queue. pwd_details stores the
  // specific mobility/accessibility need (e.g. "Wheelchair user").
  is_pwd?: boolean;
  pwd_details?: string | null;
};

export const GROUND_REPORT_TYPES: Array<{
  value: GroundReport["report_type"];
  label: string;
  color: string;
}> = [
  { value: "flooding", label: "Flooding", color: "#3b82f6" }, // blue = water
  { value: "road_blocked", label: "Road Blocked", color: "#f59e0b" },
  { value: "shelter_needed", label: "Shelter Needed", color: "#a855f7" },
  { value: "rescue", label: "Rescue", color: "#ef4444" }, // red = rescue
];

/** Color-coded icon color for a verified report's map marker. */
export function groundReportColor(type: GroundReport["report_type"]): string {
  return GROUND_REPORT_TYPES.find((t) => t.value === type)?.color ?? "#3b82f6";
}