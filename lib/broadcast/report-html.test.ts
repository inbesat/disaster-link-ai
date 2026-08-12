// ---------------------------------------------------------------------
// lib/broadcast/report-html.test.ts — Phase 8 · PDF/print report renderer.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  renderBroadcastReportHtml,
  summarizeRows,
  type PdfReportAlert,
} from "./report-html";

function sampleAlert(overrides: Partial<PdfReportAlert> = {}): PdfReportAlert {
  return {
    id: "a1",
    alertId: "dl-test-001-abc123",
    capHash: "3f7a9c2e8b1d4f6a0c5e9b7d2f4a6c8e1b3d5f7a9c2e8b1d4f6a0c5e9b7d2f",
    createdAt: "2026-08-12T10:30:00.000Z",
    language: "hi-IN",
    severity: "Extreme",
    status: "delivered",
    audioUrl: null,
    district: "Patna",
    disasterType: "flood",
    stationsReached: 4,
    failed: 1,
    deliveries: [
      {
        stationName: "AIR Patna FM",
        strategy: "cap_api",
        status: "delivered",
        responseCode: 200,
        responseBody: '{"accepted":true}',
        broadcastTime: "2026-08-12T10:33:00.000Z",
        retryCount: 0,
        externalRef: null,
      },
      {
        stationName: "Radio Nasha Patna",
        strategy: "ftp",
        status: "failed",
        responseCode: 530,
        responseBody: "login authentication failed",
        broadcastTime: null,
        retryCount: 3,
        externalRef: null,
      },
    ],
    ...overrides,
  };
}

describe("summarizeRows (Phase 8)", () => {
  it("computes totals, failures and success rate", () => {
    const stats = summarizeRows([sampleAlert(), sampleAlert()]);
    expect(stats.totalAlerts).toBe(2);
    expect(stats.stationsReached).toBe(8);
    expect(stats.failed).toBe(2);
    expect(stats.successRate).toBe(80);
  });

  it("handles an empty window", () => {
    expect(summarizeRows([])).toEqual({
      totalAlerts: 0,
      stationsReached: 0,
      failed: 0,
      successRate: 0,
    });
  });
});

describe("renderBroadcastReportHtml (Phase 8)", () => {
  it("renders the report head, summary stats and certificate cards", () => {
    const html = renderBroadcastReportHtml({
      rows: [sampleAlert()],
      source: "live",
      filters: { startDate: "2026-08-01", endDate: "2026-08-13", district: "Patna", disasterType: "flood", status: "delivered" },
    });

    expect(html).toContain("FM Emergency Broadcast Compliance Report");
    expect(html).toContain("dl-test-001-abc123"); // alert id
    expect(html).toContain("AIR Patna FM"); // station row
    expect(html).toContain("Radio Nasha Patna");
    expect(html).toContain("Broadcast certificate");
    expect(html).toContain("district: Patna");
    // Summary stats block
    expect(html).toContain(">1<"); // totalAlerts
    expect(html).toContain(">4<"); // stations reached
    expect(html).toContain(">1<"); // failed
    expect(html).toContain("80%"); // success rate
    // The CAP hash shows in the certificate
    expect(html).toContain("3f7a9c2e8b1d4f6a");
  });

  it("escapes injected HTML in station/delivery content", () => {
    const evil = sampleAlert({
      alertId: '<script>alert("xss")</script>',
      deliveries: [
        {
          stationName: '"><img src=x onerror=alert(1)>',
          strategy: "rds",
          status: "delivered",
          responseCode: 200,
          responseBody: "</table><script>alert(42)</script>",
          broadcastTime: null,
          retryCount: 0,
          externalRef: null,
        },
      ],
    });
    const html = renderBroadcastReportHtml({
      rows: [evil],
      source: "live",
      filters: {},
    });

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<img src=x');
    expect(html).toContain("&lt;img src=x");
    // responseBody is never inlined into the report — upstream station
    // payloads must never reach the document.
    expect(html).not.toContain("alert(42)");
  });

  it("stamps DEMO DATA when the source is demo", () => {
    const demo = renderBroadcastReportHtml({
      rows: [sampleAlert()],
      source: "demo",
      filters: {},
    });
    expect(demo).toContain("DEMO DATA");
    expect(demo).toContain("database unavailable");

    const live = renderBroadcastReportHtml({
      rows: [sampleAlert()],
      source: "live",
      filters: {},
    });
    expect(live).not.toContain("DEMO DATA");
  });

  it("renders an empty state for a blank window", () => {
    const html = renderBroadcastReportHtml({ rows: [], source: "live", filters: {} });
    expect(html).toContain("No broadcasts match these filters.");
    expect(html).toContain(">0<");
  });

  it("includes the print control bar and autoprint hook", () => {
    const html = renderBroadcastReportHtml({ rows: [sampleAlert()], source: "live", filters: {} });
    expect(html).toContain("Print / Save as PDF");
    expect(html).toContain('autoprint');
    expect(html).toContain("window.print()");
  });
});

describe("escapeHtml (Phase 8)", () => {
  it("escapes all five XML-sensitive characters", () => {
    expect(escapeHtml(`<a href="x" title='y'> & </a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt; &amp; &lt;/a&gt;",
    );
  });

  it("returns an empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
