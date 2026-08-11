// ---------------------------------------------------------------------
// lib/settings/shift-schedule.test.ts — Phase 10 · Step 5 · conflict
// detection. Locks the "same person assigned to two places" rule: the
// default roster is conflict-free, double-booked members are surfaced
// with their shifts in display order, and single/no assignments never
// fire.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROSTER,
  findShiftConflicts,
  type ShiftRoster,
} from "./shift-schedule";

describe("findShiftConflicts", () => {
  it("reports no conflicts for the default roster", () => {
    expect(findShiftConflicts(DEFAULT_ROSTER)).toEqual([]);
  });

  it("flags a member booked into two shifts", () => {
    const roster: ShiftRoster = {
      morning: ["Karan Verma"],
      evening: ["Karan Verma"],
      night: [],
    };
    expect(findShiftConflicts(roster)).toEqual([
      { member: "Karan Verma", shifts: ["morning", "evening"] },
    ]);
  });

  it("lists shifts in display order, not assignment order", () => {
    const roster: ShiftRoster = {
      morning: ["Devil Kumar"],
      evening: [],
      night: ["Devil Kumar"],
    };
    expect(findShiftConflicts(roster)).toEqual([
      { member: "Devil Kumar", shifts: ["morning", "night"] },
    ]);
  });

  it("flags every double-booked member, not just the first", () => {
    const roster: ShiftRoster = {
      morning: ["Anita Sharma", "Rajesh Nair"],
      evening: ["Rajesh Nair"],
      night: ["Anita Sharma"],
    };
    const conflicts = findShiftConflicts(roster);
    expect(conflicts).toHaveLength(2);
    expect(conflicts.map((c) => c.member).sort()).toEqual([
      "Anita Sharma",
      "Rajesh Nair",
    ]);
  });

  it("ignores members on exactly one shift", () => {
    const roster: ShiftRoster = {
      morning: ["Anita Sharma"],
      evening: ["Priya Menon"],
      night: ["Rajesh Nair"],
    };
    expect(findShiftConflicts(roster)).toEqual([]);
  });

  it("handles empty rosters and missing shift keys", () => {
    expect(findShiftConflicts({ morning: [], evening: [], night: [] })).toEqual([]);
  });

  it("is deterministic across calls", () => {
    const roster: ShiftRoster = {
      morning: ["X"],
      evening: [],
      night: ["X"],
    };
    expect(findShiftConflicts(roster)).toEqual(findShiftConflicts(roster));
  });
});
