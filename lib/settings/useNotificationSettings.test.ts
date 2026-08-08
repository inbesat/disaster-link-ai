import { describe, expect, it } from "vitest";
import {
  createDefaultSettings,
  mergeSettingsSnapshot,
  type NotificationSettings,
} from "./useNotificationSettings";

// ---------------------------------------------------------------------
// lib/settings/useNotificationSettings.test.ts — Step 10.
//
// Verifies the sanitization + merge logic that protects the central store:
// corrupt, partial, or malicious localStorage snapshots can never pierce the
// type boundaries of NotificationSettings, and defaults are always intact.
// ---------------------------------------------------------------------

describe("createDefaultSettings", () => {
  it("returns a complete settings object", () => {
    const settings = createDefaultSettings();
    expect(settings.paused).toBe(false);
    expect(settings.dndEnabled).toBe(false);
    expect(settings.overrideDndCritical).toBe(true);
    expect(settings.homeDistrictAlerts).toBe(true);
    expect(settings.hapticsEnabled).toBe(true);
    expect(settings.tone).toBe("standard_siren");
    expect(settings.digestTime).toBe("08:00");
    expect(typeof settings.routes.flood_warnings.in_app).toBe("boolean");
    expect(settings.thresholds.flood_warnings).toBe("high_and_above");
  });

  it("returns a fresh object each call (no shared references)", () => {
    const a = createDefaultSettings();
    const b = createDefaultSettings();
    expect(a).not.toBe(b);
    expect(a.routes).not.toBe(b.routes);
  });
});

describe("mergeSettingsSnapshot", () => {
  it("ignores null / undefined / non-object input", () => {
    expect(mergeSettingsSnapshot(undefined)).toEqual(createDefaultSettings());
    expect(mergeSettingsSnapshot(null)).toEqual(createDefaultSettings());
  });

  it("applies valid booleans for routes and thresholds", () => {
    const merged = mergeSettingsSnapshot({
      routes: {
        flood_warnings: { sms: false, email: false },
        evacuation_orders: { sms: true },
      },
      thresholds: { flood_warnings: "all_alerts" },
    } as Partial<NotificationSettings>);

    expect(merged.routes.flood_warnings.sms).toBe(false);
    expect(merged.routes.flood_warnings.email).toBe(false);
    // untouched channel keeps its default
    expect(merged.routes.flood_warnings.in_app).toBe(true);
    expect(merged.routes.evacuation_orders.sms).toBe(true);
    expect(merged.thresholds.flood_warnings).toBe("all_alerts");
  });

  it("rejects non-boolean route values", () => {
    const merged = mergeSettingsSnapshot({
      routes: {
        flood_warnings: { sms: "yes" as unknown as boolean },
      },
    } as Partial<NotificationSettings>);

    expect(merged.routes.flood_warnings.sms).toBe(true); // default preserved
  });

  it("ignores out-of-range radius indices", () => {
    expect(mergeSettingsSnapshot({ radiusIndex: -1 }).radiusIndex).toBe(3);
    expect(mergeSettingsSnapshot({ radiusIndex: 99 }).radiusIndex).toBe(3);
    expect(mergeSettingsSnapshot({ radiusIndex: 4.5 }).radiusIndex).toBe(3);
    expect(mergeSettingsSnapshot({ radiusIndex: 0 }).radiusIndex).toBe(0);
  });

  it("only accepts known tones and HH:MM times", () => {
    const merged = mergeSettingsSnapshot({
      tone: "bagpipe",
      quietStart: "12:00",
      quietEnd: "not-a-time",
      digestTime: "7pm",
    } as unknown as Partial<NotificationSettings>);

    expect(merged.tone).toBe("standard_siren");
    expect(merged.quietStart).toBe("12:00");
    expect(merged.quietEnd).toBe("06:00"); // default
    expect(merged.digestTime).toBe("08:00"); // default
  });

  it("respects an explicit override-DND off, but defaults it on", () => {
    expect(createDefaultSettings().overrideDndCritical).toBe(true);
    expect(mergeSettingsSnapshot({ overrideDndCritical: false }).overrideDndCritical)
      .toBe(false);
  });
});