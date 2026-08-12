// ---------------------------------------------------------------------
// lib/broadcast/report-html.ts — Phase 8 · PDF/print export renderer.
//
// Pure function that turns broadcast-history rows into a print-ready,
// A4-optimised HTML document for the DDMA/MIB compliance report. The
// route /api/broadcast/fm/export/pdf serves this HTML; the browser's
// "Save as PDF" produces the downloadable report — no heavy PDF
// dependency, and the layout stays fully controllable via CSS.
//
// Row shapes come from lib/broadcast/history.ts (the shared loader used
// by the history table and this export, so they can't drift). Everything
// dynamic is HTML-escaped (delivery response bodies come from upstream
// stations and must never inject markup). The renderer is pure and
// unit-tested (lib/broadcast/report-html.test.ts).
// ---------------------------------------------------------------------

import type {
  BroadcastDeliveryRow as PdfDeliveryRow,
  BroadcastHistoryRow as PdfReportAlert,
} from "./history";

// Re-exported so callers/tests keep the renderer-facing names.
export type { PdfDeliveryRow, PdfReportAlert };

export interface BroadcastReportHtmlInput {
  rows: PdfReportAlert[];
  /** 'live' when from the database, 'demo' when the mock fallback served. */
  source: "live" | "demo";
  filters?: {
    startDate?: string | null;
    endDate?: string | null;
    district?: string | null;
    disasterType?: string | null;
    status?: string | null;
  };
  generatedAt?: Date;
}

/** Escape text for safe HTML embedding (content + attributes). */
export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Short human-readable timestamp (en-IN locale). */
function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function severityClass(severity: string | null): string {
  const s = (severity ?? "").toLowerCase();
  if (s.includes("extreme") || s.includes("severe")) return "sev-critical";
  if (s.includes("moderate")) return "sev-warning";
  return "sev-neutral";
}

function statusClass(status: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "delivered") return "st-delivered";
  if (s === "failed") return "st-failed";
  if (s === "sent") return "st-sent";
  return "st-pending";
}

/** Summary stats computed from the rows. */
export function summarizeRows(rows: PdfReportAlert[]): {
  totalAlerts: number;
  stationsReached: number;
  failed: number;
  successRate: number;
} {
  const totalAlerts = rows.length;
  const stationsReached = rows.reduce((sum, r) => sum + r.stationsReached, 0);
  const failed = rows.reduce((sum, r) => sum + r.failed, 0);
  const attempts = stationsReached + failed;
  const successRate = attempts > 0 ? Math.round((stationsReached / attempts) * 100) : 0;
  return { totalAlerts, stationsReached, failed, successRate };
}

