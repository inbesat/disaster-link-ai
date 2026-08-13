// ---------------------------------------------------------------------
// lib/offline-context/context-builder.test.ts
// Phase 5 · context assembly from the offline cache with a fake reader.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { buildContext, ALL_SECTIONS, type OfflineDataReader } from "./context-builder";
import type { OfflineRecord, DataType } from "@/lib/offline-sync/types";

const now = new Date().toISOString();

function record(district: string, id: string, data: unknown): OfflineRecord {
  return { id, district, data: data as never, cachedAt: now, expiresAt: now };
}

function fakeReader(district = "Patna"): OfflineDataReader {
  return {
    getOfflineData: async <T = unknown>(type: DataType, _district: string): Promise<Array<OfflineRecord<T>>> => {
      void _district;
      if (type === "predictions") {
        return [record(district, "p1", { day: "today", riskLevel: "High", confidence: 82, source: "GLOFAS" }) as never];
      }
      if (type === "alerts") {
        return [record(district, "a1", { severity: "critical", message: "River crossing 3m" }) as never];
      }
      if (type === "resources") {
        return [record(district, "r1", { type: "shelter", name: "Hall A", address: "Station Rd", distance: 1.2 }) as never];
      }
      if (type === "weather") {
        return [record(district, "w1", { forecastTime: "14:00", condition: "Rain", rainChance: 90 }) as never];
      }
      if (type === "knowledge") {
        return [record(district, "k1", { title: "First Aid", content: "Check breathing." }) as never];
      }
      return [] as Array<OfflineRecord<T>>;
    },
  };
}

describe("buildContext", () => {
  it("assembles situation, resources, weather and knowledge sections", async () => {
    const ctx = await buildContext("Patna", ALL_SECTIONS, fakeReader());
    expect(ctx.text).toContain("CURRENT SITUATION (Patna)");
    expect(ctx.text).toContain("Flood Risk: High (82% confidence)");
    expect(ctx.text).toContain("critical: River crossing 3m");
    expect(ctx.text).toContain("Hall A at Station Rd (1.2 km)");
    expect(ctx.text).toContain("14:00: Rain,");
    expect(ctx.text).toContain("Rain: 90%");
    expect(ctx.text).toContain("First Aid");
    expect(ctx.counts.alerts).toBe(1);
    expect(ctx.tokenCount).toBeGreaterThan(0);
  });

  it("respects section toggles", async () => {
    const ctx = await buildContext(
      "Patna",
      { situation: true, resources: false, weather: false, knowledge: false },
      fakeReader(),
    );
    expect(ctx.text).toContain("CURRENT SITUATION");
    expect(ctx.text).not.toContain("NEARBY RESOURCES");
    expect(ctx.text).not.toContain("WEATHER");
  });
});