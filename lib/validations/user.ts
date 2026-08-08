import { z } from "zod";
import { LOCALE_CODES, type Locale } from "@/lib/i18n/locales";

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
// Designations — shown in the Settings → Profile form dropdown.
// Broader than ORGANIZATIONS (adds Govt Official + Citizen Volunteer).
// ---------------------------------------------------------------------
export const DESIGNATIONS = [
  "NDRF",
  "SDRF",
  "NGO",
  "Govt Official",
  "Citizen Volunteer",
] as const;

export type Designation = (typeof DESIGNATIONS)[number];

export const designationSchema = z.enum(DESIGNATIONS);

// ---------------------------------------------------------------------
// Role display labels — e.g. "DISTRICT COMMANDER — PATNA" badge.
// ---------------------------------------------------------------------
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  district_admin: "District Commander",
  field_responder: "Field Responder",
  viewer: "Viewer",
};

// ---------------------------------------------------------------------
// Indian phone number: optional +91/91 country code, 10 digits starting 6-9
// ---------------------------------------------------------------------
const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

export const indianPhoneSchema = z
  .string()
  .regex(indianPhoneRegex, "Enter a valid Indian phone number (e.g. +919876543210)");

// ---------------------------------------------------------------------
// Settings → Profile & Account (Phase 2) — editable personal identity.
// Email is intentionally NOT part of the schema: it is displayed read-only
// with a Verified badge.
// ---------------------------------------------------------------------
export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  displayName: z.string().min(1, "Display name is required"),
  phone: indianPhoneSchema,
  bio: z
    .string()
    .max(280, "Bio must be 280 characters or fewer")
    .optional(),
  designation: designationSchema,
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

// ---------------------------------------------------------------------
// Preferred UI language (English + 22 scheduled languages of India)
// ---------------------------------------------------------------------
export const PREFERRED_LANGUAGES = [...LOCALE_CODES] as const;

export type PreferredLanguage = Locale;

export const preferredLanguageSchema = z.enum(PREFERRED_LANGUAGES);

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
  // Required (not `.default()`): the profile form always submits an explicit
  // value, and keeping it required keeps react-hook-form's input/output
  // types in sync.
  preferredLanguage: preferredLanguageSchema,
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type ProfileSetupErrors = z.inferFormattedError<typeof profileSetupSchema>;

// ---------------------------------------------------------------------
// Password & Security (Settings · Phase 5) — secure password update.
// Rules: min 8 chars, at least one uppercase letter, one digit, and the
// confirmation field must match the new password exactly.
// ---------------------------------------------------------------------
const basePasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: basePasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
