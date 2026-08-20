"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/SatelliteGisCard.tsx — Integrations (Phase 8 · Step 4).
//
// Satellite Imagery & GIS Providers:
//   • Configuration sections for ISRO Bhuvan, Google Earth Engine and
//     Sentinel Hub — masked credential fields with show/hide toggles.
//   • "Validate Credentials" per provider: simulated fetch (~1s), then a
//     green list of mock available datasets (e.g. "Sentinel-2 Cloudless",
//     "Bhuvan Elevation Map"). The validated badge is clickable to re-run.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileJson,
  Globe2,
  IdCard,
  KeyRound,
  Loader2,
  Map,
  Orbit,
  Satellite,
  ShieldCheck,
} from "lucide-react";

type ProviderId = "bhuvan" | "gee" | "sentinel";

type CredentialField = {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  /** "secret" renders a masked password input, "json" the key payload,
   *  "id" a plain (non-secret) identifier like a client ID or email. */
  kind: "secret" | "json" | "id";
};

type Provider = {
  id: ProviderId;
  name: string;
  hint: string;
  icon: typeof Satellite;
  accent: string;
  fields: CredentialField[];
  datasets: string[];
};

const PROVIDERS: Provider[] = [
  {
    id: "bhuvan",
    name: "ISRO Bhuvan",
    hint: "Indian Earth observation + WMS basemaps",
    icon: Orbit,
    accent: "text-violet-300",
    fields: [
      {
        id: "apiKey",
        label: "Bhuvan API Key",
        hint: "Free registration at bhuvan.nrsc.gov.in",
        placeholder: "bhuvan_••••••••",
        kind: "secret",
      },
    ],
    datasets: [
      "Bhuvan Elevation Map",
      "Bhuvan WMS Basemap (1:500k)",
      "Landslide Hazard Zonation",
    ],
  },
  {
    id: "gee",
    name: "Google Earth Engine",
    hint: "Planetary-scale raster + flood analytics",
    icon: Globe2,
    accent: "text-sky-300",
    fields: [
      {
        id: "serviceAccount",
        label: "Service Account",
        hint: "name@project.iam.gserviceaccount.com",
        placeholder: "drip-flood@…iam.gserviceaccount.com",
        kind: "id",
      },
      {
        id: "privateKey",
        label: "Private Key (JSON)",
        hint: "Paste the service-account key payload",
        placeholder: "{\"type\": \"service_account\", …}",
        kind: "json",
      },
    ],
    datasets: [
      "Sentinel-2 MSI Surface Reflectance",
      "Landsat-9 Collection 2",
      "NASADEM Global Elevation",
      "USGS HydroSHEDS Flow Accumulation",
    ],
  },
  {
    id: "sentinel",
    name: "Sentinel Hub",
    hint: "Copernicus EO — SAR + optical time series",
    icon: Satellite,
    accent: "text-emerald-300",
    fields: [
      {
        id: "clientId",
        label: "OAuth Client ID",
        hint: "From the Sentinel Hub dashboard",
        placeholder: "your-client-id",
        kind: "id",
      },
      {
        id: "clientSecret",
        label: "Client Secret",
        hint: "Used only server-side",
        placeholder: "••••••••••••••",
        kind: "secret",
      },
    ],
    datasets: [
      "Sentinel-2 Cloudless",
      "Sentinel-1 SAR Flood Extent",
      "MODIS NDVI 16-day",
    ],
  },
];

const PROVIDER_LOOKUP = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, Provider>;

type ValidateStatus = "idle" | "validating" | "validated";

