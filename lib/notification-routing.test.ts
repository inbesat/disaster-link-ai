import { describe, expect, it } from "vitest";
import {
  CATEGORY_KEYS,
  CHANNEL_KEYS,
  CRITICAL_CATEGORIES,
  DEFAULT_ROUTES,
  DEFAULT_THRESHOLDS,
  channelEnablement,
  countActiveRoutes,
  flipRoute,
  initialRoutes,
  isThresholdLocked,
  passesThreshold,
  setThreshold,
  type CategoryKey,
  type SeverityLevel,
} from "./notification-routing";

// ---------------------------------------------------------------------
// lib/notification-routing.test.ts — audit of the routing matrix logic
// (Settings · Phase 2):
//   • recommended canvas covers 5 categories × 4 channels
//   • flipRoute toggles one cell and never mutates the input
//   • counts stay in sync across flips and resets
//   • severity thresholds filter by minimum level; evacuation locks tight
// ---------------------------------------------------------------------

describe("initialRoutes", () => {
  it("returns one value per (category, channel) intersection", () => {
    const routes = initialRoutes();
    expect(CATEGORY_KEYS).toHaveLength(5);
    expect(CHANNEL_KEYS).toHaveLength(4);

    for (const category of CATEGORY_KEYS) {
      for (const channel of CHANNEL_KEYS) {
        expect(typeof routes[category][channel]).toBe("boolean");
      }
    }
  });

  it("keeps critical categories on every channel", () => {
    const routes = initialRoutes();
    for (const category of CRITICAL_CATEGORIES) {
      for (const channel of CHANNEL_KEYS) {
        expect(routes[category][channel]).toBe(true);
      }
    }
  });

  it("does not share references with DEFAULT_ROUTES", () => {
    const routes = initialRoutes();
    const next = flipRoute(routes, "chat_mentions", "sms");
    expect(next.chat_mentions.sms).toBe(true);
    expect(routes.chat_mentions.sms).toBe(false);
    // The defaults object itself must be untouched.
    expect(DEFAULT_ROUTES.chat_mentions.sms).toBe(false);
  });
});

describe("flipRoute", () => {
  it("toggles a single cell and returns a new object", () => {
    const before = initialRoutes();
    const after = flipRoute(before, "system_updates", "browser_push");

    expect(after).not.toBe(before);
    expect(after.system_updates).not.toBe(before.system_updates);
    expect(after.system_updates.browser_push).toBe(true);
    expect(before.system_updates.browser_push).toBe(false);
  });

  it("leaves unrelated cells untouched", () => {
    const before = initialRoutes();
    const after = flipRoute(before, "resource_requests", "sms");

    expect(after.resource_requests.sms).toBe(true);
    expect(after.flood_warnings).toEqual(before.flood_warnings);
    expect(after.chat_mentions).toEqual(before.chat_mentions);
  });
});

describe("countActiveRoutes", () => {
  it("matches the total enabled cells in the default canvas", () => {
    const routes = initialRoutes();
    const expected = CATEGORY_KEYS.reduce(
      (total, category) =>
        total + CHANNEL_KEYS.filter((channel) => routes[category][channel]).length,
      0,
    );
    expect(countActiveRoutes(routes)).toBe(expected);
  });

  it("decrements when a cell is flipped off", () => {
    const before = countActiveRoutes(initialRoutes());
    const routes = flipRoute(initialRoutes(), "flood_warnings", "sms");
    const after = countActiveRoutes(routes);
    expect(after).toBe(before - 1);
  });
});

describe("channelEnablement", () => {
  it("reports which categories have a given channel on", () => {
    const routes = initialRoutes();
    const sms = channelEnablement(routes, "sms");
    expect(sms.count).toBe(2);
    expect(sms.onCategories).toContain("flood_warnings");
    expect(sms.onCategories).toContain("evacuation_orders");

    const push = channelEnablement(routes, "browser_push");
    expect(push.count).toBe(3);
  });

it("reflects a freshly flipped cell", () => {
    // Email defaults on for flood, evacuation, resource & system = 4.
    const routes = flipRoute(initialRoutes(), "chat_mentions", "email");
    const email = channelEnablement(routes, "email");
    expect(email.count).toBe(5);
    expect(email.onCategories).toContain("chat_mentions");
  });
});

describe("severity thresholds", () => {
  it("ships evacuation orders locked to Critical Only", () => {
    expect(isThresholdLocked("evacuation_orders")).toBe(true);
    expect(DEFAULT_THRESHOLDS.evacuation_orders).toBe("critical_only");
  });

  it("treats flood warnings as critical but adjustable", () => {
    expect(isThresholdLocked("flood_warnings")).toBe(false);
    expect(DEFAULT_THRESHOLDS.flood_warnings).toBe("high_and_above");
  });

  it("setThreshold never unbinds a locked category", () => {
    const next = setThreshold(
      DEFAULT_THRESHOLDS,
      "evacuation_orders",
      "all_alerts",
    );
    expect(next.evacuation_orders).toBe("critical_only");
  });

  it("setThreshold returns the same object when locked", () => {
    const result = setThreshold(
      DEFAULT_THRESHOLDS,
      "evacuation_orders",
      "all_alerts",
    );
    expect(result).toBe(DEFAULT_THRESHOLDS);
  });

  it("can relax or tighten an unlocked category immutably", () => {
    const next = setThreshold(DEFAULT_THRESHOLDS, "flood_warnings", "critical_only");
    expect(next).not.toBe(DEFAULT_THRESHOLDS);
    expect(next.flood_warnings).toBe("critical_only");
    expect(DEFAULT_THRESHOLDS.flood_warnings).toBe("high_and_above");
  });
});

describe("passesThreshold", () => {
  const thresholds = DEFAULT_THRESHOLDS;
  const cases: Array<{
    category: CategoryKey;
    level: SeverityLevel;
    allowed: boolean;
  }> = [
    // evacuation_orders at critical_only
    { category: "evacuation_orders", level: "critical", allowed: true },
    { category: "evacuation_orders", level: "high", allowed: false },
    { category: "evacuation_orders", level: "medium", allowed: false },
    // flood_warnings at high_and_above
    { category: "flood_warnings", level: "high", allowed: true },
    { category: "flood_warnings", level: "medium", allowed: false },
    // resource_requests at all_alerts
    { category: "resource_requests", level: "info", allowed: true },
  ];

  it("filters by the category minimum", () => {
    for (const { category, level, allowed } of cases) {
      expect(passesThreshold(thresholds, category, level)).toBe(allowed);
    }
  });

  it("critical always passes any category", () => {
    for (const category of CATEGORY_KEYS) {
      expect(passesThreshold(thresholds, category, "critical")).toBe(true);
    }
  });
});