"use client";

import { useEffect, useState } from "react";
import { LocateFixed, MapPin, Navigation, Loader2 } from "lucide-react";
import { PATNA_CENTER } from "@/lib/field-offline";

const ACT_KEY = "drip_field_activity_v1";

type CheckIn = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  at: string;
  source: "gps" | "sim";
};

// Lightweight mock reverse-geocoder for the Patna demo district. In production
// this hits a real geocoding service; here it snaps to a nearby known zone.
const ZONES: { name: string; lat: number; lng: number; radiusKm: number }[] = [
  { name: "Kankarbagh Lowlands", lat: 25.5863, lng: 85.174, radiusKm: 2 },
  { name: "Patliputra Road Corridor", lat: 25.6125, lng: 85.145, radiusKm: 2 },
  { name: "Patna Flood Zone (Bypass)", lat: 25.5941, lng: 85.1376, radiusKm: 2 },
  { name: "Sampatchak Shelter Zone", lat: 25.5743, lng: 85.1376, radiusKm: 2 },
  { name: "Rajendra Nagar", lat: 25.6066, lng: 85.1208, radiusKm: 2 },
];

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function reverseGeocode(lat: number, lng: number): string {
  let nearest = ZONES[0];
  let nearestKm = Infinity;
  for (const z of ZONES) {
    const d = haversineKm({ lat, lng }, { lat: z.lat, lng: z.lng });
    if (d < nearestKm) {
      nearest = z;
      nearestKm = d;
    }
  }
  if (nearestKm <= nearest.radiusKm) return nearest.name;
  return `Field Sector ${Math.abs(lat).toFixed(4)}, ${Math.abs(lng).toFixed(4)}`;
}

function readActivity(): CheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACT_KEY);
    return raw ? (JSON.parse(raw) as CheckIn[]) : [];
  } catch {
    return [];
  }
}

function persistActivity(entry: CheckIn) {
  const log = [entry, ...readActivity()].slice(0, 10);
  try {
    window.localStorage.setItem(ACT_KEY, JSON.stringify(log));
  } catch {
    /* storage blocked */
  }
}

export default function GpsCheckIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<CheckIn[]>([]);
  const [last, setLast] = useState<CheckIn | null>(null);

  useEffect(() => {
    setActivity(readActivity());
  }, []);

  function recordCheckIn(
    lat: number,
    lng: number,
    source: CheckIn["source"],
  ) {
    const entry: CheckIn = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lat,
      lng,
      label: reverseGeocode(lat, lng),
      at: new Date().toISOString(),
      source,
    };
    persistActivity(entry);
    setActivity(readActivity());
    setLast(entry);
    setError(null);
  }

  function checkInAtCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location API unavailable. Use the simulate button for the demo.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        recordCheckIn(pos.coords.latitude, pos.coords.longitude, "gps");
        setBusy(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission blocked. Use “Simulate GPS” for the demo."
            : "Could not read your location.",
        );
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <section className="rounded-xl border-2 border-panel-border bg-panel-deep p-5">
      <header className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-cyan-300" />
        <h2 className="text-lg font-bold uppercase tracking-wider text-cyan-300">
          GPS Check-In
        </h2>
      </header>
      <p className="mt-1 text-base text-gray-400">
        Broadcast your live position so the control room can track your route.
      </p>

      {/* Primary check-in */}
      <button
        type="button"
        onClick={checkInAtCurrentLocation}
        disabled={busy}
        className="mt-4 flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-amber-400/70 bg-amber-400/15 text-xl font-bold text-amber-300 transition active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin" />
            Reading location…
          </>
        ) : (
          <>
            <LocateFixed className="h-7 w-7" />
            📍 Check-In at Current Location
          </>
        )}
      </button>

      {/* Demo fallback */}
      <button
        type="button"
        onClick={() => recordCheckIn(PATNA_CENTER.lat, PATNA_CENTER.lng, "sim")}
        disabled={busy}
        className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-panel-borderStrong bg-surface px-4 text-base font-semibold text-slate-300 transition active:scale-[0.98] disabled:opacity-60"
      >
        <Navigation className="h-5 w-5" />
        Simulate GPS (Patna Flood Zone)
      </button>

      {error && (
        <p className="mt-3 rounded-lg border-2 border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      {/* Last check-in */}
      {last && (
        <div className="mt-4 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">
            Checked in
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-200">{last.label}</p>
          <p className="text-sm tabular-nums text-emerald-300/80">
            {last.at.replace("T", " ").slice(0, 19)} · {last.lat.toFixed(5)},{" "}
            {last.lng.toFixed(5)}
          </p>
        </div>
      )}

      {/* Activity log */}
      {activity.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Recent Check-Ins
          </h3>
          <ul className="mt-2 space-y-2">
            {activity.map((c) => (
              <li
                key={c.id}
                className="flex min-h-[48px] items-center gap-3 rounded-xl border-2 border-panel-border bg-surface px-4 py-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    c.source === "gps"
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {c.source === "gps" ? "G" : "S"}
                </span>
                <span className="flex-1 leading-tight">
                  <span className="block text-base font-semibold text-gray-200">
                    {c.label}
                  </span>
                  <span className="block text-sm text-gray-400">
                    {new Date(c.at).toLocaleString()}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-slate-500">
                  {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}