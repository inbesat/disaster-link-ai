// Phase 21 — application-level data isolation (mock RLS) tests: role-based
// district scoping, label normalization, the AI tool-call guard error, and
// post-execution result scoping.
import { describe, it, expect } from "vitest";
import {
  enforceDistrictScope,
  normalizeDistrict,
  assertDistrictAccess,
  scopeToolResult,
} from "./data-isolation";

const DATA = [
  { id: "s1", name: "Patna High School", district: "Patna" },
  { id: "s2", name: "Kankarbagh Shelter", district: "Patna" },
  { id: "s3", name: "Kochi Stadium Shelter", district: "Kerala" },
  { id: "s4", name: "Calicut Town Hall", district: "Kerala" },
];

describe("enforceDistrictScope (mock RLS)", () => {
  it("gives a super_admin the entire array", () => {
    expect(enforceDistrictScope(DATA, "Patna", "super_admin")).toEqual(DATA);
    expect(enforceDistrictScope(DATA, "Kerala", "super_admin")).toHaveLength(4);
  });

  it("scopes a district_admin to their own district", () => {
    const patna = enforceDistrictScope(DATA, "Patna", "district_admin");
    expect(patna.map((s) => s.district)).toEqual(["Patna", "Patna"]);

    const kerala = enforceDistrictScope(DATA, "Kerala", "district_admin");
    expect(kerala.map((s) => s.name)).toEqual([
      "Kochi Stadium Shelter",
      "Calicut Town Hall",
    ]);
  });

  it("scopes a field_responder to their own district", () => {
    const patna = enforceDistrictScope(DATA, "Patna", "field_responder");
    expect(patna).toHaveLength(2);
    expect(patna.every((s) => s.district === "Patna")).toBe(true);
  });

  it("never leaks another district's rows", () => {
    const patna = enforceDistrictScope(DATA, "Patna", "district_admin");
    expect(patna.some((s) => s.district === "Kerala")).toBe(false);
  });

  it("matches labels case-insensitively and strips parenthetical suffixes", () => {
    const rows = [
      { id: "a", district: "Patna (Ganga)" },
      { id: "b", district: "patna" },
      { id: "c", district: "Kerala" },
    ];
    expect(enforceDistrictScope(rows, "Patna", "district_admin").map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns nothing for unhandled roles (least privilege)", () => {
    expect(enforceDistrictScope(DATA, "Patna", "viewer")).toEqual([]);
    expect(enforceDistrictScope(DATA, "Patna", "unknown_role")).toEqual([]);
  });

  it("drops rows without a district for scoped roles", () => {
    const rows = [{ id: "x", district: null }, { id: "y", district: "Patna" }];
    expect(enforceDistrictScope(rows, "Patna", "district_admin")).toEqual([
      { id: "y", district: "Patna" },
    ]);
  });
});

describe("normalizeDistrict", () => {
  it("lowercases, trims and strips parenthetical suffixes", () => {
    expect(normalizeDistrict("Patna (Ganga)")).toBe("patna");
    expect(normalizeDistrict(" PATNA ")).toBe("patna");
    expect(normalizeDistrict(null)).toBe("");
    expect(normalizeDistrict(undefined)).toBe("");
  });
});

describe("assertDistrictAccess (AI tool guard)", () => {
  it("allows a super_admin to query any district", () => {
    expect(assertDistrictAccess("Kerala", "Patna", "super_admin")).toBeNull();
    expect(assertDistrictAccess("Delhi", "Patna", "super_admin")).toBeNull();
  });

  it("allows queries for the user's own district", () => {
    expect(assertDistrictAccess("Patna", "Patna", "district_admin")).toBeNull();
    expect(assertDistrictAccess("patna", "Patna", "field_responder")).toBeNull();
  });

  it("blocks a different district with the exact unauthorized error", () => {
    expect(assertDistrictAccess("Kerala", "Patna", "district_admin")).toBe(
      "Error: Unauthorized. You may only query data for Patna.",
    );
    expect(assertDistrictAccess("Kerala", "Patna", "field_responder")).toBe(
      "Error: Unauthorized. You may only query data for Patna.",
    );
  });

  it("allows calls that carry no district argument (route tools)", () => {
    expect(assertDistrictAccess(undefined, "Patna", "field_responder")).toBeNull();
    expect(assertDistrictAccess(null, "Patna", "field_responder")).toBeNull();
  });
});

describe("scopeToolResult (post-execution filtering)", () => {
  const sheltersResult = {
    district: "Patna",
    shelters: [
      { id: "a", name: "Patna Hall", district: "Patna" },
      { id: "b", name: "Kochi Hall", district: "Kerala" },
    ],
  };

  it("filters district-bearing arrays inside a tool result", () => {
    const scoped = scopeToolResult(sheltersResult, "Patna", "field_responder") as {
      shelters: Array<{ district: string }>;
    };
    expect(scoped.shelters.map((s) => s.district)).toEqual(["Patna"]);
  });

  it("returns the whole result for super_admin", () => {
    const scoped = scopeToolResult(sheltersResult, "Patna", "super_admin") as {
      shelters: Array<{ district: string }>;
    };
    expect(scoped.shelters).toHaveLength(2);
  });

  it("leaves arrays without district-bearing items untouched", () => {
    const resources = { district: "Patna", resources: [{ id: "r1", name: "Boats" }] };
    const scoped = scopeToolResult(resources, "Patna", "field_responder") as {
      resources: Array<{ id: string }>;
    };
    expect(scoped.resources).toHaveLength(1); // not nuked — guarded pre-call
  });

  it("filters a bare array of district-bearing items", () => {
    const scoped = scopeToolResult(
      [{ district: "Patna" }, { district: "Kerala" }],
      "Patna",
      "district_admin",
    );
    expect(scoped).toEqual([{ district: "Patna" }]);
  });

  it("passes through primitives", () => {
    expect(scopeToolResult("ok", "Patna", "field_responder")).toBe("ok");
    expect(scopeToolResult(null, "Patna", "field_responder")).toBeNull();
  });
});
