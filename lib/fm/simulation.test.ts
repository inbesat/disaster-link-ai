// ---------------------------------------------------------------------
// lib/fm/simulation.test.ts — Phase 9 · FM Broadcast Simulator engine.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildSimulationPipeline,
  judgesSnapshot,
  runTestBroadcast,
  simulatorStationsFor,
  TEST_BROADCAST_CONFIRMATION,
  TEST_FM_STATIONS,
} from "./simulation";

describe("TEST_FM_STATIONS (Phase 9)", () => {
  it("provides 5 test stations with fake endpoints and a TEST identity", () => {
    expect(TEST_FM_STATIONS).toHaveLength(5);
    for (const station of TEST_FM_STATIONS) {
      expect(station.name).toMatch(/^TEST /);
      expect(station.emergencyApiEndpoint).toMatch(/^https:\/\/webhook\.site\//);
    }
  });

  it("mixes AIR, private and community stations", () => {
    const types = new Set(TEST_FM_STATIONS.map((s) => s.type));
    expect(types.has("air")).toBe(true);
    expect(types.has("private")).toBe(true);
  });

  it("has the exact safeguard phrase", () => {
    expect(TEST_BROADCAST_CONFIRMATION).toBe("BROADCAST TEST");
  });
});

describe("simulatorStationsFor (Phase 9)", () => {
  it("resolves covering stations for Patna using the geo lookup", () => {
    const stations = simulatorStationsFor("patna");
    expect(stations.length).toBeGreaterThan(0);
    expect(stations.some((s) => s.type === "air")).toBe(true);
  });

  it("returns [] for an unknown district", () => {
    expect(simulatorStationsFor("nope")).toEqual([]);
  });
});

describe("judgesSnapshot (Phase 9)", () => {
  it("exposes the if-this-were-live numbers", () => {
    const snap = judgesSnapshot("patna");
    expect(snap).not.toBeNull();
    expect(snap!.stationCount).toBeGreaterThan(0);
    expect(snap!.citizens).toBeGreaterThan(0);
    expect(snap!.latencySeconds).toBe(8);
  });

  it("returns null for an unknown district", () => {
    expect(judgesSnapshot("nope")).toBeNull();
  });
});

describe("buildSimulationPipeline (Phase 9)", () => {
  it("starts with detection and voice, ends with confirmation", () => {
    const pipeline = buildSimulationPipeline({
      districtName: "Patna",
      disasterType: "flood",
      stations: [
        { name: "AIR Patna FM", rdsEnabled: true },
        { name: "Radio Mirchi 98.3", rdsEnabled: false },
      ],
    });

    expect(pipeline[0].type).toBe("detect");
    expect(pipeline[1].type).toBe("voice");
    expect(pipeline[pipeline.length - 1].type).toBe("confirmed");
    expect(pipeline[pipeline.length - 1].label).toContain("2 stations");
  });

  it("adds a push stage per station and an RDS stage only when enabled", () => {
    const pipeline = buildSimulationPipeline({
      districtName: "Patna",
      disasterType: "flood",
      stations: [
        { name: "AIR Patna FM", rdsEnabled: true },
        { name: "Radio Mirchi 98.3", rdsEnabled: false },
      ],
    });

    const pushes = pipeline.filter((s) => s.type === "push");
    const rds = pipeline.filter((s) => s.type === "rds");
    expect(pushes).toHaveLength(2);
    expect(rds).toHaveLength(1);
    expect(pushes[0].station).toBe("AIR Patna FM");
  });

  it("uppercases the disaster type in the detection label", () => {
    const pipeline = buildSimulationPipeline({
      districtName: "Puri",
      disasterType: "cyclone",
      stations: [],
    });
    expect(pipeline[0].label).toContain("CYCLONE");
  });
});

describe("runTestBroadcast (Phase 9)", () => {
  it("delivers every test station via cap_api, plus RDS where enabled", () => {
    const results = runTestBroadcast();
    const capApi = results.filter((r) => r.strategy === "cap_api");
    const rds = results.filter((r) => r.strategy === "rds");
    expect(capApi).toHaveLength(5);
    expect(rds).toHaveLength(TEST_FM_STATIONS.filter((s) => s.rdsEnabled).length);
    for (const result of results) {
      expect(result.test).toBe(true);
      expect(result.status).toBe("delivered");
      expect(result.responseCode).toBe(200);
    }
  });
});
