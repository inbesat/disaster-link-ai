// ---------------------------------------------------------------------
// lib/mock-data/resource-inventory.test.ts — Phase 10 · Steps 1–2.
// The inventory table and the map view both render RESOURCE_INVENTORY,
// so these tests pin the dataset shape: every row carries the fields
// both views depend on, status/category metadata cover every value used,
// and coordinates stay inside the Patna/Punpun theatre (map sanity).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  CATEGORY_META,
  RESOURCE_INVENTORY,
  STATUS_META,
  formatQuantity,
  resourcesByCategory,
  resourcesByStatus,
  type ResourceCategory,
  type ResourceStatus,
} from "./resource-inventory";

const ALL_CATEGORIES: ResourceCategory[] = ["boat", "medical", "food", "tent"];
const ALL_STATUSES: ResourceStatus[] = ["available", "deployed", "maintenance"];

describe("RESOURCE_INVENTORY dataset", () => {
  it("covers every category and status combination used by the UI", () => {
    for (const category of ALL_CATEGORIES) {
      for (const status of ALL_STATUSES) {
        expect(
          RESOURCE_INVENTORY.some((r) => r.category === category && r.status === status),
          `expected at least one ${category}/${status} row`,
        ).toBe(true);
      }
    }
  });

  it("has complete rows (both the table and map read every field)", () => {
    for (const row of RESOURCE_INVENTORY) {
      expect(row.id).toBeTruthy();
      expect(row.name).toBeTruthy();
      expect(row.unit).toBeTruthy();
      expect(row.location).toBeTruthy();
      expect(row.assignedTo).toBeTruthy();
      expect(row.lastUpdated).toBeTruthy();
      expect(row.quantity).toBeGreaterThan(0);
      expect(ALL_CATEGORIES).toContain(row.category);
      expect(ALL_STATUSES).toContain(row.status);
    }
  });

  it("keeps coordinates in the Patna / Punpun theatre (lat 25.4–25.7, lng 85.0–85.2)", () => {
    for (const row of RESOURCE_INVENTORY) {
      expect(row.lat).toBeGreaterThanOrEqual(25.4);
      expect(row.lat).toBeLessThanOrEqual(25.7);
      expect(row.lng).toBeGreaterThanOrEqual(85.0);
      expect(row.lng).toBeLessThanOrEqual(85.2);
    }
  });

  it("has unique ids (stable React keys for table rows + map markers)", () => {
    const ids = RESOURCE_INVENTORY.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("metadata", () => {
  it("defines emoji/hex meta for every category", () => {
    for (const category of ALL_CATEGORIES) {
      expect(CATEGORY_META[category].emoji).toBeTruthy();
      expect(CATEGORY_META[category].hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(CATEGORY_META[category].label).toBeTruthy();
    }
  });

  it("defines a marker colour for every status", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_META[status].marker).toMatch(/^bg-/);
      expect(STATUS_META[status].label).toBeTruthy();
    }
  });
});

describe("helpers", () => {
  it("filters by category", () => {
    expect(resourcesByCategory("boat").every((r) => r.category === "boat")).toBe(true);
    expect(resourcesByCategory("boat").length).toBeGreaterThan(0);
  });

  it("filters by status", () => {
    expect(resourcesByStatus("available").every((r) => r.status === "available")).toBe(
      true,
    );
    expect(resourcesByStatus("available").length).toBeGreaterThan(0);
  });

  it("formats quantities with Indian numbering", () => {
    expect(formatQuantity({ ...RESOURCE_INVENTORY[0], quantity: 2000 })).toBe(
      "2,000 boats",
    );
  });
});
