// ---------------------------------------------------------------------
// lib/broadcast/strategy-selector.ts — Phase 4 · best-strategy selection.
//
// Decides which channel to use for a station, in priority order:
//   cap_api → rds → ftp → email
// Strategy A is preferred when the station has a modern CAP endpoint; a
// station that also has RDS gets the RDS text *as well* when the selector
// is asked for all viable strategies. The pure functions here are
// unit-tested with fixture stations.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import type { DispatchStrategyName, FMDispatchStrategy } from "./types";

const PRIORITY: DispatchStrategyName[] = ["cap_api", "rds", "ftp", "email"];

/** Strategy priority order (cap_api best, email last). */
export function strategyPriority(): DispatchStrategyName[] {
  return [...PRIORITY];
}

/** Pick the single best strategy for a station (API → RDS → FTP → Email). */
export function selectBestStrategy(
  station: FmStation,
  strategies: readonly FMDispatchStrategy[],
): FMDispatchStrategy | null {
  for (const name of PRIORITY) {
    const strategy = strategies.find((s) => s.name === name);
    if (strategy && strategy.supports(station)) return strategy;
  }
  return null;
}

/** All strategies a station supports (for multi-channel dispatch). */
export function selectAllStrategies(
  station: FmStation,
  strategies: readonly FMDispatchStrategy[],
): FMDispatchStrategy[] {
  return PRIORITY.map((name) => strategies.find((s) => s.name === name)).filter(
    (s): s is FMDispatchStrategy => Boolean(s && s.supports(station)),
  );
}
