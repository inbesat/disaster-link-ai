// Phase 6 · RDS encoder tests — severity templates, CAP severity mapping,
// confirmation parsing, and sendRDSText with a mocked encoder API.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RDS_MAX_CHARS } from "./rds-text";
import {
  buildEmergencyRdsText,
  buildSeverityRdsText,
  mapCapSeverity,
  parseRdsConfirmation,
  rdsDisasterLabel,
  sendRDSText,
  type RdsStationLike,
} from "./rds-encoder";

function makeStation(overrides: Partial<RdsStationLike> = {}): RdsStationLike {
  return {
    id: "stn-rds",
    name: "Radio Patna",
    rdsEnabled: true,
    rdsApiEndpoint: "https://rds.station.in/ps",
    ...overrides,
  };
}

describe("mapCapSeverity (Phase 6)", () => {
  it("maps CAP severities to RDS tiers", () => {
    expect(mapCapSeverity("Extreme")).toBe("critical");
    expect(mapCapSeverity("Severe")).toBe("critical");
    expect(mapCapSeverity("Moderate")).toBe("warning");
    expect(mapCapSeverity("Minor")).toBe("watch");
    // Unknown/blank must not under-warn — stays on "warning".
    expect(mapCapSeverity("Unknown")).toBe("warning");
    expect(mapCapSeverity(null)).toBe("warning");
    expect(mapCapSeverity("")).toBe("warning");
  });
});

describe("rdsDisasterLabel (Phase 6)", () => {
  it("renders known disaster types uppercase", () => {
    expect(rdsDisasterLabel("flood")).toBe("FLOOD");
    expect(rdsDisasterLabel("cyclone")).toBe("CYCLONE");
    expect(rdsDisasterLabel("earthquake")).toBe("EARTHQUAKE");
    expect(rdsDisasterLabel("heatwave")).toBe("HEATWAVE");
    expect(rdsDisasterLabel(null)).toBe("EMERGENCY");
    expect(rdsDisasterLabel("storm")).toBe("STORM");
  });
});

describe("buildSeverityRdsText (Phase 6)", () => {
  it("builds the critical EVACUATE NOW line within 64 chars", () => {
    const text = buildSeverityRdsText({
      severity: "critical",
      disasterType: "flood",
      district: "Patna",
    });
    expect(text.startsWith("EVACUATE NOW:")).toBe(true);
    expect(text).toContain("FLOOD");
    expect(text).toContain("PATNA");
    expect(text).toContain("1070");
    expect(text.length).toBeLessThanOrEqual(RDS_MAX_CHARS);
  });

  it("builds warning and watch lines with their prefixes", () => {
    const warning = buildSeverityRdsText({
      severity: "warning",
      disasterType: "cyclone",
      district: "Puri",
    });
    expect(warning.startsWith("WARNING: CYCLONE expected in PURI.")).toBe(true);
    expect(warning.length).toBeLessThanOrEqual(RDS_MAX_CHARS);

    const watch = buildSeverityRdsText({
      severity: "watch",
      disasterType: "heatwave",
      district: "Muzaffarpur",
    });
    expect(watch.startsWith("WATCH: HEATWAVE conditions in MUZAFFARPUR.")).toBe(true);
    expect(watch.length).toBeLessThanOrEqual(RDS_MAX_CHARS);
  });

  it("uses a custom helpline when provided", () => {
    const text = buildSeverityRdsText({
      severity: "critical",
      disasterType: "flood",
      district: "Patna",
      helpline: "112",
    });
    expect(text).toContain("Call 112");
  });

  it("never truncates mid-word (smart truncation)", () => {
    const text = buildSeverityRdsText({
      severity: "critical",
      disasterType: "earthquake",
      district: "North Eastern Region District",
    });
    expect(text.length).toBeLessThanOrEqual(RDS_MAX_CHARS);
    expect(text.endsWith(" ")).toBe(false);
  });
});

