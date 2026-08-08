// ---------------------------------------------------------------------
// lib/settings/ai-response-preview.ts — AI Assistant (Phase 4 · Step 3).
//
// Pure mock-reply builder for the Response Style card preview bubble.
// Deterministic: verbosity selects the message length/format, personality
// selects the tone and lead-in. Kept dependency-free so it can be unit
// tested in isolation.
// ---------------------------------------------------------------------

import type { AiPersonality, ResponseVerbosity } from "@/lib/settings/ai-settings";

/** Returns the preview bubble lines for the current verbosity + personality. */
export function buildResponsePreview(
  verbosity: ResponseVerbosity,
  personality: AiPersonality,
): string[] {
  if (personality === "urgent") {
    if (verbosity === "concise") {
      return ["🚨 FLASH FLOOD. Evacuate Sector 4. Route: Highway 9."];
    }
    if (verbosity === "balanced") {
      return [
        "🚨 Flash-flood warning — evacuate Sector 4 immediately.",
        "Move along Highway 9 to Assembly 9. Rescue crews are already en route.",
        "Stay above the flood line. Do not drive through standing water.",
      ];
    }
    return [
      "🚨 [SEVERE] FLASH FLOOD — Sector 4, Patna metropolitan.",
      "Evacuation: Sector 4 → Highway 9 → Assembly Point 9 (1.2 km).",
      "Source: DRIP flood gauge 12:07 UTC · 9.41 m (alert level).",
      "Fleet: 3 rescue boats (ETA 4 min) · 5 volunteers staged.",
      "Context: 92 mm in 6 h · river rising 0.8 m/h · downstream gauges in watch.",
    ];
  }

  if (personality === "collaborative") {
    if (verbosity === "concise") {
      return [
        "Team: flash flood in Sector 4.",
        "Plan: route via Highway 9, rally at Assembly 9.",
      ];
    }
    if (verbosity === "balanced") {
      return [
        "Heads-up team — flash flood moving into Sector 4.",
        "Plan: stage units along Highway 9, rally at Assembly 9.",
        "Confirm sector ownership so we can coordinate shelter coverage.",
      ];
    }
    return [
      "Team briefing — Sector 4 flash flooding.",
      "Suggested setup: 2 units staged on Highway 9, rally point Assembly 9.",
      "We have 3 boats + 5 volunteers in draft; need road-access confirmation.",
      "Execution list drafted — please sign off blockers before dispatch.",
      "Please verify downstream gauge readings on your side.",
    ];
  }

  // professional (formal)
  if (verbosity === "concise") {
    return [
      "Operational advisory issued for Sector 4.",
      "Recommended route: Highway 9. Assembly point: 9.",
    ];
  }
  if (verbosity === "balanced") {
    return [
      "A flash-flood advisory is active for Sector 4, Patna district.",
      "Residents and units are advised to move along Highway 9 to Assembly Point 9.",
      "Emergency services are responding per standard operating procedures.",
    ];
  }
  return [
    "Formal advisory — flash flooding, Sector 4, Patna district.",
    "Evacuation directive per NDA SoP 9.2 and DRIP bulletin SMS-2214.",
    "Route verified: Highway 9 → Assembly Point 9 (1.2 km, open).",
    "Gauge at 12.6 UTC: 9.41 m and rising 0.8 m/h.",
    "Coordinating agencies: district control, civil defence. Contact star-112.",
  ];
}