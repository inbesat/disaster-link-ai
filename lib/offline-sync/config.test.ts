// ---------------------------------------------------------------------
// lib/offline-sync/config.test.ts
// Phase 2 · dataset registry sanity checks: every dataset has a config,
// priority ordering is complete, and priorities are ordered correctly.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  DATA_SOURCE_CONFIGS,
  PRIORITY_ORDER,
  configForType,
} from "./config";
import { DATA_TYPES } from "./types";

describe("offline-sync config", () => {
  it("covers every supported data type", () => {
    const types = DATA_SOURCE_CONFIGS.map((c) => c.type as string).sort();
    const expected = [...DATA_TYPES].sort();
    expect(types).toEqual(expected);
  });

  it("ties every dataset to a priority band", () => {
    for (const config of DATA_SOURCE_CONFIGS) {
      expect(PRIORITY_ORDER[config.priority as string]).toBeDefined();
    }
  });

  it("orders critical datasets before normal/low", () => {
    const critical = DATA_SOURCE_CONFIGS.find((c) => c.priority === "critical");
    const low = DATA_SOURCE_CONFIGS.find((c) => c.priority === "low");
    expect(critical?.type).toBe("alerts");
    expect(critical && PRIORITY_ORDER[critical.priority]).toBeLessThan(
      PRIORITY_ORDER[(low as { priority: string }).priority],
    );
  });

  it("exposes a typesafe per-type lookup", () => {
    expect(configForType("weather")?.sizeBytes).toBeGreaterThan(0);
    expect(configForType("nope" as never)).toBeUndefined();
  });

  it("keeps the 48h offline window on the core datasets", () => {
    for (const type of ["predictions", "alerts", "resources", "weather", "routes"] as const) {
      const config = configForType(type);
      expect(config?.ttlHours).toBe(48);
    }
  });
});