/** One certificate card per alert, with the station-wise delivery table. */
function renderAlertCard(alert: PdfReportAlert): string {
  const summary = `Reached ${alert.stationsReached} / failed ${alert.failed}`;
  const rows = alert.deliveries
    .map((d) => {
      const broadcast = d.broadcastTime
        ? escapeHtml(formatTime(d.broadcastTime))
        : "—";
      return `<tr>
        <td>${escapeHtml(d.stationName)}</td>
        <td><span class="tag">${escapeHtml(d.strategy)}</span></td>
        <td><span class="status ${statusClass(d.status)}">${escapeHtml(d.status)}</span></td>
        <td class="mono">${d.responseCode ?? "—"}</td>
        <td>${broadcast}</td>
        <td>${d.retryCount}</td>
      </tr>`;
    })
    .join("");

  const deliveriesBlock =
    alert.deliveries.length === 0
      ? `<p class="muted">No delivery attempts were logged for this alert.</p>`
      : `<table class="delivery">
          <thead>
            <tr>
              <th>Station</th><th>Channel</th><th>Status</th>
              <th>Response</th><th>Broadcast time</th><th>Retries</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

  return `<section class="certificate">
    <div class="cert-head">
      <div>
        <h2>Broadcast certificate</h2>
        <p class="mono alert-id">${escapeHtml(alert.alertId)}</p>
      </div>
      <span class="status ${statusClass(alert.status)}">${escapeHtml(alert.status)}</span>
    </div>
    <div class="meta-grid">
      <div><span class="meta-label">Time</span><span>${escapeHtml(formatTime(alert.createdAt))}</span></div>
      <div><span class="meta-label">District</span><span>${escapeHtml(alert.district) || "—"}</span></div>
      <div><span class="meta-label">Disaster type</span><span>${escapeHtml(alert.disasterType) || "—"}</span></div>
      <div><span class="meta-label">Severity</span><span class="severity ${severityClass(alert.severity)}">${escapeHtml(alert.severity) || "—"}</span></div>
      <div><span class="meta-label">Language</span><span>${escapeHtml(alert.language) || "—"}</span></div>
      <div><span class="meta-label">Delivery</span><span>${summary}</span></div>
      <div class="wide"><span class="meta-label">CAP hash (SHA-256)</span><span class="mono">${escapeHtml(alert.capHash) || "—"}</span></div>
    </div>
    ${deliveriesBlock}
  </section>`;
}

/**
 * Render the full A4 print document. Includes a floating "Print / Save as
 * PDF" button (hidden when printing) and — when autoprint is set — an
 * onload `window.print()` so the history page's "Export PDF" button lands
 * straight in the print dialog.
 */
export function renderBroadcastReportHtml(input: BroadcastReportHtmlInput): string {
  const generatedAt = input.generatedAt ?? new Date();
  const stats = summarizeRows(input.rows);
  const cards = input.rows.map(renderAlertCard).join("\n");
  const demoBadge = input.source === "demo"
    ? `<div class="demo-stamp">DEMO DATA</div>`
    : "";

  const filters = input.filters ?? {};
  const filterLine = [
    filters.startDate ? `from ${filters.startDate}` : null,
    filters.endDate ? `to ${filters.endDate}` : null,
    filters.district ? `district: ${filters.district}` : null,
    filters.disasterType ? `type: ${filters.disasterType}` : null,
    filters.status ? `status: ${filters.status}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>FM Broadcast Compliance Report — SafeSphere</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a; background: #ffffff; margin: 0; padding: 24px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .print-bar {
    position: fixed; top: 12px; right: 12px; z-index: 50; display: flex; gap: 8px;
  }
  .print-bar button, .print-bar a {
    background: #0f766e; color: #fff; border: 0; border-radius: 8px;
    padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    text-decoration: none; box-shadow: 0 2px 8px rgba(15,23,42,.25);
  }
  .print-bar .back { background: #334155; }
  header.report-head { border-bottom: 3px solid #0f766e; padding-bottom: 14px; margin-bottom: 18px; }
  .eyebrow { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #0f766e; font-weight: 700; }
  h1 { font-size: 22px; margin: 4px 0 2px; color: #0f172a; }
  .sub { color: #475569; font-size: 13px; margin: 0; }
  .meta-line { color: #64748b; font-size: 12px; margin-top: 6px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0 22px; }
  .stat { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; background: #f8fafc; }
  .stat b { display: block; font-size: 22px; color: #0f172a; }
  .stat span { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
  .certificate {
    border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
    break-inside: avoid;
  }
  .cert-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cert-head h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .1em; color: #0f172a; margin: 0; }
  .alert-id { color: #0369a1; font-size: 12px; margin: 2px 0 0; }
  .mono { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 12px; }
  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 14px; margin-bottom: 12px; }
  .meta-grid .wide { grid-column: 1 / -1; }
  .meta-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; }
  .meta-grid span:last-child:not(.meta-label) { font-size: 13px; color: #1e293b; }
  table.delivery { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.delivery th {
    text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
    color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 6px 8px;
  }
  table.delivery td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  .tag {
    display: inline-block; background: #f1f5f9; border-radius: 999px;
    padding: 1px 8px; font-size: 11px; text-transform: uppercase; color: #334155;
  }
  .status { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 11px; font-weight: 600; }
  .st-delivered { background: #dcfce7; color: #166534; }
  .st-failed { background: #fee2e2; color: #991b1b; }
  .st-sent { background: #e0f2fe; color: #075985; }
  .st-pending { background: #fef3c7; color: #92400e; }
  .severity { font-weight: 600; }
  .sev-critical { color: #b91c1c; }
  .sev-warning { color: #b45309; }
  .sev-neutral { color: #475569; }
  .muted { color: #64748b; font-size: 12px; }
  footer.report-foot {
    margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;
    color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between;
  }
  .demo-stamp {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 120px; font-weight: 900; color: rgba(185,28,28,.08); letter-spacing: .1em;
    pointer-events: none; z-index: 1; transform: rotate(-24deg);
  }
  @media print {
    .print-bar { display: none; }
    body { padding: 0; }
  }
</style>
</head>
<body>
${demoBadge}
<div class="print-bar">
  <button class="back" onclick="window.close()">Close</button>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>

<header class="report-head">
  <p class="eyebrow">SafeSphere Platform · District Disaster Management Authority</p>
  <h1>FM Emergency Broadcast Compliance Report</h1>
  <p class="sub">Station-wise broadcast certificates for ${escapeHtml(filterLine) || "all recorded broadcasts"}</p>
  <p class="meta-line">Generated ${escapeHtml(formatTime(generatedAt.toISOString()))} · ${input.source === "demo" ? "DEMO DATA (database unavailable — seeded samples)" : "Live data from the broadcast audit trail"} · Audio retained 90 days · CAP messages SHA-256 hashed</p>
</header>

<div class="stats">
  <div class="stat"><b>${stats.totalAlerts}</b><span>Alerts broadcast</span></div>
  <div class="stat"><b>${stats.stationsReached}</b><span>Stations reached</span></div>
  <div class="stat"><b>${stats.failed}</b><span>Failed deliveries</span></div>
  <div class="stat"><b>${stats.successRate}%</b><span>Success rate</span></div>
</div>

${cards || `<p class="muted">No broadcasts match these filters.</p>`}

<footer class="report-foot">
  <span>Generated by SafeSphere Platform — AI-Voiced Calamity Alerts to FM Radio</span>
  <span>For DDMA / MIB compliance review</span>
</footer>

<script>
  // History page opens the export with ?autoprint=1 so the print dialog
  // (Save as PDF) appears immediately; direct visits show the button only.
  if (new URLSearchParams(location.search).get("autoprint") === "1") {
    window.addEventListener("load", function () { window.print(); });
  }
</script>
</body>
</html>`;
}
