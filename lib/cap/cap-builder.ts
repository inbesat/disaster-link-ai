// ---------------------------------------------------------------------
// lib/cap/cap-builder.ts — Phase 3 · CAP v1.2 (OASIS) XML generator.
//
// Produces standards-compliant Common Alerting Protocol 1.2 XML for FM
// radio dissemination. The output is a single <alert> document with one
// or more <info> blocks (repeating <info> gives multilingual alerts —
// one per language). Polygons/circles follow the CAP WGS84 convention
// (lon,lat pairs; closed polygons).
//
// The builder is a pure function: it only assembles + escapes XML, so it
// stays unit-testable. Mandatory-field enforcement lives in
// lib/cap/cap-validator.ts and is called by the API route before storage.
// ---------------------------------------------------------------------

import type { CapAlertInput, CapArea } from "./types";

export const CAP_NAMESPACE = "urn:oasis:names:tc:emergency:cap:1.2";

export const CAP_DOCTYPE =
  "<!DOCTYPE alert PUBLIC \"-//OASIS//DTD CAP 1.2//EN\" " +
  "\"http://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.dtd\">";

/** Escape a single text value for XML content/attribute usage. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Render a number so it never leaks exponent notation into the XML. */
export function formatCoordinate(value: number): string {
  return Number(value.toFixed(6)).toString();
}

/** Render an area's geometry as CAP `<polygon>` or `<circle>` elements. */
function renderAreaGeometry(area: CapArea): string {
  if (area.polygon && area.polygon.length >= 3) {
    // CAP requires a closed polygon: first point repeated as last.
    const points = [...area.polygon];
    const first = points[0];
    if (first[0] !== points[points.length - 1][0] || first[1] !== points[points.length - 1][1]) {
      points.push(first);
    }
    const polyline = points
      .map(([lon, lat]) => `${formatCoordinate(lon)},${formatCoordinate(lat)}`)
      .join(" ");
    return `  <polygon>${escapeXml(polyline)}</polygon>\n`;
  }
  if (area.circle) {
    const [lon, lat, radiusKm] = area.circle;
    return `  <circle>${escapeXml(
      `${formatCoordinate(lon)},${formatCoordinate(lat)} ${formatCoordinate(radiusKm)}`,
    )}</circle>\n`;
  }
  return "";
}

/** Render a single <info> block. */
function renderInfo(info: {
  language: string;
  category: string;
  event: string;
  urgency: string;
  severity: string;
  certainty: string;
  effective: string;
  expires: string;
  senderName: string;
  headline: string;
  description: string;
  instruction?: string;
  areas: CapArea[];
  resources?: Array<{ resourceDesc: string; mimeType: string; uri: string }>;
}): string {
  const lines = ["  <info>"];
  lines.push(`    <language>${escapeXml(info.language)}</language>`);
  lines.push(`    <category>${escapeXml(info.category)}</category>`);
  lines.push(`    <event>${escapeXml(info.event)}</event>`);
  lines.push(`    <urgency>${escapeXml(info.urgency)}</urgency>`);
  lines.push(`    <severity>${escapeXml(info.severity)}</severity>`);
  lines.push(`    <certainty>${escapeXml(info.certainty)}</certainty>`);
  lines.push(`    <effective>${escapeXml(info.effective)}</effective>`);
  lines.push(`    <expires>${escapeXml(info.expires)}</expires>`);
  lines.push(`    <senderName>${escapeXml(info.senderName)}</senderName>`);
  lines.push(`    <headline>${escapeXml(info.headline)}</headline>`);
  lines.push(`    <description>${escapeXml(info.description)}</description>`);
  if (info.instruction) {
    lines.push(`    <instruction>${escapeXml(info.instruction)}</instruction>`);
  }
  for (const area of info.areas) {
    lines.push("    <area>");
    lines.push(`      <areaDesc>${escapeXml(area.areaDesc)}</areaDesc>`);
    const geometry = renderAreaGeometry(area).trimEnd();
    if (geometry) lines.push(`      ${geometry}`);
    lines.push("    </area>");
  }
  for (const resource of info.resources ?? []) {
    lines.push("    <resource>");
    lines.push(`      <resourceDesc>${escapeXml(resource.resourceDesc)}</resourceDesc>`);
    lines.push(`      <mimeType>${escapeXml(resource.mimeType)}</mimeType>`);
    lines.push(`      <uri>${escapeXml(resource.uri)}</uri>`);
    lines.push("    </resource>");
  }
  lines.push("  </info>");
  return lines.join("\n");
}

/**
 * Build a full CAP 1.2 alert document as a string, with XML declaration
 * and DOCTYPE. Throws on obviously-missing required inputs so callers
 * fail fast; formal validation is cap-validator's job.
 */
export function buildCapAlert(input: CapAlertInput): string {
  if (!input.identifier) throw new Error("CAP identifier is required.");
  if (!input.sender) throw new Error("CAP sender is required.");
  if (!input.sent) throw new Error("CAP sent timestamp is required.");
  if (!input.infos.length) throw new Error("CAP requires at least one <info> block.");
  if (input.msgType !== "Alert" && !input.references) {
    throw new Error(`CAP msgType ${input.msgType} requires a <references> identifier.`);
  }

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    CAP_DOCTYPE,
    `<alert xmlns="${CAP_NAMESPACE}">`,
    `  <identifier>${escapeXml(input.identifier)}</identifier>`,
    `  <sender>${escapeXml(input.sender)}</sender>`,
    `  <sent>${escapeXml(input.sent)}</sent>`,
    `  <status>${escapeXml(input.status)}</status>`,
    `  <msgType>${escapeXml(input.msgType)}</msgType>`,
    `  <scope>${escapeXml(input.scope)}</scope>`,
  ];

  if (input.references) {
    lines.push(`  <references>${escapeXml(input.references)}</references>`);
  }

  lines.push(input.infos.map(renderInfo).join("\n"));
  lines.push("</alert>");
  return lines.join("\n") + "\n";
}
