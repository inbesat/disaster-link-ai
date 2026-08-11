// lib/mock-data/gov-alert-templates.test.ts — Phase 11 · Steps 3–4 ·
// Template library + mock translation invariants.

import { describe, expect, it } from "vitest";
import {
  ALERT_VARIABLE_SAMPLES,
  QUICK_ALERT_TEMPLATES,
  TRANSLATE_LANGS,
  detectTemplateId,
  extractTemplateVariables,
  splitByVariables,
  substituteVariables,
  translateAll,
  translateMessage,
} from "@/lib/mock-data/gov-alert-templates";

describe("gov-alert-templates", () => {
  it("hardcodes exactly the three SOP templates", () => {
    expect(QUICK_ALERT_TEMPLATES.map((t) => t.id)).toEqual([
      "flood",
      "evac",
      "all_clear",
    ]);
    expect(QUICK_ALERT_TEMPLATES[0].body).toContain("{river_name}");
    expect(QUICK_ALERT_TEMPLATES[0].body).toContain("{area}");
    expect(QUICK_ALERT_TEMPLATES[1].body).toContain("{shelter_name}");
  });

  it("extracts unique variables for highlighting", () => {
    expect(extractTemplateVariables(QUICK_ALERT_TEMPLATES[0].body)).toEqual([
      "river_name",
      "area",
    ]);
    expect(extractTemplateVariables("All Clear: Waters receding.")).toEqual([]);
  });

  it("splits into literal/variable segments without losing text", () => {
    const segments = splitByVariables("River {river_name} at {area} is high.");
    expect(segments.join("")).toBe("River {river_name} at {area} is high.");
    expect(segments.filter((s) => /^\{[a-z_]+\}$/.test(s))).toEqual([
      "{river_name}",
      "{area}",
    ]);
  });

  it("substitutes known variables and leaves unknown tokens intact", () => {
    expect(substituteVariables("{area} — {unknown}", ALERT_VARIABLE_SAMPLES)).toBe(
      "Danapur — {unknown}",
    );
  });

  it("detects the template a message was built from", () => {
    expect(detectTemplateId("Flood Warning: River Ganga crossing danger mark.")).toBe(
      "flood",
    );
    expect(detectTemplateId("Evacuation Order: Immediate evac required.")).toBe("evac");
    expect(detectTemplateId("All Clear: Waters receding.")).toBe("all_clear");
    expect(detectTemplateId("Power line down near Sector 4")).toBeNull();
  });

  it("translates a flood warning into all four languages", () => {
    const all = translateAll("Flood Warning: River {river_name} at {area}.");
    expect(all).not.toBeNull();
    expect(Object.keys(all!)).toEqual(["hi", "bn", "ta", "ml"]);
    expect(all!.hi).toContain("बाढ़");
    expect(all!.ml).toContain("മുന്നറിയിപ്പ്");
    // Sample variables substituted in.
    expect(all!.bn).toContain(ALERT_VARIABLE_SAMPLES.area);
  });

  it("returns null for messages that don't match a template", () => {
    expect(translateMessage("Road closed near Sector 4", "hi")).toBeNull();
    expect(translateAll("Random freeform text")).toBeNull();
  });

  it("exposes the four target languages for the tabbed preview", () => {
    expect(TRANSLATE_LANGS.map((l) => l.code)).toEqual(["hi", "bn", "ta", "ml"]);
  });
});
