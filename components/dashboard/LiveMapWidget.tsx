"use client";

// ---------------------------------------------------------------------
// components/dashboard/LiveMapWidget.tsx — UI/UX Phase 4 · Step 4.
//
// Hero dashboard map card: a live (static) situation map centred on Patna
// with a translucent red flood-zone overlay. Spans 2×2 grid cells on xl
// (xl:col-span-8 xl:row-span-2), full-width on smaller screens. The canvas
// itself is fetched client-only (maplibre touches `window`) behind a slim
// skeleton so SSR stays clean.
// ---------------------------------------------------------------------

import dynamic from "next/dynamic";
import { Maximize2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import IconButton from "@/components/ui/IconButton";

const LiveMapCanvas = dynamic(() => import("@/components/dashboard/LiveMapCanvas"), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded-lg bg-tertiary" aria-hidden />,
});

export function LiveMapWidget() {
  return (
    <Panel
      className=""
      bodyClassName="relative h-[40vh] p-0 sm:h-[50vh] lg:h-[600px] xl:h-[440px]"
      title={
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate">Live Situation Map</span>
            <span
              className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-success"
              aria-hidden
            />
          </span>
          <span className="block text-[11px] font-normal normal-case tracking-normal text-muted">
            Last updated: Just now
          </span>
        </span>
      }
      action={
        <IconButton label="Expand to full map" size="sm" variant="ghost">
          <Maximize2 className="h-4 w-4" aria-hidden />
        </IconButton>
      }
    >
      <LiveMapCanvas />
    </Panel>
  );
}

export default LiveMapWidget;
