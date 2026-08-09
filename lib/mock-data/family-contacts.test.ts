// lib/mock-data/family-contacts.test.ts — Phase 2 · Step 6.
// Locks the family-contacts parsing + mock status cycle.

import { describe, expect, it } from "vitest";
import { mockFamilyStatus, parseFamilyContacts } from "./family-contacts";

const PAYLOAD = JSON.stringify({
  contacts: [
    { name: "Sunita Das", phone: "+919876543210" },
    { name: "Rahul Kumar", phone: "+919812345670" },
    { name: "Priya Sharma", phone: "+919801234567" },
  ],
  savedAt: "2026-08-09T09:42:17.000Z",
});

describe("parseFamilyContacts", () => {
  it("parses a valid payload and assigns statuses in cycle order", () => {
    const contacts = parseFamilyContacts(PAYLOAD);
    expect(contacts).toHaveLength(3);
    expect(contacts[0]).toMatchObject({ name: "Sunita Das", status: "safe" });
    expect(contacts[1].status).toBe("unknown");
    expect(contacts[2].status).toBe("danger");
  });

  it("drops empty names but keeps their phone-less siblings", () => {
    const contacts = parseFamilyContacts(
      JSON.stringify({
        contacts: [
          { name: "  ", phone: "+91" },
          { name: "Amit", phone: "+91" },
        ],
      }),
    );
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("Amit");
  });

  it("returns [] for null / malformed JSON / missing contacts array", () => {
    expect(parseFamilyContacts(null)).toEqual([]);
    expect(parseFamilyContacts("not json")).toEqual([]);
    expect(parseFamilyContacts(JSON.stringify({ savedAt: "x" }))).toEqual([]);
    expect(parseFamilyContacts(JSON.stringify({ contacts: "nope" }))).toEqual([]);
  });
});

describe("mockFamilyStatus", () => {
  it("cycles safe → unknown → danger → safe", () => {
    expect(mockFamilyStatus(0)).toBe("safe");
    expect(mockFamilyStatus(1)).toBe("unknown");
    expect(mockFamilyStatus(2)).toBe("danger");
    expect(mockFamilyStatus(3)).toBe("safe");
  });
});
