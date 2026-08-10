// ---------------------------------------------------------------------
// lib/map/citizen-road-closures.ts — Phase 4 · Step 7 · Road closure
// indicators for the public map.
//
// Citizens need to see blocked paths clearly, so the citizen map renders
// a small set of mock closures as red-X barricade markers. Tapping one
// shows "Road Closed — Route automatically recalculated."
//
// This is the single edit point for those closures. The shape reuses the
// existing `RoadClosureLike` contract (the same type the gov road-closure
// tool fetches/persists via /api/road-closures) so swapping these mocks
// for live data later is a one-line change.
//
// Coordinates are hand-placed on believable Patna roads, all active, and
// deliberately NOT sitting on top of any shelter (a barricade blocks a
// route segment; it never blocks the destination itself) — the unit test
// enforces that.
// ---------------------------------------------------------------------

import type { RoadClosureLike } from "./road-closures-client";

/** Mock closures shown on the citizen map. All active by definition. */
export const CITIZEN_ROAD_CLOSURES: RoadClosureLike[] = [
  {
    id: "closure-digha-bridge",
    lat: 25.622,
    lng: 85.081,
    reason: "Digha–Sonpur Bridge washed out",
    isActive: true,
  },
  {
    id: "closure-frazer-road",
    lat: 25.611,
    lng: 85.159,
    reason: "Frazer Road sinkhole",
    isActive: true,
  },
  {
    id: "closure-boring-road",
    lat: 25.593,
    lng: 85.128,
    reason: "Boring Road waterlogging",
    isActive: true,
  },
  {
    id: "closure-bailey-road",
    lat: 25.602,
    lng: 85.112,
    reason: "Bailey Road flood debris",
    isActive: true,
  },
];
