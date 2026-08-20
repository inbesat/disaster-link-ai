"use client";

// ---------------------------------------------------------------------
// components/gov/map/ExportMapButton.tsx — Phase 8 · Step 8 ·
// Map Export (Situation Report Generator).
//
// Grabs the MapLibre canvas via map.getCanvas().toDataURL("image/png"),
// then composes a printable briefing onto an offscreen canvas:
//   • a dark header band — district title, IST "generated at" stamp,
//     and a CONFIDENTIAL marker
//   • the live map image
//   • a footer band — a Web-Mercator scale bar (computed from the live
//     zoom + latitude) and an auto-generated legend of the currently
//     visible data layers (from GovMapLayersContext)
// …and triggers a browser download of the PNG.
// ---------------------------------------------------------------------

import { useState } from "react";
import maplibregl from "maplibre-gl";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  buildScaleBar,
  formatExportTimestamp,
  legendItemsForLayers,
} from "@/lib/map/gov-map-export";
import { useGovMapLayers } from "./GovMapLayersContext";

const HEADER_H = 60;
// Tall enough for the scale bar + up to 6 legend rows + the "+N more"
// line (rows start at bandY+44 and run 18px apart).
const FOOTER_H = 184;

type ExportMapButtonProps = {
  /** Returns the live MapLibre instance (null before the map loads). */
  getMap: () => maplibregl.Map | null;
  /** District name shown in the report header. */
  district?: string;
};

export function ExportMapButton({ getMap, district = "Patna" }: ExportMapButtonProps) {
  const toast = useToast();
  const { layers } = useGovMapLayers();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const map = getMap();
    if (!map) return;
    setExporting(true);
    try {
      const srcCanvas = map.getCanvas();
      const src = srcCanvas.toDataURL("image/png");

      // Decode the rasterised map so it can be drawn onto the report.
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      const W = srcCanvas.width;
      const H = srcCanvas.height + HEADER_H + FOOTER_H;
      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("canvas context unavailable");

      const now = new Date();
      const stamp = formatExportTimestamp(now);
      const filename = `situation-report-${district.toLowerCase()}-${now
        .toISOString()
        .slice(0, 10)}.png`;

      // ---- Header band: title, timestamp, classification. ----
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, W, HEADER_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 19px Inter, system-ui, sans-serif";
      ctx.fillText(`GOV OPERATIONS MAP — ${district.toUpperCase()}`, 24, 27);
      ctx.font = "500 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`Situation Report · Generated ${stamp} IST`, 24, 46);
      ctx.fillStyle = "#5b8df6";
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("SITREP // FOR OFFICIAL USE", W - 24, 27);
      ctx.textAlign = "left";

      // ---- The map image itself. ----
      ctx.drawImage(image, 0, HEADER_H);

      // ---- Footer band: scale bar + auto-generated legend. ----
      const bandY = H - FOOTER_H;
      ctx.fillStyle = "#0d1526";
      ctx.fillRect(0, bandY, W, FOOTER_H);

      const center = map.getCenter();
      const scale = buildScaleBar(120, map.getZoom(), center.lat);
      const barY = bandY + 24;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(24, barY, scale.widthPx, 3);
      ctx.fillRect(24, barY - 5, 1.5, 13);
      ctx.fillRect(24 + scale.widthPx - 1.5, barY - 5, 1.5, 13);
      ctx.font = "500 10px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(scale.label, 24, barY + 20);

      const legend = legendItemsForLayers(layers);
      const legendX = Math.max(280, W - 380);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 11px Inter, system-ui, sans-serif";
      ctx.fillText("LEGEND", legendX, barY);
      const visible = legend.slice(0, 6);
      visible.forEach((item, i) => {
        const y = bandY + 44 + i * 18;
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, y, 12, 12);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "500 10px Inter, system-ui, sans-serif";
        ctx.fillText(item.label, legendX + 20, y + 10);
      });
      if (legend.length > visible.length) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(
          `+${legend.length - visible.length} more`,
          legendX + 20,
          bandY + 44 + visible.length * 18 + 10,
        );
      }

      // ---- Download the composed PNG. ----
      const dataUrl = out.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      toast.success({
        title: "Situation report exported",
        description: `${filename} downloaded.`,
      });
    } catch {
      toast.error({
        title: "Export failed",
        description: "Could not render the map image.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      aria-label="Export situation report"
      title="Export situation report (PNG)"
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-panel-deep/85 px-3.5 text-sm font-semibold text-white shadow-[var(--shadow-float-md)] backdrop-blur transition hover:scale-[1.03] hover:bg-panel-deep active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FileDown aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
      {exporting ? "Exporting…" : "Export"}
    </button>
  );
}

export default ExportMapButton;
