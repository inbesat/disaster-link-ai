"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicLayerControl.tsx — client wrapper
// that owns the map-layer checkbox state so the read-only LayerToggle
// can be reused inside the public transparency panel (no API calls).
// ---------------------------------------------------------------------

import { useState } from "react";
import LayerToggle, {
  DEFAULT_LAYER_VISIBILITY,
  type LayerVisibility,
} from "@/components/map/LayerToggle";

export default function PublicLayerControl() {
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  return <LayerToggle layers={layers} onChange={setLayers} />;
}
