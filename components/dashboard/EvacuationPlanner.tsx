"use client";

import { useEffect, useState } from "react";
import type { Feature, LineString, Polygon } from "geojson";
import { getEvacuationRoute } from "@/lib/map/routing";
import { validateRouteSafety } from "@/lib/map/routing";
import { calculateFleetRequirements } from "@/lib/map/fleet-allocation";
import { getShelters } from "@/app/actions/shelters";
import { saveEvacuationPlan } from "@/lib/map/evacuation-plans-client";

export type EvacRouteResult = {
  geometry: Feature<LineString>;
  isSafe: boolean;
  distanceKm: number;
  durationMin: number;
  villageName: string;
  shelterName: string;
  evacuees: number;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
};

const VILLAGES = [
  { id: "v-patna", name: "Ganga Floodplain Village", lat: 25.5941, lng: 85.1376 },
  { id: "v-bhagalpur", name: "phaganpur Village", lat: 25.63, lng: 85.16 },
  { id: "v-sonepur", name: "Sonepur Riverside", lat: 25.72, lng: 85.19 },
];

const MOCK_SHELTERS = [
  { id: "mock-shelter-1", name: "Central Community Hall", lat: 25.6, lng: 85.14 },
  { id: "mock-shelter-2", name: "Riverside High School", lat: 25.585, lng: 85.13 },
  { id: "mock-shelter-3", name: "District Hospital Annex", lat: 25.608, lng: 85.12 },
];

// DEMO flood polygon (~critical) covering the river front so the validator can
// actually flag compromised routes. Replaces live hazard zones for now.
const MOCK_FLOOD_POLYGON: Feature<Polygon> = {
  type: "Feature",
  properties: { riskLevel: "critical" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [85.1, 25.57],
        [85.18, 25.57],
        [85.18, 25.63],
        [85.1, 25.63],
        [85.1, 25.57],
      ],
    ],
  },
};

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | {
      state: "done";
      distanceKm: number;
      durationMin: number;
      isSafe: boolean;
      busesNeeded: number;
      boatsNeeded: number;
      totalHours: number;
    }
  | { state: "error"; message: string };

export default function EvacuationPlanner({
  onEvacRoute,
}: {
  onEvacRoute?: (result: EvacRouteResult) => void;
}) {
  const [villageId, setVillageId] = useState(VILLAGES[0].id);
  const [evacuees, setEvacuees] = useState(150);
  const [shelterId, setShelterId] = useState(MOCK_SHELTERS[0].id);
  const [shelters, setShelters] = useState(MOCK_SHELTERS);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  useEffect(() => {
    getShelters()
      .then((rows) => {
        if (rows.length) {
          setShelters(
            rows.map((s) => ({
              id: s.id,
              name: s.name,
              lat: s.lat,
              lng: s.lng,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  async function calculate() {
    const village = VILLAGES.find((v) => v.id === villageId) ?? VILLAGES[0];
    const shelter = shelters.find((s) => s.id === shelterId) ?? shelters[0];
    if (!shelter) return;

    setStatus({ state: "loading" });
    try {
      const route = await getEvacuationRoute(
        village.lng,
        village.lat,
        shelter.lng,
        shelter.lat,
      );
      const safety = validateRouteSafety(route.geometry, [MOCK_FLOOD_POLYGON], []);
      const distanceKm = route.distanceMeters / 1000;
      const fleet = calculateFleetRequirements(evacuees || 0, route.durationSeconds);

      setStatus({
        state: "done",
        distanceKm,
        durationMin: Math.round(route.durationSeconds / 60),
        isSafe: safety.isSafe,
        busesNeeded: fleet.busesNeeded,
        boatsNeeded: fleet.boatsNeeded,
        totalHours: fleet.estimatedTotalTimeH,
      });

      onEvacRoute?.({
        geometry: route.geometry,
        isSafe: safety.isSafe,
        distanceKm,
        durationMin: Math.round(route.durationSeconds / 60),
        villageName: village.name,
        shelterName: shelter.name,
        evacuees: evacuees || 0,
        start: { lat: village.lat, lng: village.lng },
        end: { lat: shelter.lat, lng: shelter.lng },
      });

      // Persist the approved plan so it survives refresh and shows up in the
      // /evacuations tracker. Non-fatal: failures are swallowed silently.
      await saveEvacuationPlan({
        villageName: village.name,
        assignedShelterId: shelter.id,
        estimatedEvacuees: evacuees || 0,
        routeGeoJson:
          typeof route.geometry === "object" ? JSON.stringify(route.geometry) : undefined,
      });
    } catch (error: unknown) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Route calculation failed.",
      });
    }
  }

  function dispatchToDriver() {
    const village = VILLAGES.find((v) => v.id === villageId) ?? VILLAGES[0];
    const shelter = shelters.find((s) => s.id === shelterId) ?? shelters[0];
    if (!shelter) return;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${village.lat},${village.lng}&destination=${shelter.lat},${shelter.lng}`;
    const message = `EMERGENCY DISPATCH: Proceed to ${village.name} to evacuate ${
      evacuees || 0
    } people. Route: ${mapsUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="rounded-eoc border border-border bg-surface p-5">
      <p className="eoc-label text-accent">MASS EVACUATION PLANNER</p>
      <h2 className="mt-1 text-sm font-bold">Orchestrate an Evacuation</h2>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void calculate();
        }}
      >
        <label className="block">
          <span className="eoc-label">Affected Village</span>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {VILLAGES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eoc-label">Number of Evacuees</span>
          <input
            type="number"
            min={1}
            value={evacuees}
            onChange={(e) => setEvacuees(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eoc-label">Assign to Shelter</span>
          <select
            value={shelterId}
            onChange={(e) => setShelterId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={status.state === "loading"}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.state === "loading" ? "Calculating…" : "Calculate Safe Route"}
        </button>
      </form>

      {status.state === "done" && (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border bg-surface-muted p-2.5 text-center">
              <p className="eoc-label">DISTANCE</p>
              <p className="text-lg font-bold tabular-nums">
                {status.distanceKm.toFixed(1)} km
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface-muted p-2.5 text-center">
              <p className="eoc-label">DURATION</p>
              <p className="text-lg font-bold tabular-nums">{status.durationMin} min</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="eoc-label">FLEET REQUIRED</p>
            <div className="mt-1.5 flex items-center justify-around text-center">
              <div>
                <p className="text-lg font-bold tabular-nums">{status.busesNeeded}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Buses
                </p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{status.boatsNeeded}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  NDRF Boats
                </p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{status.totalHours}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Est. Time (h)
                </p>
              </div>
            </div>
          </div>

          {!status.isSafe && (
            <div className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2.5 text-xs font-semibold text-severity-red-400">
              ⚠️ ROUTE COMPROMISED BY FLOOD WATER. PROCEED WITH CAUTION.
            </div>
          )}

          <button
            type="button"
            onClick={dispatchToDriver}
            className="w-full rounded-md bg-severity-green-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:bg-severity-green-500"
          >
            Dispatch to Driver (WhatsApp)
          </button>
        </div>
      )}

      {status.state === "error" && (
        <div className="mt-4 rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-xs text-severity-red-400">
          {status.message}
        </div>
      )}
    </div>
  );
}
