// ---------------------------------------------------------------------
// lib/map/gov-map-export.test.ts — Phase 8 · Step 8.
// Pins the situation-report metadata: legend assembly from visible
// layers, the Web-Mercator scale-bar math, distance formatting, and the
// deterministic IST timestamp.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildScaleBar,
  formatExportTimestamp,
  formatScaleDistance,
  legendItemsForLayers,
  metersPerPixel,
} from "./gov-map-export";
import {
  DEFAULT_GOV_LAYER_STATES,
  GOV_LAYER_COLORS,
  GOV_LAYER_LABELS,
  GOV_MAP_LAYER_KEYS,
  type GovLayerState,
  type GovMapLayerKey,
} from "./gov-map-layers";

describe("legendItemsForLayers", () => {
  it("lists only the visible layers, in catalog order", () => {
    const layers: Record<GovMapLayerKey, GovLayerState> = {
      ...DEFAULT_GOV_LAYER_STATES,
      crowdReports: { visible: true, opacity: 60 },
    };
    const legend = legendItemsForLayers(layers);
    expect(legend.map((i) => i.label)).toEqual([
      "Flood Risk Zones",
      "Shelters",
      "Resource Depots",
      "Evacuation Routes",
      "Responder Positions",
      "Road Closures",
      "Crowdsourced Reports",
    ]);
    expect(legend[0]).toEqual({
      label: GOV_LAYER_LABELS.floodRiskZones,
      color: GOV_LAYER_COLORS.floodRiskZones,
    });
  });

  it("returns an empty list when every layer is hidden", () => {
    const hidden = Object.fromEntries(
      GOV_MAP_LAYER_KEYS.map((k) => [k, { visible: false }]),
    ) as Record<string, { visible: boolean }>;
    expect(legendItemsForLayers(hidden)).toEqual([]);
  });
});

describe("metersPerPixel", () => {
  it("≈69 m/px at zoom 11 on the Ganges plain (~25.6°N)", () => {
    expect(metersPerPixel(11, 25.594)).toBeGreaterThan(65);
    expect(metersPerPixel(11, 25.594)).toBeLessThan(72);
  });

  it("halves when zoom increases by 1", () => {
    expect(metersPerPixel(12, 25.594)).toBeCloseTo(metersPerPixel(11, 25.594) / 2, 6);
  });
});

describe("formatScaleDistance", () => {
  it("formats km above 1000 m and m below", () => {
    expect(formatScaleDistance(2200)).toBe("2.2 km");
    expect(formatScaleDistance(15000)).toBe("15 km");
    expect(formatScaleDistance(500)).toBe("500 m");
    expect(formatScaleDistance(0)).toBe("0 m");
  });
});

describe("buildScaleBar", () => {
  it("derives a labelled bar from zoom + latitude", () => {
    const bar = buildScaleBar(120, 11, 25.594);
    expect(bar.widthPx).toBe(120);
    // ≈69 m/px × 120 px ≈ 8.3 km.
    expect(bar.meters).toBeGreaterThan(7500);
    expect(bar.meters).toBeLessThan(9000);
    expect(bar.label).toBe("8.3 km");
  });
});

describe("formatExportTimestamp", () => {
  it("stamps in IST regardless of the host timezone", () => {
    // 09:02 UTC → 14:32 IST (+5:30).
    expect(formatExportTimestamp(new Date("2026-08-11T09:02:00Z"))).toBe(
      "11 Aug 2026, 14:32",
    );
  });
});
