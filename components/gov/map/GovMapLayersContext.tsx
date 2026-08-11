"use client";

// ---------------------------------------------------------------------
// components/gov/map/GovMapLayersContext.tsx — Phase 8 · Step 2.
//
// Shared store for the seven Gov Map layers. The AdvancedLayerControl
// writes here (toggle + opacity slider per layer) and the GovMapCanvas
// reads here to decide which GeoJSON sources to mount and at what
// opacity — the "global state" the task asks for, scoped to the Gov Map
// workspace (no localStorage persistence: layer tweaks are per-session).
// ---------------------------------------------------------------------

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_GOV_LAYER_STATES,
  type GovLayerState,
  type GovMapLayerKey,
} from "@/lib/map/gov-map-layers";

export type GovMapLayersContextValue = {
  /** Per-layer visibility + opacity (0–100). */
  layers: Record<GovMapLayerKey, GovLayerState>;
  /** Update a single layer's state (e.g. `setLayer("shelters", { opacity: 40 })`). */
  setLayer: (key: GovMapLayerKey, patch: Partial<GovLayerState>) => void;
  /** Flip a layer's visibility on/off. */
  toggleLayer: (key: GovMapLayerKey) => void;
  /** Restore the shipped defaults. */
  reset: () => void;
};

const GovMapLayersContext = createContext<GovMapLayersContextValue | null>(null);

export function GovMapLayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<Record<GovMapLayerKey, GovLayerState>>(
    DEFAULT_GOV_LAYER_STATES,
  );

  const setLayer = useCallback((key: GovMapLayerKey, patch: Partial<GovLayerState>) => {
    setLayers((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }, []);

  const toggleLayer = useCallback((key: GovMapLayerKey) => {
    setLayers((prev) => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible },
    }));
  }, []);

  const reset = useCallback(() => {
    setLayers(DEFAULT_GOV_LAYER_STATES);
  }, []);

  const value = useMemo(
    () => ({ layers, setLayer, toggleLayer, reset }),
    [layers, setLayer, toggleLayer, reset],
  );

  return createElement(GovMapLayersContext.Provider, { value }, children);
}

/** Read/write the gov map layer state — must be inside GovMapLayersProvider. */
export function useGovMapLayers(): GovMapLayersContextValue {
  const ctx = useContext(GovMapLayersContext);
  if (!ctx) {
    throw new Error("useGovMapLayers must be used inside <GovMapLayersProvider>");
  }
  return ctx;
}
