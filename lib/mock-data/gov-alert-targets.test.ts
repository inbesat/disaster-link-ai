// lib/mock-data/gov-alert-targets.test.ts — Phase 11 · Steps 1–2 ·
// Alert Composer data-layer invariants.

import { describe, expect, it } from "vitest";
import {
  estimateRecipients,
  formatCompact,
  polygonAreaKm2,
  GOV_ALERT_CHANNELS,
  GOV_ALERT_TYPES,
  GOV_ALERT_VILLAGES,
  GOV_DISTRICT_CENTERS,
  GOV_SEVERITIES,
} from "@/lib/mock-data/gov-alert-targets";

describe("gov-alert-targets", () => {
  it("catalogues exactly the roadmap's option sets", () => {
    expect(GOV_ALERT_TYPES.map((t) => t.value)).toEqual([
      "flood_warning",
      "evac_order",
      "road_closure",
    ]);
    expect(GOV_SEVERITIES.map((s) => s.value)).toEqual(["watch", "warning", "critical"]);
    expect(GOV_ALERT_CHANNELS.map((c) => c.value)).toEqual([
      "push",
      "sms",
      "whatsapp",
      "voice",
    ]);
  });

  it("provides villages + district centres for the target selector", () => {
    expect(GOV_ALERT_VILLAGES.length).toBeGreaterThanOrEqual(10);
    expect(GOV_ALERT_VILLAGES.every((v) => v.name && v.lat && v.lng)).toBe(true);
    expect(GOV_DISTRICT_CENTERS["Patna"].population).toBeGreaterThan(1_000_000);
  });

  it("entire-district targeting reaches the full population scaled by severity", () => {
    const watch = estimateRecipients({
      district: "Patna",
      severity: "watch",
      channels: ["push"],
      mode: "entire",
      selectedVillages: 0,
      polygonAreaKm2: 0,
    });
    expect(watch.total).toBe(Math.round(GOV_DISTRICT_CENTERS["Patna"].population * 0.9));

    const critical = estimateRecipients({
      district: "Patna",
      severity: "critical",
      channels: ["push"],
      mode: "entire",
      selectedVillages: 0,
      polygonAreaKm2: 0,
    });
    expect(critical.total).toBeGreaterThan(watch.total);
  });

  it("village mode scales the reach by selected-village fraction", () => {
    const one = estimateRecipients({
      district: "Patna",
      severity: "watch",
      channels: ["sms"],
      mode: "villages",
      selectedVillages: 1,
      polygonAreaKm2: 0,
    });
    const all = estimateRecipients({
      district: "Patna",
      severity: "watch",
      channels: ["sms"],
      mode: "villages",
      selectedVillages: GOV_ALERT_VILLAGES.length,
      polygonAreaKm2: 0,
    });
    expect(one.total).toBeLessThan(all.total);
    expect(all.total).toBe(Math.round(GOV_DISTRICT_CENTERS["Patna"].population * 0.8));
  });

  it("per-channel reach is deterministic and ordered by the channel list", () => {
    const { perChannel } = estimateRecipients({
      district: "Patna",
      severity: "warning",
      channels: ["push", "sms", "voice"],
      mode: "entire",
      selectedVillages: 0,
      polygonAreaKm2: 0,
    });
    expect(perChannel).toHaveLength(3);
    expect(perChannel[0].count).toBeGreaterThan(perChannel[2].count); // voice reach lowest
  });

  it("computes polygon area from a drawn ring", () => {
    // ~10 km² square around Patna.
    const ring: [number, number][] = [
      [85.1, 25.59],
      [85.2, 25.59],
      [85.2, 25.68],
      [85.1, 25.68],
    ];
    const area = polygonAreaKm2(ring);
    expect(area).toBeGreaterThan(60); // 1° lat ≈ 111 km, so ~100 km²
    expect(area).toBeLessThan(140);
    expect(
      polygonAreaKm2([
        [85, 25],
        [85.1, 25],
      ]),
    ).toBe(0); // under 3 points
  });

  it("formats magnitudes compactly", () => {
    expect(formatCompact(4_630_000)).toBe("4.6M");
    expect(formatCompact(12_400)).toBe("12.4K");
    expect(formatCompact(999)).toBe("999");
  });
});
