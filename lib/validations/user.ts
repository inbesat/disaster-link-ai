import { z } from "zod";

// ---------------------------------------------------------------------
// RBAC roles — source of truth for authorization across the platform
// ---------------------------------------------------------------------
export const ROLES = [
  "super_admin",
  "district_admin",
  "field_responder",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export const userRoleSchema = z.enum(ROLES);

// ---------------------------------------------------------------------
// Responder organizations
// ---------------------------------------------------------------------
export const ORGANIZATIONS = ["NDRF", "SDRF", "NGO", "Govt"] as const;

export type Organization = (typeof ORGANIZATIONS)[number];

export const organizationSchema = z.enum(ORGANIZATIONS);

// ---------------------------------------------------------------------
// Indian phone number: optional +91/91 country code, 10 digits starting 6-9
// ---------------------------------------------------------------------
const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

export const indianPhoneSchema = z
  .string()
  .regex(indianPhoneRegex, "Enter a valid Indian phone number (e.g. +919876543210)");

// ---------------------------------------------------------------------
// Profile setup — validated on first sign-in / onboarding
// ---------------------------------------------------------------------
export const profileSetupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  organization: organizationSchema,
  role: userRoleSchema,
  phone: indianPhoneSchema,
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: indianPhoneSchema,
  }),
  assignedDistrict: z.string().min(1, "Assigned district is required"),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type ProfileSetupErrors = z.inferFormattedError<typeof profileSetupSchema>;