describe("buildEmergencyRdsText (Phase 6)", () => {
  it("uses the severity template for known disaster types", () => {
    const text = buildEmergencyRdsText({
      severity: "critical",
      disasterType: "flood",
      district: "Patna",
    });
    expect(text.startsWith("EVACUATE NOW:")).toBe(true);
  });

  it("falls back to the generic builder for unknown types", () => {
    const text = buildEmergencyRdsText({
      severity: "critical",
      disasterType: "landslide",
      district: "Darjeeling",
      headline: "Landslide Warning: Darjeeling",
      instruction: "Move to higher ground.",
    });
    expect(text.startsWith("EMERGENCY:")).toBe(true);
    expect(text).toContain("Darjeeling");
    expect(text.length).toBeLessThanOrEqual(RDS_MAX_CHARS);
  });
});

describe("parseRdsConfirmation (Phase 6)", () => {
  it("confirms when the encoder echoes the sent text", () => {
    const sent = "EVACUATE NOW: FLOOD in PATNA. Go to shelter. Call 1070";
    expect(parseRdsConfirmation(JSON.stringify({ text: sent }), sent)).toBe(true);
  });

  it("confirms on live/active keywords", () => {
    expect(parseRdsConfirmation('{"status":"live"}', "anything")).toBe(true);
    expect(parseRdsConfirmation("confirmed=true", "anything")).toBe(true);
  });

  it("does not confirm a generic ok response", () => {
    expect(parseRdsConfirmation('{"status":"ok"}', "EVACUATE NOW: FLOOD in PATNA")).toBe(
      false,
    );
  });

  it("never confirms against a too-short sent text", () => {
    expect(parseRdsConfirmation("EVACUATE NOW", "GO")).toBe(false);
  });
});

describe("sendRDSText (Phase 6)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a station that is not RDS-enabled", async () => {
    const result = await sendRDSText(
      makeStation({ rdsEnabled: false, rdsApiEndpoint: null }),
      "Alert.",
      30,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Not an RDS station");
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("rejects a non-http(s) encoder endpoint without fetching (SSRF guard)", async () => {
    const result = await sendRDSText(
      makeStation({ rdsApiEndpoint: "file:///etc/passwd" }),
      "Alert.",
      30,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unusable RDS endpoint");
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("POSTs the ≤64-char text with the duration + routing ids to the encoder API", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    vi.mocked(fetch).mockImplementation(send);

    const longText = "X".repeat(120);
    const result = await sendRDSText(makeStation(), longText, 45, {
      stationId: "stn-rds",
      alertId: "dl-1",
    });

    expect(result.ok).toBe(true);
    const [url, init] = send.mock.calls[0];
    expect(url).toBe("https://rds.station.in/ps");
    const body = JSON.parse((init as RequestInit).body as string) as {
      rds_text: string;
      duration_minutes: number;
      station_id: string;
      alert_id: string;
    };
    expect(body.rds_text.length).toBeLessThanOrEqual(RDS_MAX_CHARS);
    expect(body.duration_minutes).toBe(45);
    expect(body.station_id).toBe("stn-rds");
    expect(body.alert_id).toBe("dl-1");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer /);
  });

  it("clamps a sub-minute duration to 1 minute", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    vi.mocked(fetch).mockImplementation(send);
    await sendRDSText(makeStation(), "Alert.", 0.2);
    const body = JSON.parse((send.mock.calls[0][1] as RequestInit).body as string) as {
      duration_minutes: number;
    };
    expect(body.duration_minutes).toBe(1);
  });

  it("marks a response that echoes the text as confirmed", async () => {
    const sent = "EVACUATE NOW: FLOOD in PATNA. Go to shelter. Call 1070";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ text: sent, confirmed: true }), { status: 200 }),
    );
    const result = await sendRDSText(makeStation(), sent, 30);
    expect(result.ok).toBe(true);
    expect(result.confirmed).toBe(true);
  });

  it("treats a generic ok as delivered but not confirmed", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    const result = await sendRDSText(makeStation(), "EVACUATE NOW: FLOOD in PATNA", 30);
    expect(result.ok).toBe(true);
    expect(result.confirmed).toBe(false);
  });

  it("fails on a non-2xx encoder response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("rate limited", { status: 429 }));
    const result = await sendRDSText(makeStation(), "Alert.", 30);
    expect(result.ok).toBe(false);
    expect(result.responseCode).toBe(429);
  });

  it("fails gracefully on network errors without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await sendRDSText(makeStation(), "Alert.", 30);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ECONNREFUSED");
  });
});
