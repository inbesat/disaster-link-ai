// ---------------------------------------------------------------------
// lib/settings/shift-schedule.ts — Phase 10 · Step 5 · shift scheduling
// conflict detection.
//
// The roadmap explicitly calls for "Conflict detection (same person
// assigned to two places)" — a responder booked into overlapping shifts
// would double-fire on duty rotations and confuse alert routing. This
// module owns the roster model + the pure conflict finder so the rule is
// unit-testable; the settings card (ShiftScheduleCard) renders the
// warnings from it.
// ---------------------------------------------------------------------

export type ShiftId = "morning" | "evening" | "night";

export type Shift = {
  id: ShiftId;
  name: string;
  start: string;
  end: string;
};

export type ShiftRoster = Record<ShiftId, string[]>;

/** A responder assigned to more than one shift. */
export type ShiftConflict = {
  member: string;
  shifts: ShiftId[];
};

export const DEFAULT_SHIFTS: Shift[] = [
  { id: "morning", name: "Morning", start: "06:00", end: "14:00" },
  { id: "evening", name: "Evening", start: "14:00", end: "22:00" },
  { id: "night", name: "Night", start: "22:00", end: "06:00" },
];

export const TEAM_MEMBERS: Array<{ name: string; role: string }> = [
  { name: "Anita Sharma", role: "Super Admin" },
  { name: "Rajesh Nair", role: "District Admin" },
  { name: "Priya Menon", role: "Field Responder" },
  { name: "Karan Verma", role: "Field Responder" },
  { name: "Sita Thomas", role: "Viewer" },
  { name: "Vikram Yadav", role: "Field Responder" },
  { name: "Meera Pillai", role: "District Admin" },
  { name: "Devil Kumar", role: "Field Responder" },
];

export const DEFAULT_ROSTER: ShiftRoster = {
  morning: ["Anita Sharma", "Karan Verma"],
  evening: ["Priya Menon", "Meera Pillai"],
  night: ["Rajesh Nair", "Devil Kumar"],
};

/**
 * Find every responder assigned to more than one shift. Returns the
 * offending members with their shifts in display order (morning,
 * evening, night). A person on exactly one shift — or none — is not a
 * conflict.
 */
export function findShiftConflicts(roster: ShiftRoster): ShiftConflict[] {
  const byMember = new Map<string, ShiftId[]>();
  for (const shiftId of Object.keys(roster) as ShiftId[]) {
    for (const member of roster[shiftId] ?? []) {
      const list = byMember.get(member) ?? [];
      list.push(shiftId);
      byMember.set(member, list);
    }
  }

  const ORDER: ShiftId[] = ["morning", "evening", "night"];
  return Array.from(byMember.entries())
    .filter((entry) => entry[1].length > 1)
    .map((entry) => ({
      member: entry[0],
      shifts: entry[1].sort(
        (a: ShiftId, b: ShiftId) => ORDER.indexOf(a) - ORDER.indexOf(b),
      ),
    }));
}
