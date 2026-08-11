// ---------------------------------------------------------------------
// lib/map/whatsapp-share.test.ts — Phase 1 · Step 7 · wa.me share URL
// builder tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildRouteShareText,
  buildWhatsAppShareUrl,
  type RouteShareDetails,
} from "./whatsapp-share";

const DETAILS: RouteShareDetails = {
  originLabel: "My Location",
  destination: "Patna Central Community Hall",
  distanceKm: 3.1,
  etaMinutes: 37,
  mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=25.5941,85.1376&destination=25.609,85.164&travelmode=walking",
};

describe("buildRouteShareText", () => {
  it("matches the step-spec message template", () => {
    expect(buildRouteShareText(DETAILS)).toBe(
      "Safe evacuation route from My Location to Patna Central Community Hall. " +
        "Distance: 3.1 km. ETA: 37 min. " +
        "Open in Maps: https://www.google.com/maps/dir/?api=1&origin=25.5941,85.1376&destination=25.609,85.164&travelmode=walking",
    );
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("uses the https://wa.me/?text= scheme", () => {
    const url = buildWhatsAppShareUrl(DETAILS);
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
  });

  it("URL-encodes spaces, ampersands and equals signs", () => {
    const url = buildWhatsAppShareUrl(DETAILS);
    expect(url).toContain("text=Safe%20evacuation%20route");
    expect(url).toContain("%3Fapi%3D1");
    expect(url).toContain("%26origin%3D");
    expect(url).not.toContain(" "); // no raw spaces in an encoded URL
  });
});
