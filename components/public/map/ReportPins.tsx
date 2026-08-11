"use client";

// ---------------------------------------------------------------------
// components/public/map/ReportPins.tsx — Phase 4 · Step 9 · temporary
// report pins.
//
// Renders the pins dropped when the citizen files a quick report through
// the ReportIncidentFAB. Each pin is a colored circle (using the shared
// GroundReport type colors) with a per-type icon and a tiny label chip.
// PublicMap owns the pin list and expires each pin after a few seconds —
// "temporary" by design.
// ---------------------------------------------------------------------

import { motion } from "framer-motion";
import { Marker } from "react-map-gl/maplibre";
import { Construction, Waves, Users } from "lucide-react";
import {
  GROUND_REPORT_TYPES,
  groundReportColor,
} from "@/lib/crowdsourced/report";
import type { CitizenReportType } from "./ReportIncidentFAB";

const REPORT_ICONS: Record<CitizenReportType, typeof Waves> = {
  flooding: Waves,
  road_blocked: Construction,
  rescue: Users,
};

/** Short chip label — mirrors the shared GroundReport vocabulary. */
function reportLabel(type: CitizenReportType): string {
  return GROUND_REPORT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type ReportPin = {
  id: string;
  type: CitizenReportType;
  lat: number;
  lng: number;
};

export default function ReportPins({ pins }: { pins: ReportPin[] }) {
  return (
    <>
      {pins.map((pin) => {
        const Icon = REPORT_ICONS[pin.type];
        const color = groundReportColor(pin.type);
        return (
          <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="flex flex-col items-center gap-0.5"
            >
              {/* Pin head */}
              <span
                role="img"
                aria-label={`Your ${reportLabel(pin.type)} report`}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: color }}
              >
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
              </span>
              {/* Tiny label chip */}
              <span className="rounded-full bg-[#0a1120]/85 px-2 py-0.5 text-[0.625rem] font-bold text-white backdrop-blur-sm">
                {reportLabel(pin.type)}
              </span>
            </motion.div>
          </Marker>
        );
      })}
    </>
  );
}
