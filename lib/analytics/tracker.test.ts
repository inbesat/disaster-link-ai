// Step 9 — dual-mode analytics tracker tests: log format + mock summary.
import { describe, it, expect, vi, afterEach } from "vitest";
import { logFeatureUsage, getAnalyticsSummary } from "./tracker";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logFeatureUsage", () => {
  it("logs the dual-mode format: ROLE user in DISTRICT triggered FEATURE", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logFeatureUsage("sos_button", "public", "Patna");
    expect(spy).toHaveBeenCalledWith("PUBLIC user in Patna triggered SOS_BUTTON");
  });

  it("works for gov roles too", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logFeatureUsage("ai_planner", "district_admin", "Kamrup");
    expect(spy).toHaveBeenCalledWith(
      "DISTRICT_ADMIN user in Kamrup triggered AI_PLANNER",
    );
  });
});

describe("getAnalyticsSummary", () => {
  it("returns the mock headline numbers", () => {
    expect(getAnalyticsSummary()).toBe(
      "Citizens used SOS 340 times. Gov used AI Planner 42 times.",
    );
  });
});
