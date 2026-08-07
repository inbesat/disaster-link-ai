"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";

export type ShelterFacilities = {
  water?: boolean;
  food?: boolean;
  medical?: boolean;
  electricity?: boolean;
};

export type ShelterInput = {
  name: string;
  district?: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy?: number;
  facilities?: ShelterFacilities;
  contactPerson?: string;
  phone?: string;
  imageUrl?: string;
};

/**
 * Fetch all shelters, optionally filtered by district. Ordered newest first.
 */
export async function getShelters(district?: string) {
  const rows = await prisma.shelter.findMany({
    where: district ? { district } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows;
}

/**
 * Register a new shelter. If it starts at (or over) capacity it is flagged
 * "full"; otherwise it opens. Revalidates the cache so the UI refreshes.
 */
export async function addShelter(data: ShelterInput) {
  const occupancy = Math.max(0, data.currentOccupancy ?? 0);
  const status = data.capacity > 0 && occupancy >= data.capacity ? "full" : "open";

  const shelter = await prisma.shelter.create({
    data: {
      name: data.name,
      district: data.district ?? null,
      lat: data.lat,
      lng: data.lng,
      capacity: data.capacity,
      currentOccupancy: occupancy,
      facilities: (data.facilities as object | null) ?? undefined,
      status,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });

  revalidatePath("/shelters");
  revalidatePath("/dashboard");
  return shelter;
}

/**
 * Update how many people are sheltered. Automatically flips the status to
 * "full" when occupancy reaches capacity, and back to "open" when space frees
 * up (a manually closed shelter is left as-is).
 */
export async function updateOccupancy(shelterId: string, newOccupancy: number) {
  const shelter = await prisma.shelter.findUnique({
    where: { id: shelterId },
  });
  if (!shelter) throw new Error("Shelter not found.");

  const occupancy = Math.max(0, newOccupancy);
  let status = shelter.status;
  if (occupancy >= shelter.capacity) status = "full";
  else if (shelter.status === "full") status = "open";

  const updated = await prisma.shelter.update({
    where: { id: shelterId },
    data: { currentOccupancy: occupancy, status },
  });

  revalidatePath("/shelters");
  revalidatePath("/dashboard");
  return updated;
}
