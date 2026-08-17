import { z } from "zod";

// ---------------------------------------------------------------------
// Missing Person — citizen reports a missing family member
// ---------------------------------------------------------------------
export const missingPersonSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  age: z.number().int().min(0).max(120).optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  lastKnownArea: z.string().max(200).optional().nullable(),
  lastSeenAt: z.string().optional().nullable(), // ISO datetime string
  contactName: z.string().min(1, "Contact name is required").max(120),
  contactPhone: z.string().min(1, "Phone is required").max(20),
  contactRelation: z.enum(["parent", "spouse", "sibling", "other"]).optional().nullable(),
  district: z.string().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type MissingPersonInput = z.infer<typeof missingPersonSchema>;

// ---------------------------------------------------------------------
// Casualty Record — responder logs a casualty/incident
// ---------------------------------------------------------------------
export const casualtyRecordSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  age: z.number().int().min(0).max(120).optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  injuryType: z.enum(["injury", "illness", "fatality", "missing"]),
  severity: z.enum(["minor", "moderate", "severe", "critical"]).default("minor"),
  description: z.string().max(1000).optional().nullable(),
  locationName: z.string().max(200).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  district: z.string().optional().nullable(),
  status: z.enum(["active", "treated", "discharged", "deceased"]).default("active"),
});

export type CasualtyRecordInput = z.infer<typeof casualtyRecordSchema>;
