import { z } from "zod";
import { ROLES } from "@/lib/validations/user";

// ---------------------------------------------------------------------
// authSchemas: email, password, OTP, role enum
// ---------------------------------------------------------------------
export const authSchemas = {
  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
  signup: z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number"),
    role: z.enum(ROLES).optional(),
  }),
  otp: z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    code: z.string().length(6, "OTP code must be 6 digits"),
  }),
};

// ---------------------------------------------------------------------
// disasterSchemas: district_id, risk_level enum, coordinates (lat/lng min/max bounds)
// ---------------------------------------------------------------------
export const disasterSchemas = {
  disasterEvent: z.object({
    districtId: z.string().min(1, "District ID is required"),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
};

// ---------------------------------------------------------------------
// resourceSchemas: resource_type enum, quantity (positive integer), location GeoJSON Point
// ---------------------------------------------------------------------
export const resourceSchemas = {
  resource: z.object({
    resourceType: z.enum(["medical", "food", "water", "shelter", "rescue_gear", "vehicle"]),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    location: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // lng
        z.number().min(-90).max(90),   // lat
      ]),
    }),
  }),
};

// ---------------------------------------------------------------------
// alertSchemas: severity enum, message (max 1000 chars), target_area GeoJSON Polygon
// ---------------------------------------------------------------------
export const alertSchemas = {
  create: z.object({
    severity: z.enum(["safe", "warning", "critical"]),
    message: z.string().max(1000, "Message cannot exceed 1000 characters"),
    district: z.string().min(1, "District is required"),
    targetArea: z
      .object({
        type: z.literal("Polygon"),
        coordinates: z.array(
          z.array(
            z.tuple([
              z.number().min(-180).max(180),
              z.number().min(-90).max(90),
            ])
          )
        ),
      })
      .optional(),
  }),
};

// ---------------------------------------------------------------------
// shelterSchemas: capacity (positive integer), occupancy (0-capacity), facilities array
// ---------------------------------------------------------------------
export const shelterSchemas = {
  shelter: z
    .object({
      name: z.string().min(1, "Shelter name is required"),
      capacity: z.number().int().positive("Capacity must be a positive integer"),
      occupancy: z.number().int().nonnegative("Occupancy cannot be negative"),
      facilities: z.array(z.string()),
      district: z.string().min(1, "District is required"),
    })
    .superRefine((data, ctx) => {
      if (data.occupancy > data.capacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["occupancy"],
          message: "Occupancy cannot exceed capacity",
        });
      }
    }),
};
