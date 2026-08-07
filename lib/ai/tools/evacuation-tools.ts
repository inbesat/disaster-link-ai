import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getEvacuationRoute, validateRouteSafety } from "@/lib/map/routing";
import { calculateFleetRequirements } from "@/lib/map/fleet-allocation";
import type { Feature, Polygon } from "geojson";

export const calculateEvacuationRoutes = tool({
  description:
    "Calculates a safe evacuation route between an endangered origin (village/area) and a destination shelter, flagging hazards such as flood zones and active road closures.",
  inputSchema: z.object({
    originLat: z.number().describe("Latitude of the evacuation origin (village/area)."),
    originLng: z.number().describe("Longitude of the evacuation origin."),
    destinationLat: z.number().describe("Latitude of the destination shelter."),
    destinationLng: z.number().describe("Longitude of the destination shelter."),
    evacuees: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Estimated number of evacuees to transport."),
    district: z
      .string()
      .optional()
      .describe("Optional district label to enrich the route summary."),
  }),
  execute: async ({
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    evacuees,
    district,
  }) => {
    try {
      // Resolve the driving route (OSRM with straight-line fallback).
      const route = await getEvacuationRoute(
        originLng,
        originLat,
        destinationLng,
        destinationLat,
      );

      // Validate against flood polygons + active road closures.
      const closureRows = await prisma.roadClosure
        .findMany({ where: { isActive: true } })
        .catch(() => []);

      const floodPolygons: Feature<Polygon>[] = [];
      const roadClosures = closureRows.map((c) => ({
        id: String(c.id),
        lat: c.lat,
        lng: c.lng,
        reason: c.reason,
        isActive: c.isActive,
      }));

      const safety = validateRouteSafety(route.geometry, floodPolygons, roadClosures);

      const minutes = Math.round(route.durationSeconds / 60);
      const fleet = evacuees
        ? calculateFleetRequirements(evacuees, route.durationSeconds)
        : undefined;

      return {
        ok: true,
        district,
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destinationLat, lng: destinationLng },
        distanceMeters: Math.round(route.distanceMeters),
        durationMinutes: minutes,
        isSafe: safety.isSafe,
        safetyWarnings: safety.warnings,
        geometry: route.geometry,
        ...(fleet
          ? {
              recommendedFleet: {
                busesNeeded: fleet.busesNeeded,
                boatsNeeded: fleet.boatsNeeded,
                estimatedTotalTimeH: fleet.estimatedTotalTimeH,
              },
            }
          : {}),
      };
    } catch (error) {
      console.warn("[ai] calculateEvacuationRoutes failed.", error);
      return {
        ok: false,
        error: "Could not calculate an evacuation route right now.",
      };
    }
  },
});

export const evacuationPlanTools = {
  calculateEvacuationRoutes,
};
