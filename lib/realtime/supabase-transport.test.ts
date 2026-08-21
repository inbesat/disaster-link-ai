import { describe, expect, it, beforeEach } from "vitest";
import {
  SupabaseRealtimeTransport,
  sanitizeRealtimePayload,
} from "./supabase-transport";

describe("SupabaseRealtimeTransport Security", () => {
  beforeEach(() => {
    SupabaseRealtimeTransport.resetSubscriberCounts();
  });

  describe("sanitizeRealtimePayload", () => {
    it("strips sensitive fields (passwords, tokens, API keys)", () => {
      const raw = {
        id: "alert-123",
        title: "Evacuation Alert",
        password: "secretpassword123",
        token: "jwt.token.val",
        auth_token: "bearer-xyz",
        api_key: "key-12345",
      };

      const sanitized = sanitizeRealtimePayload(raw, "district_admin");

      expect(sanitized.id).toBe("alert-123");
      expect(sanitized.title).toBe("Evacuation Alert");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.auth_token).toBe("[REDACTED]");
      expect(sanitized.api_key).toBe("[REDACTED]");
    });

    it("anonymizes exact coordinates for public users", () => {
      const raw = {
        id: "loc-1",
        lat: 25.594082,
        lng: 85.137566,
        shelterName: "Central School",
      };

      const sanitizedPublic = sanitizeRealtimePayload(raw, "public");
      expect(sanitizedPublic.lat).toBe(25.59);
      expect(sanitizedPublic.lng).toBe(85.14);

      const sanitizedAdmin = sanitizeRealtimePayload(raw, "district_admin");
      expect(sanitizedAdmin.lat).toBe(25.594082);
      expect(sanitizedAdmin.lng).toBe(85.137566);
    });
  });

  describe("verifyChannelAccess & subscription security", () => {
    it("denies subscription for unauthenticated user", () => {
      const transport = new SupabaseRealtimeTransport("alerts", {
        districtId: "patna",
      });

      expect(transport.verifyChannelAccess()).toBe(false);
    });

    it("allows super_admin to access any district channel", () => {
      const transport = new SupabaseRealtimeTransport("alerts", {
        districtId: "patna",
        user: { id: "admin-1", role: "super_admin" },
      });

      expect(transport.verifyChannelAccess()).toBe(true);
    });

    it("allows user matching districtId", () => {
      const transport = new SupabaseRealtimeTransport("alerts", {
        districtId: "patna",
        user: { id: "user-1", role: "district_admin", districtId: "patna" },
      });

      expect(transport.verifyChannelAccess()).toBe(true);
    });

    it("denies user with non-matching districtId", () => {
      const transport = new SupabaseRealtimeTransport("alerts", {
        districtId: "patna",
        user: { id: "user-2", role: "district_admin", districtId: "gaya" },
      });

      expect(transport.verifyChannelAccess()).toBe(false);
    });
  });
});
