import type { Metadata } from "next";
import GlobalWorldMap from "@/components/dashboard/GlobalWorldMap";

// ---------------------------------------------------------------------
// app/(dashboard)/global-map/page.tsx — Global Command Center Map
//
// Standalone route for the worldwide overview / global flood response
// map section. Lives inside the (dashboard) route group so it inherits
// the DashboardShell sidebar.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Global Map | SafeSphere",
};

export default function GlobalMapPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-[1720px]">
        <GlobalWorldMap />
      </div>
    </main>
  );
}
