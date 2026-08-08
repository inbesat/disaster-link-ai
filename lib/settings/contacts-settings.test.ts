import { describe, expect, it } from "vitest";
import {
  cloneDefaultContactSettings,
  DEFAULT_CHANNEL_PRIORITY,
  DEFAULT_GPS_INJECTION,
  DEFAULT_MESSAGE_TEMPLATES,
  mergeContactSettings,
} from "./contacts-settings";

// ---------------------------------------------------------------------
// lib/settings/contacts-settings.test.ts — Contacts (Phase 7 · Step 10).
//
// Verifies the merge/sanitize layer protecting the contacts snapshot
// (channel failover order, GPS injection toggles, SOS message templates)
// so corrupt or partial localStorage never breaks the /settings/contacts
// page.
// ---------------------------------------------------------------------

describe("mergeContactSettings", () => {
  it("returns shipped defaults for null / junk input", () => {
    expect(mergeContactSettings(null)).toEqual(cloneDefaultContactSettings());
    expect(mergeContactSettings("corrupt")).toEqual(
      cloneDefaultContactSettings(),
    );
    expect(mergeContactSettings(42).channelPriority).toHaveLength(4);
  });

  it("preserves a custom failover order", () => {
    const merged = mergeContactSettings({
      channelPriority: [
        { id: "voice", name: "Automated Voice Call", hint: "x" },
        { id: "email", name: "Email", hint: "x" },
        { id: "sms", name: "SMS", hint: "x" },
        { id: "whatsapp", name: "WhatsApp", hint: "x" },
      ],
    });
    expect(merged.channelPriority.map((c) => c.id)).toEqual([
      "voice",
      "email",
      "sms",
      "whatsapp",
    ]);
  });

  it("drops duplicate + unknown channel ids and re-appends missing defaults", () => {
    const merged = mergeContactSettings({
      channelPriority: [
        { id: "sms", name: "SMS", hint: "x" },
        { id: "sms", name: "SMS (dup)", hint: "x" },
        { id: "pager", name: "Pager", hint: "x" },
      ],
    });
    const ids = merged.channelPriority.map((c) => c.id);
    // no duplicates, no junk, but all four channels still present
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("sms");
    expect(ids).toContain("whatsapp");
    expect(ids).toContain("voice");
    expect(ids).toContain("email");
    expect(ids.filter((id) => id === "sms")).toHaveLength(1);
  });

  it("sanitizes GPS injection booleans with fallbacks", () => {
    expect(mergeContactSettings(null).gpsInjection).toEqual(
      DEFAULT_GPS_INJECTION,
    );
    const merged = mergeContactSettings({
      gpsInjection: { enabled: false, tracking60: "yes" },
    });
    expect(merged.gpsInjection.enabled).toBe(false);
    expect(merged.gpsInjection.tracking60).toBe(true); // invalid → default
  });

  it("sanitizes message templates and falls back to defaults when empty", () => {
    expect(mergeContactSettings({ messageTemplates: [] }).messageTemplates).toEqual(
      DEFAULT_MESSAGE_TEMPLATES,
    );
    const merged = mergeContactSettings({
      messageTemplates: [
        { id: "custom", name: "Custom", emoji: "📢", text: "Hello {location}" },
        { name: 42, text: "no id" },
      ],
    });
    expect(merged.messageTemplates).toHaveLength(2);
    expect(merged.messageTemplates[0].id).toBe("custom");
    expect(merged.messageTemplates[0].text).toBe("Hello {location}");
    // missing id gets a stable fallback; non-string fields are dropped
    expect(merged.messageTemplates[1].id).toBe("tpl-2");
    expect(merged.messageTemplates[1].name).toBe("Template 2");
  });

  it("keeps the default failover order intact when only other sections change", () => {
    const merged = mergeContactSettings({
      gpsInjection: { enabled: false, tracking60: false },
    });
    expect(merged.channelPriority.map((c) => c.id)).toEqual(
      DEFAULT_CHANNEL_PRIORITY.map((c) => c.id),
    );
    expect(merged.gpsInjection).toEqual({ enabled: false, tracking60: false });
  });
});
