"use client";

// ---------------------------------------------------------------------
// components/dashboard/DashboardLayout.tsx
// UI/UX Phase 4 · Step 1 — Command Center dashboard shell.
//
// Places the sticky DashboardHeader at the top and wraps the page content
// in a centered, max-width scroll container. Owns the selected district:
// children read it via useDashboardDistrict() so later steps (KPI row, map
// widget, alert feed) all react to a live district switch.
//
// The district value can be controlled from the parent: pass `district` and
// `onDistrictChange` and the layout becomes fully controlled; otherwise it
// manages its own internal selection (defaults to "Patna").
// ---------------------------------------------------------------------

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import DashboardHeader from "./DashboardHeader";
import QuickActionsDock from "./QuickActionsDock";

type DashboardDistrictContextValue = {
  /** Currently selected district, e.g. "Patna". */
  district: string;
  /** Switch the live district (drives the header + all widgets). */
  setDistrict: (district: string) => void;
};

const DashboardDistrictContext = createContext<DashboardDistrictContextValue | null>(
  null,
);

/** Read the live district selection — only valid inside <DashboardLayout>. */
export function useDashboardDistrict(): DashboardDistrictContextValue {
  const ctx = useContext(DashboardDistrictContext);
  if (!ctx) {
    throw new Error("useDashboardDistrict must be used within <DashboardLayout>");
  }
  return ctx;
}

type DashboardLayoutProps = {
  /** The dashboard page content (widgets, grids, …). */
  children: ReactNode;
  /** Controlled district — omit to let the layout own the selection. */
  district?: string;
  /** Optional callback fired on every district change. */
  onDistrictChange?: (district: string) => void;
  /** Global flood status level for the header badge. */
  floodSeverity?: string;
  /** Role chip under the header avatar. */
  roleLabel?: string;
  /** User display name shown next to the header avatar. */
  displayName?: string;
  /** Server-provided avatar URL. */
  avatarUrl?: string | null;
};

export function DashboardLayout({
  children,
  district: districtProp,
  onDistrictChange,
  floodSeverity,
  roleLabel,
  displayName,
  avatarUrl,
}: DashboardLayoutProps) {
  const [internalDistrict, setInternalDistrict] = useState<string>("Patna");
  const district = districtProp ?? internalDistrict;

  const setDistrict = useCallback(
    (next: string) => {
      onDistrictChange?.(next);
      if (districtProp === undefined) setInternalDistrict(next);
    },
    [districtProp, onDistrictChange],
  );

  return (
    <DashboardDistrictContext.Provider value={{ district, setDistrict }}>
      <div className="flex min-h-screen flex-col bg-primary text-foreground">
        <DashboardHeader
          currentDistrict={district}
          onDistrictChange={setDistrict}
          floodSeverity={floodSeverity}
          roleLabel={roleLabel}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 pb-16">
          <div className="mx-auto w-full max-w-[1720px] px-4 pt-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>

      <QuickActionsDock />
    </DashboardDistrictContext.Provider>
  );
}

export default DashboardLayout;
