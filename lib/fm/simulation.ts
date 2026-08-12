// ---------------------------------------------------------------------
// lib/fm/simulation.ts — Phase 9 · FM Broadcast Simulator (demo-only).
//
// Everything a judge-facing simulator needs, as pure functions:
//   • TEST_FM_STATIONS     — 5 stations with fake endpoints (webhook.site
//     placeholders). Only ever contacted by the guarded test-broadcast
//     route, which never touches real stations.
//   • SIMULATOR_DISTRICTS  — clickable demo districts for the map.
//   • simulatorStationsFor — resolves the covering stations for a
//     district from MOCK_FM_STATIONS (same geospatial lookup the real
//     dispatcher uses).
//   • buildSimulationPipeline — the deterministic animated stage sequence
//     (detect → voice → push per station → RDS → confirmed).
//   • runTestBroadcast()   — the safeguarded test-broadcast dry-run over
//     TEST_FM_STATIONS (no outbound calls; deterministic mock results).
//
// No network, no DB — fully unit-testable.
// ---------------------------------------------------------------------

import { findStationsInRadius } from "./find-stations";
import { MOCK_FM_STATIONS } from "./mock-stations";
import type { FmStationDTO } from "./serialize";

/** The exact phrase an admin must type to trigger a test broadcast. */
export const TEST_BROADCAST_CONFIRMATION = "BROADCAST TEST";

/** Harmless message used for the safeguarded test broadcast. */
export const TEST_BROADCAST_MESSAGE =
  "This is a test of the SafeSphere emergency broadcast system. No action required.";

/** Seconds a judge-facing counter claims from detection to broadcast. */
export const SIMULATED_BROADCAST_LATENCY_SECONDS = 8;

// ---------------------------------------------------------------------
// 1. TEST_FM_STATIONS — fake endpoints, staging/demo only.
// ---------------------------------------------------------------------

export interface TestFmStation {
  id: string;
  name: string;
  frequency: string;
  city: string;
  state: string;
  type: "air" | "private" | "community";
  emergencyApiEndpoint: string;
  rdsApiEndpoint: string | null;
  emergencyContactPhone: string;
  rdsEnabled: boolean;
}

export const TEST_FM_STATIONS: TestFmStation[] = [
  {
    id: "test-fm-air-patna",
    name: "TEST AIR Patna FM",
    frequency: "101.7 MHz",
    city: "Patna",
    state: "Bihar",
    type: "air",
    emergencyApiEndpoint: "https://webhook.site/test-air-patna",
    rdsApiEndpoint: "https://webhook.site/test-air-patna-rds",
    emergencyContactPhone: "+91-612-0000001",
    rdsEnabled: true,
  },
  {
    id: "test-fm-mirchi-patna",
    name: "TEST Radio Mirchi 98.3",
    frequency: "98.3 MHz",
    city: "Patna",
    state: "Bihar",
    type: "private",
    emergencyApiEndpoint: "https://webhook.site/test-mirchi-patna",
    rdsApiEndpoint: "https://webhook.site/test-mirchi-patna-rds",
    emergencyContactPhone: "+91-612-0000002",
    rdsEnabled: true,
  },
  {
    id: "test-fm-redfm-muzaffarpur",
    name: "TEST Red FM 93.5",
    frequency: "93.5 MHz",
    city: "Muzaffarpur",
    state: "Bihar",
    type: "private",
    emergencyApiEndpoint: "https://webhook.site/test-redfm-mzp",
    rdsApiEndpoint: null,
    emergencyContactPhone: "+91-621-0000003",
    rdsEnabled: false,
  },
  {
    id: "test-fm-city-delhi",
    name: "TEST Radio City 91.1",
    frequency: "91.1 MHz",
    city: "Delhi",
    state: "Delhi",
    type: "private",
    emergencyApiEndpoint: "https://webhook.site/test-city-delhi",
    rdsApiEndpoint: "https://webhook.site/test-city-delhi-rds",
    emergencyContactPhone: "+91-11-0000004",
    rdsEnabled: true,
  },
  {
    id: "test-fm-air-malda",
    name: "TEST AIR Malda FM",
    frequency: "100.3 MHz",
    city: "Malda",
    state: "West Bengal",
    type: "air",
    emergencyApiEndpoint: "https://webhook.site/test-air-malda",
    rdsApiEndpoint: null,
    emergencyContactPhone: "+91-3512-000005",
    rdsEnabled: false,
  },
];

// ---------------------------------------------------------------------
// 2. SIMULATOR_DISTRICTS — clickable demo districts (map hotspots).
// ---------------------------------------------------------------------

export interface SimulatorDistrict {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Representative population reached by local FM in this district. */
  citizens: number;
  /** Disaster types with templates — flood is always allowed. */
  disasterTypes: Array<"flood" | "cyclone" | "earthquake" | "heatwave">;
}

