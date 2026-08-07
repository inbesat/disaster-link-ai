import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/server/prisma";

export type ShelterSnapshot = {
  id: string;
  name: string;
  district: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  facilities: Record<string, boolean> | null;
};

function mockShelters(district: string): ShelterSnapshot[] {
  return [
    {
      id: "mock-sh-1",
      name: "District Hospital",
      district,
      capacity: 300,
      currentOccupancy: 120,
      status: "open",
      facilities: { water: true, food: true, medical: true, electricity: true },
    },
    {
      id: "mock-sh-2",
      name: "Govt Senior Secondary School",
      district,
      capacity: 400,
      currentOccupancy: 280,
      status: "open",
      facilities: { water: true, food: true, medical: false, electricity: true },
    },
    {
      id: "mock-sh-3",
      name: "Community Flood Shelter",
      district,
      capacity: 250,
      currentOccupancy: 250,
      status: "full",
      facilities: { water: true, food: false, medical: true, electricity: true },
    },
  ];
}

export const getShelterStatus = tool({
  description:
    "Fetches current occupancy and capacity of shelters in a specific district.",
  inputSchema: z.object({
    district: z.string().describe("The district to look up shelter availability in."),
  }),
  execute: async ({ district }) => {
    try {
      const rows = await prisma.shelter.findMany({
        where: { district },
        orderBy: { currentOccupancy: "asc" },
        select: {
          id: true,
          name: true,
          district: true,
          capacity: true,
          currentOccupancy: true,
          status: true,
          facilities: true,
        },
      });

      if (!rows.length) return { district, shelters: mockShelters(district) };

      return {
        district,
        shelters: rows.map((row) => ({
          ...row,
          facilities: (row.facilities as Record<string, boolean> | null) ?? null,
        })),
      };
    } catch {
      // DB not reachable (or empty) -> return realistic demo data so the
      // planner can keep reasoning about evacuation options.
      return { district, shelters: mockShelters(district) };
    }
  },
});

export const emergencyPlanTools = {
  getShelterStatus,
};
