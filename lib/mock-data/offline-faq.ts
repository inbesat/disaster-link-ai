// ---------------------------------------------------------------------
// lib/mock-data/offline-faq.ts — Phase 6 · Step 6 · the Offline FAQ
// fallback for the Nova safety companion.
//
// When cellular towers are down the AI must still answer the five most
// common safety questions. This is the mock local knowledge base: five
// Q&A pairs (display strings live in the locale files under offline_*;
// this module only carries ids + match keywords) and a pure keyword
// matcher so the behaviour is unit-testable without a browser.
//
// Display strings are translated (offline_q_* / offline_a_* locale keys);
// the match keywords are deliberately bilingual (English + Hindi) so a
// citizen typing either gets an answer.
// ---------------------------------------------------------------------

export type OfflineFaq = {
  /** Stable id — links a match to its offline_q_* and offline_a_* locale keys. */
  id: "water" | "shelter" | "power" | "phone" | "road";
  /** Lower-cased substrings checked against the user's query. */
  keywords: string[];
};

export const OFFLINE_FAQ: OfflineFaq[] = [
  {
    id: "water",
    keywords: ["boil", "water", "drink", "पानी", "पीना", "उबाल"],
  },
  {
    id: "shelter",
    keywords: ["shelter", "refuge", "camp", "आश्रय", "शेल्टर", "राहत"],
  },
  {
    id: "power",
    keywords: ["power", "electric", "current", "light gone", "बिजली", "करेंट"],
  },
  {
    id: "phone",
    keywords: ["charge", "phone", "battery", "mobile", "फोन", "बैटरी", "चार्ज"],
  },
  {
    id: "road",
    keywords: ["road", "drive", "travel", "route", "waterlogged", "सड़क", "रास्ता", "रूट"],
  },
];

/**
 * Best-match: the FAQ whose keyword is found AND is the LONGEST match wins
 * (most specific wins), so "is the road waterlogged?" → road (via
 * "waterlogged") rather than water (via "water" being a substring of it).
 * No match → null, and the caller falls back to its generic offline answer.
 */
export function matchOfflineFaq(query: string): OfflineFaq | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  let best: OfflineFaq | null = null;
  let bestKeywordLength = 0;
  for (const faq of OFFLINE_FAQ) {
    for (const keyword of faq.keywords) {
      if (q.includes(keyword) && keyword.length > bestKeywordLength) {
        best = faq;
        bestKeywordLength = keyword.length;
      }
    }
  }
  return best;
}

export default OFFLINE_FAQ;
