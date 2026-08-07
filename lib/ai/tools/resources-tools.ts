import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/server/prisma";

export type ResourceSnapshot = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string | null;
  status: string;
  depotName: string | null;
};

function mockInventory(district: string): ResourceSnapshot[] {
  return [
    {
      id: "res-1",
      name: "NDRF Rescue Boats",
      category: "boat",
      quantity: 12,
      unit: "boats",
      status: "available",
      depotName: `${district} NDRF Depot`,
    },
    {
      id: "res-2",
      name: "Medical First-Aid Kits",
      category: "medical",
      quantity: 200,
      unit: "kits",
      status: "available",
      depotName: "Sadar Hospital Depot",
    },
    {
      id: "res-3",
      name: "Bottled Water Pallets",
      category: "water",
      quantity: 350,
      unit: "pallets",
      status: "available",
      depotName: "Gandhi Maidan Store",
    },
    {
      id: "res-4",
      name: "Search & Rescue Teams",
      category: "personnel",
      quantity: 8,
      unit: "teams",
      status: "available",
      depotName: "District Unit",
    },
    {
      id: "res-5",
      name: "Food Rations",
      category: "food",
      quantity: 350,
      unit: "pallets",
      status: "available",
      depotName: "District Store",
    },
  ];
}

export const getResourceInventory = tool({
  description:
    "Fetches the current inventory of response resources (boats, food, medical, personnel, water, vehicles) and their availability status for a district.",
  inputSchema: z.object({
    district: z.string().describe("The district to look up resource inventory for."),
    category: z
      .enum([
        "boat",
        "food",
        "medical",
        "water",
        "personnel",
        "vehicle",
        "communication",
        "power",
        "other",
      ])
      .optional()
      .describe("Optionally restrict the inventory to a single resource category."),
  }),
  execute: async ({ district, category }) => {
    try {
      const rows = await prisma.resource.findMany({
        where: category ? { category } : {},
        orderBy: { category: "asc" },
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
          unit: true,
          status: true,
          depotName: true,
        },
      });

      if (!rows.length) {
        const base = mockInventory(district);
        const filtered = category ? base.filter((r) => r.category === category) : base;
        return { district, resources: filtered };
      }

      return {
        district,
        category: category ?? "all",
        resources: rows.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          quantity: r.quantity,
          unit: r.unit,
          status: r.status,
          depotName: r.depotName,
        })),
      };
    } catch {
      const base = mockInventory(district);
      const filtered = category ? base.filter((r) => r.category === category) : base;
      return { district, category: category ?? "all", resources: filtered };
    }
  },
});

export const resourceInventoryTools = {
  getResourceInventory,
};
