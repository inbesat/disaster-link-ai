"use client";

// ---------------------------------------------------------------------
// lib/org-settings-mock.ts — Organization & District (Phase 5 · Step 10).
//
// Centralized React hook for ALL Admin UI state built across Steps 1–9:
// districts, per-district calibration thresholds, and global operational
// parameters.
//
//   • useOrgSettings() reads from a hydration-safe React context.
//   • Every change persists immediately to localStorage
//     ("drip_org_settings_v1") — no page refresh needed.
//   • Defaults are always populated so the UI is never blank on first load.
//
// Mount <OrgSettingsProvider> around the Admin settings page so cards can
// react instantly to district toggles, threshold sliders and parameter
// toggles, each firing a stable success toast.
// ---------------------------------------------------------------------

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  DRIP_ORG_SETTINGS_KEY,
  mergeOrgSettings,
  readStoredOrgSettings,
  writeStoredOrgSettings,
  cloneDefaultOrgSettings,
  type DistrictThresholds,
  type OrgDistrict,
  type OrgOperationalParams,
  type OrgSettings,
} from "@/lib/settings/org-settings";

const SAVED_TOAST_ID = "drip-org-settings-saved";

export type OrgSettingsContextValue = {
  settings: OrgSettings;
  update: (patch: Partial<OrgSettings>) => void;
  addDistrict: (district: Omit<OrgDistrict, "id">) => void;
  setDistrictActive: (id: string, active: boolean) => void;
  setDistrictBoundary: (id: string, boundary: OrgDistrict["boundary"]) => void;
  updateThresholds: (districtId: string, patch: Partial<DistrictThresholds>) => void;
  setParams: (patch: Partial<OrgOperationalParams>) => void;
  reset: () => void;
};

const OrgSettingsContext = createContext<OrgSettingsContextValue | null>(null);

export function OrgSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OrgSettings>(cloneDefaultOrgSettings);

  // Hydrate persisted values once after mount — no hydration mismatch.
  useEffect(() => {
    setSettings((prev) => readStoredOrgSettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredOrgSettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_ORG_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergeOrgSettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Every mutation fires a stable success toast → instant tactile response
  // wherever a toggle, slider or dropdown is changed.
  const toastSaved = useCallback((message = "Organization settings updated") => {
    toast.success(message, { id: SAVED_TOAST_ID });
  }, []);

  const update = useCallback(
    (patch: Partial<OrgSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const addDistrict = useCallback(
    (d: Omit<OrgDistrict, "id">) => {
      const district: OrgDistrict = { ...d, id: `d${Date.now()}` };
      setSettings((prev) => ({
        ...prev,
        districts: [...prev.districts, district],
        thresholds: {
          ...prev.thresholds,
          [district.id]: {
            warningRain: 100,
            criticalRain: 200,
            warningRiver: 2.5,
            criticalRiver: 3.8,
          },
        },
      }));
    },
    [],
  );

  const setDistrictActive = useCallback((id: string, active: boolean) => {
    setSettings((prev) => ({
      ...prev,
      districts: prev.districts.map((d) => (d.id === id ? { ...d, active } : d)),
    }));
  }, []);

  const setDistrictBoundary = useCallback(
    (id: string, boundary: OrgDistrict["boundary"]) => {
      setSettings((prev) => ({
        ...prev,
        districts: prev.districts.map((d) =>
          d.id === id ? { ...d, boundary, geojsonActive: boundary !== null } : d,
        ),
      }));
    },
    [],
  );

  const updateThresholds = useCallback(
    (districtId: string, patch: Partial<DistrictThresholds>) => {
      setSettings((prev) => ({
        ...prev,
        thresholds: {
          ...prev.thresholds,
          [districtId]: {
            ...(prev.thresholds[districtId] ?? {
              warningRain: 100,
              criticalRain: 200,
              warningRiver: 2.5,
              criticalRiver: 3.8,
            }),
            ...patch,
          },
        },
      }));
    },
    [],
  );

  const setParams = useCallback((patch: Partial<OrgOperationalParams>) => {
    setSettings((prev) => ({ ...prev, params: { ...prev.params, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setSettings(cloneDefaultOrgSettings());
    toastSaved("Organization settings reset to defaults.");
  }, [toastSaved]);

  /** Wrap every mutator with the success toast so the UI feels instant. */
  const value = useMemo<OrgSettingsContextValue>(
    () => ({
      settings,
      update: (patch) => {
        update(patch);
        toastSaved();
      },
      addDistrict: (d) => {
        addDistrict(d);
        toastSaved("District added — thresholds initialised.");
      },
      setDistrictActive: (id, active) => {
        setDistrictActive(id, active);
        toastSaved(active ? "District set to Active." : "District set to Standby.");
      },
      setDistrictBoundary: (id, b) => {
        setDistrictBoundary(id, b);
        toastSaved(b ? "Boundary GeoJSON uploaded." : "Boundary removed.");
      },
      updateThresholds: (id, patch) => {
        updateThresholds(id, patch);
        toastSaved("Calibration updated.");
      },
      setParams: (patch) => {
        setParams(patch);
        toastSaved("Operational parameter updated.");
      },
      reset,
    }),
    [settings, update, addDistrict, setDistrictActive, setDistrictBoundary, updateThresholds, setParams, reset, toastSaved],
  );

  return createElement(
    OrgSettingsContext.Provider,
    { value },
    children,
  );
}

/** Read/write organization admin settings from any card inside the provider. */
export function useOrgSettings(): OrgSettingsContextValue {
  const ctx = useContext(OrgSettingsContext);
  if (!ctx) {
    throw new Error("useOrgSettings must be used inside <OrgSettingsProvider>");
  }
  return ctx;
}