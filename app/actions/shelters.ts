"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/server/prisma";
import { PUBLIC_SHELTERS_CACHE_TAG } from "@/lib/cache-tags";
import { sanitizeInput } from "@/lib/security/sanitize";

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

const VALID_LAT_RANGE = { min: -90, max: 90 };
const VALID_LNG_RANGE = { min: -180, max: 180 };
const MAX_NAME_LENGTH = 200;
const MAX_CAPACITY = 100000;

function validateShelterInput(data: ShelterInput): string | null {
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return "Shelter name is required.";
  }
  if (data.name.length > MAX_NAME_LENGTH) {
    return `Shelter name must be under ${MAX_NAME_LENGTH} characters.`;
  }
  if (typeof data.lat !== "number" || !Number.isFinite(data.lat) ||
      data.lat < VALID_LAT_RANGE.min || data.lat > VALID_LAT_RANGE.max) {
    return "Invalid latitude value.";
  }
  if (typeof data.lng !== "number" || !Number.isFinite(data.lng) ||
      data.lng < VALID_LNG_RANGE.min || data.lng > VALID_LNG_RANGE.max) {
    return "Invalid longitude value.";
  }
  if (typeof data.capacity !== "number" || data.capacity < 0 || data.capacity > MAX_CAPACITY) {
    return `Capacity must be between 0 and ${MAX_CAPACITY}.`;
  }
  return null;
}

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
  const validationError = validateShelterInput(data);
  if (validationError) {
    throw new Error(validationError);
  }

  const occupancy = Math.max(0, data.currentOccupancy ?? 0);
  const status = data.capacity > 0 && occupancy >= data.capacity ? "full" : "open";

  const shelter = await prisma.shelter.create({
    data: {
      name: sanitizeInput(data.name),
      district: data.district ? sanitizeInput(data.district) : null,
      lat: data.lat,
      lng: data.lng,
      capacity: data.capacity,
      currentOccupancy: occupancy,
      facilities: (data.facilities as object | null) ?? undefined,
      status,
      contactPerson: data.contactPerson ? sanitizeInput(data.contactPerson) : null,
      phone: data.phone ? sanitizeInput(data.phone) : null,
      imageUrl: data.imageUrl ?? null,
    },
  });

  revalidatePath("/shelters");
  revalidatePath("/dashboard");
  revalidateTag(PUBLIC_SHELTERS_CACHE_TAG);
  return shelter;
}

/**
 * Update how many people are sheltered. Automatically flips the status to
 * "full" when occupancy reaches capacity, and back to "open" when space frees
 * up (a manually closed shelter is left as-is).
 */
export async function updateOccupancy(shelterId: string, newOccupancy: number) {
  if (typeof newOccupancy !== "number" || !Number.isFinite(newOccupancy) || newOccupancy < 0) {
    throw new Error("Invalid occupancy value.");
  }

  const shelter = await prisma.shelter.findUnique({
    where: { id: shelterId },
  });
  if (!shelter) throw new Error("Shelter not found.");

  const occupancy = Math.max(0, Math.floor(newOccupancy));
  let status = shelter.status;
  if (occupancy >= shelter.capacity) status = "full";
  else if (shelter.status === "full") status = "open";

  const updated = await prisma.shelter.update({
    where: { id: shelterId },
    data: { currentOccupancy: occupancy, status },
  });

  revalidatePath("/shelters");
  revalidatePath("/dashboard");
  revalidateTag(PUBLIC_SHELTERS_CACHE_TAG);
  return updated;
}
