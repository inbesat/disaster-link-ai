// Phase 4 — data ingestion tests: live-path validation and the
// synthetic fallback that keeps the demo alive when upstream APIs fail.
import { describe, it, expect, vi, afterEach } from "vitest";
import { getSafeWeatherData } from "./fetcher";

// The fetcher talks to the DB only to log data-source health; stub it out
// so these tests are hermetic (no database, no network).
vi.mock("@/server/prisma", () => ({
  prisma: {
    dataSource: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSafeWeatherData (Phase 4)", () => {
  it("uses live data when both weather and flood APIs validate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/weather")) {
          return {
            ok: true,
            json: async () => ({ weather: { rainfall_mm: 62.4 } }),
          };
        }
        if (url.includes("/api/flood")) {
          return {
            ok: true,
            json: async () => ({ peak_discharge_m3s: 1450 }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }),
    );

    const result = await getSafeWeatherData(25.5941, 85.1376);
    expect(result.source).toBe("live");
    expect(result.rainfall_mm).toBe(62.4);
    expect(result.river_discharge_m3s).toBe(1450);
    expect(result.district).toBe("Patna");
  });

  it("falls back to synthetic data when upstream requests fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("upstream down")));
    const result = await getSafeWeatherData(25.5941, 85.1376);
    expect(result.source).toBe("synthetic");
    expect(result.rainfall_mm).toBeGreaterThanOrEqual(0);
    expect(result.rainfall_mm).toBeLessThanOrEqual(1000);
  });

  it("rejects out-of-range rainfall (validation) and falls back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/weather")) {
          return {
            ok: true,
            json: async () => ({ weather: { rainfall_mm: 5000 } }),
          };
        }
        return {
          ok: true,
          json: async () => ({ peak_discharge_m3s: 1200 }),
        };
      }),
    );

    const result = await getSafeWeatherData(25.5941, 85.1376);
    expect(result.source).toBe("synthetic");
    expect(result.rainfall_mm).toBeLessThanOrEqual(1000);
  });

  it("produces deterministic synthetic data for the same location", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("upstream down")));
    const first = await getSafeWeatherData(25.5941, 85.1376);
    const second = await getSafeWeatherData(25.5941, 85.1376);
    expect(first.rainfall_mm).toBe(second.rainfall_mm);
    expect(first.river_level_m).toBe(second.river_level_m);
  });
});
