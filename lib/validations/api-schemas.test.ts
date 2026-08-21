import { describe, expect, it } from "vitest";
import {
  alertSchemas,
  authSchemas,
  disasterSchemas,
  resourceSchemas,
  shelterSchemas,
} from "./api-schemas";
import { sanitizeFilename, sanitizeInput, validateSqlColumn } from "@/lib/security/sanitize";

describe("api-schemas Zod validation", () => {
  it("validates signup schema correctly", () => {
    const valid = authSchemas.signup.safeParse({
      email: "official@ndrf.gov.in",
      password: "Password123!",
      role: "district_admin",
    });
    expect(valid.success).toBe(true);

    const invalid = authSchemas.signup.safeParse({
      email: "invalid-email",
      password: "short",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates disaster schema coordinate bounds", () => {
    const valid = disasterSchemas.disasterEvent.safeParse({
      districtId: "dist_patna",
      riskLevel: "critical",
      coordinates: { lat: 25.6, lng: 85.1 },
    });
    expect(valid.success).toBe(true);

    const invalidLat = disasterSchemas.disasterEvent.safeParse({
      districtId: "dist_patna",
      riskLevel: "critical",
      coordinates: { lat: 100, lng: 85.1 },
    });
    expect(invalidLat.success).toBe(false);
  });

  it("validates shelter capacity and occupancy constraint", () => {
    const valid = shelterSchemas.shelter.safeParse({
      name: "Patna Central High Shelter",
      capacity: 500,
      occupancy: 200,
      facilities: ["water", "medical"],
      district: "Patna",
    });
    expect(valid.success).toBe(true);

    const invalidOccupancy = shelterSchemas.shelter.safeParse({
      name: "Patna Central High Shelter",
      capacity: 500,
      occupancy: 600, // exceeds capacity
      facilities: ["water"],
      district: "Patna",
    });
    expect(invalidOccupancy.success).toBe(false);
  });

  it("validates alert creation max length", () => {
    const valid = alertSchemas.create.safeParse({
      severity: "warning",
      message: "Evacuate low-lying areas in Patna immediately.",
      district: "Patna",
    });
    expect(valid.success).toBe(true);

    const tooLong = alertSchemas.create.safeParse({
      severity: "warning",
      message: "a".repeat(1001),
      district: "Patna",
    });
    expect(tooLong.success).toBe(false);
  });

  it("validates resource allocation schema", () => {
    const valid = resourceSchemas.resource.safeParse({
      resourceType: "water",
      quantity: 100,
      location: {
        type: "Point",
        coordinates: [85.1, 25.6],
      },
    });
    expect(valid.success).toBe(true);
  });
});

describe("XSS and SQL security helpers", () => {
  it("sanitizes HTML tags from user inputs", () => {
    const clean = sanitizeInput("<script>alert(1)</script>Emergency Alert");
    expect(clean).toBe("Emergency Alert");
  });

  it("sanitizes uploaded filenames", () => {
    const safeName = sanitizeFilename("../../../etc/passwd<script>.png");
    expect(safeName).toBe("______etc_passwd_script_.png");
  });

  it("validates allowed SQL column names for order/filter", () => {
    const allowed = ["createdAt", "severity", "district"] as const;
    expect(validateSqlColumn("createdAt", allowed)).toBe("createdAt");
    expect(() => validateSqlColumn("user_input; DROP TABLE users;", allowed)).toThrow();
  });
});