export const SIMULATOR_DISTRICTS: SimulatorDistrict[] = [
  { id: "patna", name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376, citizens: 4_200_000, disasterTypes: ["flood", "heatwave", "earthquake"] },
  { id: "muzaffarpur", name: "Muzaffarpur", state: "Bihar", lat: 26.1225, lng: 85.3908, citizens: 1_500_000, disasterTypes: ["flood", "earthquake"] },
  { id: "puri", name: "Puri", state: "Odisha", lat: 19.8135, lng: 85.8312, citizens: 1_200_000, disasterTypes: ["cyclone", "flood"] },
  { id: "malda", name: "Malda", state: "West Bengal", lat: 25.0114, lng: 88.1413, citizens: 1_800_000, disasterTypes: ["flood"] },
  { id: "delhi", name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209, citizens: 12_000_000, disasterTypes: ["heatwave", "earthquake"] },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, citizens: 12_500_000, disasterTypes: ["cyclone", "flood"] },
];

export function simulatorDistrictById(id: string): SimulatorDistrict | undefined {
  return SIMULATOR_DISTRICTS.find((d) => d.id === id);
}

// ---------------------------------------------------------------------
// 3. Station resolution + judges' snapshot
// ---------------------------------------------------------------------

/** Covering stations for a district (reuses the real geo lookup). */
export function simulatorStationsFor(
  districtId: string,
  radiusKm = 90,
): FmStationDTO[] {
  const district = simulatorDistrictById(districtId);
  if (!district) return [];
  return findStationsInRadius(district.lat, district.lng, MOCK_FM_STATIONS, radiusKm) as FmStationDTO[];
}

export interface JudgesSnapshot {
  district: SimulatorDistrict;
  stationCount: number;
  citizens: number;
  latencySeconds: number;
}

/** \"If this were live…\" numbers for the judges' panel. */
export function judgesSnapshot(districtId: string): JudgesSnapshot | null {
  const district = simulatorDistrictById(districtId);
  if (!district) return null;
  return {
    district,
    stationCount: simulatorStationsFor(districtId).length,
    citizens: district.citizens,
    latencySeconds: SIMULATED_BROADCAST_LATENCY_SECONDS,
  };
}

// ---------------------------------------------------------------------
// 4. Simulation pipeline — the animated stage sequence.
// ---------------------------------------------------------------------

export type SimulationStageType = "detect" | "voice" | "push" | "rds" | "confirmed";

export interface SimulationStage {
  type: SimulationStageType;
  label: string;
  /** Station name when the stage targets one (push / rds). */
  station?: string;
  /** How long the UI lingers on this stage (ms). */
  durationMs: number;
}

export interface PipelineInput {
  districtName: string;
  disasterType: string;
  stations: Array<{ name: string; rdsEnabled: boolean }>;
}

/** Build the deterministic animated pipeline for the simulator. */
export function buildSimulationPipeline(input: PipelineInput): SimulationStage[] {
  const disaster = (input.disasterType || "flood").toUpperCase();
  const stages: SimulationStage[] = [
    {
      type: "detect",
      label: `AI detected CRITICAL ${disaster} risk in ${input.districtName} district…`,
      durationMs: 1400,
    },
    {
      type: "voice",
      label: `Generating AI voice message (Hindi) via TTS provider chain…`,
      durationMs: 2000,
    },
  ];

  for (const station of input.stations) {
    stages.push({
      type: "push",
      label: `Pushing CAP feed + AI audio to ${station.name}…`,
      station: station.name,
      durationMs: 1200,
    });
    if (station.rdsEnabled) {
      stages.push({
        type: "rds",
        label: `RDS text live on ${station.name} — scrolling on car radios…`,
        station: station.name,
        durationMs: 900,
      });
    }
  }

  stages.push({
    type: "confirmed",
    label: `All ${input.stations.length} stations confirmed — broadcast complete`,
    durationMs: 800,
  });

  return stages;
}

// ---------------------------------------------------------------------
// 5. Safeguarded test broadcast (dry-run, no outbound calls).
// ---------------------------------------------------------------------

export interface TestBroadcastResult {
  stationId: string;
  stationName: string;
  frequency: string;
  strategy: "cap_api" | "rds" | "ivr";
  status: "delivered";
  responseCode: number;
  responseBody: string;
  test: true;
}

/**
 * Deterministic dry-run of the harmless test message across the TEST
 * stations. Never contacts anything — every result is a mock 200 so the
 * admin can rehearse the broadcast flow without touching real stations
 * or spending credits. (The dispatcher's testMode uses the same idea.)
 */
export function runTestBroadcast(): TestBroadcastResult[] {
  const results: TestBroadcastResult[] = [];
  for (const station of TEST_FM_STATIONS) {
    results.push({
      stationId: station.id,
      stationName: station.name,
      frequency: station.frequency,
      strategy: "cap_api",
      status: "delivered",
      responseCode: 200,
      responseBody: '{"accepted":true,"test":true}',
      test: true,
    });
    if (station.rdsEnabled && station.rdsApiEndpoint) {
      results.push({
        stationId: station.id,
        stationName: station.name,
        frequency: station.frequency,
        strategy: "rds",
        status: "delivered",
        responseCode: 200,
        responseBody: '{"confirmed":"live","test":true}',
        test: true,
      });
    }
  }
  return results;
}
