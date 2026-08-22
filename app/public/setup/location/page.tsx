"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, LocateFixed, MapPin } from "lucide-react";

// ---------------------------------------------------------------------
// app/public/setup/location/page.tsx — Phase 1 · Step 6 · Location
// Permission Flow. Citizens grant GPS (HTML5 Geolocation API) or pick a
// district/village manually. Either way the choice is persisted to
// localStorage (`citizen_location`) and the flow advances to the next
// setup step.
// ---------------------------------------------------------------------

const NEXT_STEP_URL = "/public/setup/family"; // next setup step (Phase 1 · Step 7)

const DISTRICTS: Record<string, string[]> = {
  Patna: ["Kankarbagh", "Danapur", "Phulwari Sharif", "Fatuha", "Barh"],
  Gaya: ["Bodh Gaya", "Manpur", "Tekari", "Sherghati"],
  Bhagalpur: ["Nathnagar", "Kahalgaon", "Naugachia", "Sultanganj"],
  Muzaffarpur: ["Motipur", "Kanti", "Saraiya", "Aurai"],
  Darbhanga: ["Biraul", "Benipur", "Hayaghat", "Singhwara"],
  Purnia: ["Banmankhi", "Kasba", "Dhamdaha", "Amour"],
};

const STORAGE_KEY = "citizen_location";

type SavedLocation =
  | { type: "gps"; lat: number; lng: number; savedAt: string }
  | { type: "manual"; district: string; village: string; savedAt: string };

export default function LocationSetupPage() {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const villages = useMemo(() => (district ? DISTRICTS[district] : []), [district]);

  function finish(location: SavedLocation) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    router.push(NEXT_STEP_URL);
  }

  function enableGps() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("GPS is not available in this browser — enter your location manually below.");
      setManualOpen(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        finish({
          type: "gps",
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
          savedAt: new Date().toISOString(),
        });
      },
      (err) => {
        setLocating(false);
        // 1 = permission denied, 2 = position unavailable, 3 = timeout.
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied — you can enter it manually below."
            : "Couldn't get your location — enter it manually below.";
        setError(message);
        setManualOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  function saveManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!district || !village) {
      setError("Pick your district and village to continue.");
      return;
    }
    finish({ type: "manual", district, village, savedAt: new Date().toISOString() });
  }

  const selectClass =
    "w-full appearance-none rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white transition focus:border-[var(--dl-orange)] focus:outline-none";

  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(249,115,22,0.16),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(37,99,235,0.18),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        {/* Progress bar — Location (2 of 4) */}
        <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1 flex-1 rounded-full bg-[var(--dl-orange)]" />
          <span className="h-1 flex-1 rounded-full bg-white/15" />
          <span className="h-1 flex-1 rounded-full bg-white/15" />
          <span className="h-1 flex-1 rounded-full bg-white/15" />
        </div>

        <Link
          href="/public/onboarding"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </Link>

        {/* Illustration — radar with pulsing pin */}
        <div className="relative mx-auto mt-4 h-52 w-52" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-6 rounded-full border border-white/10" />
          <div className="absolute inset-12 rounded-full border border-white/10" />
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-[var(--dl-orange)]/5" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--dl-orange)]/20 text-3xl ring-1 ring-[var(--dl-orange)]/40">
              📍
            </span>
          </div>
        </div>

        <h1 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
          Where should we alert you?
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
          We need your location to send you life-saving alerts and show nearby
          shelters.
        </p>

        {/* Massive GPS button */}
        <button
          type="button"
          onClick={enableGps}
          disabled={locating}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-[var(--dl-radius)] bg-[var(--dl-orange)] px-6 py-5 text-lg font-bold text-white shadow-[var(--dl-shadow-soft)] transition hover:bg-[#EA5B0C] disabled:opacity-70"
        >
          <LocateFixed aria-hidden="true" className={locating ? "h-6 w-6 animate-spin" : "h-6 w-6"} />
          {locating ? "Finding you…" : "Enable GPS Location"}
        </button>
        <p className="mt-2 text-center font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--dl-text-muted)]">
          Precise · private · never shared
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2.5 text-sm text-[var(--dl-orange-light)]"
          >
            {error}
          </p>
        )}

        {/* Manual fallback */}
        {!manualOpen ? (
          <button
            type="button"
            onClick={() => {
              setManualOpen(true);
              setError(null);
            }}
            aria-expanded={manualOpen}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 px-4 py-3.5 text-base font-semibold text-[var(--dl-text-on-navy)] transition hover:border-[var(--dl-orange)]/50 hover:text-white"
          >
            <MapPin aria-hidden="true" className="h-5 w-5" />
            Enter Location Manually
          </button>
        ) : (
          <form onSubmit={saveManual} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="setup-district"
                className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]"
              >
                District
              </label>
              <div className="relative">
                <select
                  id="setup-district"
                  aria-label="District"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setVillage("");
                }}
                className={`${selectClass} pr-10`}
              >
                <option value="" className="bg-[var(--dl-navy-2)]">
                  Select District
                </option>
                {Object.keys(DISTRICTS).map((d) => (
                  <option key={d} value={d} className="bg-[var(--dl-navy-2)]">
                    {d}
                  </option>
                ))}
              </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="setup-village"
                className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]"
              >
                Village
              </label>
              <div className="relative">
                <select
                  id="setup-village"
                  aria-label="Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                disabled={!district}
                className={`${selectClass} pr-10 disabled:opacity-40`}
              >
                <option value="" className="bg-[var(--dl-navy-2)]">
                  {district ? "Select Village" : "Choose a district first"}
                </option>
                {villages.map((v) => (
                  <option key={v} value={v} className="bg-[var(--dl-navy-2)]">
                    {v}
                  </option>
                ))}
              </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius)] bg-[var(--dl-blue)] px-6 py-4 text-base font-bold text-white transition hover:bg-[var(--dl-blue-light)]"
            >
              Save Location
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-[var(--dl-text-muted)]">
          Emergency? Call the District Control Room{" "}
          <a href="tel:1070" className="font-semibold text-[var(--dl-orange-light)] hover:underline">
            1070
          </a>
        </p>
      </div>
    </main>
  );
}
