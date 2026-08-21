import { describe, it, expect } from "vitest";
import {
  trackApiLatency,
  trackAILatency,
  trackMapPerformance,
  trackAlertDeliveryLatency,
  getPerformanceAverages,
} from "./performance";

describe("lib/monitoring/performance", () => {
  it("tracks latencies and computes averages", () => {
    trackApiLatency("/api/disasters", 100);
    trackApiLatency("/api/shelters", 200);

    trackAILatency("gpt-4o", 1000);
    trackAILatency("gpt-4o", 2000);

    trackMapPerformance("initial_load", 400);

    trackAlertDeliveryLatency("alert-1", "sms", 500);

    const averages = getPerformanceAverages();

    expect(averages.avgApiLatencyMs).toBe(150);
    expect(averages.avgAiLatencyMs).toBe(1500);
    expect(averages.avgMapRenderMs).toBe(400);
    expect(averages.avgAlertDeliveryMs).toBe(500);
  });
});
