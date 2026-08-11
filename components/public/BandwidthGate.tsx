"use client";

// ---------------------------------------------------------------------
// components/public/BandwidthGate.tsx — Phase 13 · Step 2.
//
// Renders nothing while extreme low-bandwidth mode is ON, so server pages
// can wrap heavy islands (the AI assistant, teasers, image-heavy modules)
// without becoming client components themselves.
//
//   <BandwidthGate><AITeaser /></BandwidthGate>
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import { useBandwidth } from "@/lib/contexts/BandwidthContext";

export function BandwidthGate({ children }: { children: ReactNode }) {
  const { isLowBandwidthMode } = useBandwidth();
  if (isLowBandwidthMode) return null;
  return <>{children}</>;
}

export default BandwidthGate;
