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
// Gov roles — the allow-list for Command Center API endpoints (Step 7).
// Mirrors GOV_ROLES in middleware.ts; keep in sync.
// ---------------------------------------------------------------------
export const GOV_ROLES = ["field_responder", "district_admin", "super_admin"] as const;

export type GovRole = (typeof GOV_ROLES)[number];

// ---------------------------------------------------------------------
// Admin roles — the strict allow-list for admin-only endpoints (e.g. the
// Step 10 open-data export). Mirrors ADMIN_ROLES in middleware.ts.
// ---------------------------------------------------------------------
export const ADMIN_ROLES = ["super_admin", "district_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

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
  bio: z.string().max(280, "Bio must be 280 characters or fewer").optional(),
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
export const profileSetupSchema = z
  .object({
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
    // Verified NGO Donation — the onboarding toggle flips isNgo; the two
    // text fields below are only required (see superRefine) when the toggle
    // is ON, so regular citizens can ignore them entirely. Required (not
    // `.default()`) so react-hook-form's input/output types stay in sync —
    // the form always supplies a value via defaultValues + setValue.
    isNgo: z.boolean(),
    ngoRegNumber: z.string().optional(),
    ngoDescription: z.string().optional(),
    // PWD (Persons with Disabilities) — the onboarding toggle flips isPwd;
    // pwdDetails is only required when the toggle is ON, so regular citizens
    // can ignore it entirely.
    isPwd: z.boolean(),
    pwdDetails: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // NGO validation
    if (data.isNgo) {
      if (!data.ngoRegNumber || data.ngoRegNumber.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ngoRegNumber"],
          message: "Enter the NGO registration number (at least 3 characters)",
        });
      }
      if (!data.ngoDescription || data.ngoDescription.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ngoDescription"],
          message: "Briefly describe your relief work (at least 10 characters)",
        });
      }
    }
    // PWD validation — require mobility details when PWD toggle is ON
    if (data.isPwd) {
      if (!data.pwdDetails || data.pwdDetails.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pwdDetails"],
          message: "Please specify your mobility/accessibility needs (at least 3 characters)",
        });
      }
    }
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
