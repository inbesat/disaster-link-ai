// ---------------------------------------------------------------------
// lib/center-intent.ts — Phase 1 · Step 8 · AI Center Recommender intent.
//
// Pure detector: does a citizen's message ask for a help center ("Where is
// the nearest hospital?" / "I need police")? MitronChat runs this AFTER the
// emergency check (an emergency intent wins over a center lookup). When a
// center type is matched, the chat renders a UI card from the Step 4
// Center Directory data (lib/mock-data/help-centers) instead of text.
//
// Keywords per the step spec (hospital / police) plus the other Step 4
// center types (NDRF, fire) so the recommender covers the whole directory.
// Pure + side-effect free + unit-testable.
// ---------------------------------------------------------------------

import {
  HELP_CENTERS,
  type HelpCenter,
  type HelpCenterType,
} from "@/lib/mock-data/help-centers";

/** Keyword sets per center type — substring match on the lower-cased input. */
export const CENTER_INTENT_KEYWORDS: Record<HelpCenterType, readonly string[]> = {
  hospital: ["hospital", "clinic", "doctor", "medical"],
  police: ["police", "station", "chowki", "कचहरी"],
  ndrf: ["ndrf", "rescue team", "national disaster"],
  fire: ["fire station", "fire brigade", "दमकल"],
};

/**
 * Detect which center type a message is asking for, or null. Longer
 * keywords win so "fire station" isn't swallowed by "police station".
 */
export function detectCenterIntent(text: string): HelpCenterType | null {
  const lower = text.toLowerCase();
  let best: HelpCenterType | null = null;
  let bestLength = -1;
  for (const type of Object.keys(CENTER_INTENT_KEYWORDS) as HelpCenterType[]) {
    for (const keyword of CENTER_INTENT_KEYWORDS[type]) {
      if (lower.includes(keyword) && keyword.length > bestLength) {
        best = type;
        bestLength = keyword.length;
      }
    }
  }
  return best;
}

/**
 * The nearest center of a given type from the Step 4 directory, by the
 * hardcoded walking distance (nearest first).
 */
export function nearestCenterOfType(
  type: HelpCenterType,
  centers: readonly HelpCenter[] = HELP_CENTERS,
): HelpCenter | null {
  return (
    centers
      .filter((c) => c.type === type)
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null
  );
}