export default function SatelliteGisCard() {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<ProviderId, ValidateStatus>>({
    bhuvan: "idle",
    gee: "idle",
    sentinel: "idle",
  });

  function setCredential(fieldId: string, value: string) {
    setCredentials((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleVisible(fieldId: string) {
    setVisible((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  }

  function validateCredentials(id: ProviderId) {
    if (status[id] === "validating") return;
    setStatus((prev) => ({ ...prev, [id]: "validating" }));
    // Simulated catalog fetch from the provider.
    window.setTimeout(() => {
      setStatus((prev) => ({ ...prev, [id]: "validated" }));
      toast.success(
        `${PROVIDER_LOOKUP[id].name} — ${PROVIDER_LOOKUP[id].datasets.length} datasets available.`,
        { duration: 3000 },
      );
    }, 1000);
  }

  return (
    <section
      data-settings-key="integrations-satellite-gis"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Satellite className="h-5 w-5 text-violet-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-violet-300/80">GEOSPATIAL · SATELLITE FEEDS</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Satellite Imagery &amp; GIS Providers
          </h2>
        </div>
        <span className="ml-auto rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-violet-200">
          {PROVIDERS.length} providers
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Feed high-resolution imagery and elevation data into the flood
        mapping layer. Validating credentials surfaces the datasets each
        provider makes available to the command center.
      </p>

      {/* Provider sections */}
      <div className="mt-5 space-y-3">
        {PROVIDERS.map((provider) => {
          const ProviderIcon = provider.icon;
          const state = status[provider.id];
          return (
            <div
              key={provider.id}
              className="rounded-md border border-panel-border bg-surface-muted/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                  <ProviderIcon
                    className={`h-4 w-4 ${provider.accent}`}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-100">
                    {provider.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {provider.hint}
                  </p>
                </div>

                {/* Validate Credentials */}
                <div className="flex shrink-0 items-center gap-2.5">
                  {state === "validated" ? (
                    <button
                      type="button"
                      onClick={() => validateCredentials(provider.id)}
                      title="Re-validate credentials"
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Validated
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => validateCredentials(provider.id)}
                      disabled={state === "validating"}
                      className="inline-flex items-center gap-1.5 rounded-md border border-panel-borderHover px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      {state === "validating" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          Validating…
                        </>
                      ) : (
                        "Validate Credentials"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Credential fields */}
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {provider.fields.map((field) => {
                  const fieldId = `${provider.id}-${field.id}`;
                  const isVisible = visible[fieldId];
                  return (
                    <div key={fieldId} className="relative">
                      <label
                        htmlFor={fieldId}
                        className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        {field.label}
                      </label>
                      <p className="mb-1.5 text-[10px] text-slate-500">
                        {field.hint}
                      </p>
                      <div className="relative">
                        {field.kind === "secret" && (
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                            aria-hidden
                          />
                        )}
                        {field.kind === "json" && (
                          <FileJson
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                            aria-hidden
                          />
                        )}
                        {field.kind === "id" && (
                          <IdCard
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                            aria-hidden
                          />
                        )}
                        <input
                          id={fieldId}
                          type={
                            isVisible || field.kind === "id" ? "text" : "password"
                          }
                          value={credentials[fieldId] ?? ""}
                          onChange={(e) =>
                            setCredential(fieldId, e.target.value)
                          }
                          placeholder={field.placeholder}
                          aria-label={`${provider.name} ${field.label}`}
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-md border border-panel-border bg-[#0a0f1d] py-2 pl-9 pr-9 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-400/60"
                        />
                        {field.kind !== "id" && (
                          <button
                            type="button"
                            onClick={() => toggleVisible(fieldId)}
                            aria-label={
                              isVisible
                                ? `Hide ${provider.name} ${field.label}`
                                : `Show ${provider.name} ${field.label}`
                            }
                            aria-pressed={isVisible}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-300"
                          >
                            {isVisible ? (
                              <EyeOff className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Available datasets — shown once validated */}
              {state === "validated" && (
                <div
                  role="status"
                  className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-500/[0.07] p-3"
                >
                  <p className="eoc-label flex items-center gap-1.5 text-emerald-300/80">
                    <Map className="h-3 w-3" aria-hidden />
                    AVAILABLE DATASETS
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {provider.datasets.map((dataset) => (
                      <li
                        key={dataset}
                        className="flex items-center gap-2 text-xs text-emerald-100/90"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                          aria-hidden
                        />
                        {dataset}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — dataset catalogs are simulated; keys are never
        persisted.
      </p>
    </section>
  );
}
