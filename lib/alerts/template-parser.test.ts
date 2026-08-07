// Phase 7 — alert notification layer tests: template rendering and
// variable handling so message bodies never break during a demo.
import { describe, it, expect } from "vitest";
import {
  parseAlertTemplate,
  extractTemplateVariables,
  UNKNOWN_VALUE,
} from "./template-parser";

describe("parseAlertTemplate (Phase 7)", () => {
  it("renders a template substituting all {variables}", () => {
    const result = parseAlertTemplate(
      "⚠️ {risk_level} {disaster_type} warning for {district} at {predicted_time}.",
      {
        risk_level: "Critical",
        disaster_type: "flood",
        district: "Patna",
        predicted_time: "today",
      },
    );
    expect(result).toBe("⚠️ Critical flood warning for Patna at today.");
  });

  it("falls back missing variables to a safe placeholder", () => {
    const result = parseAlertTemplate("{district} — zones: {evacuation_zones}", {
      district: "Patna",
    });
    expect(result).toBe(`Patna — zones: ${UNKNOWN_VALUE}`);
  });

  it("treats empty-string values as unknown but keeps 0 and false", () => {
    const result = parseAlertTemplate("count={count} flag={flag} empty={empty}", {
      count: 0,
      flag: false,
      empty: "",
    });
    expect(result).toBe(`count=0 flag=false empty=${UNKNOWN_VALUE}`);
  });

  it("returns an empty string for an empty template", () => {
    expect(parseAlertTemplate("")).toBe("");
    expect(parseAlertTemplate("", { district: "Patna" })).toBe("");
  });

  it("leaves text without variables untouched", () => {
    expect(parseAlertTemplate("All clear.", { district: "Patna" })).toBe("All clear.");
  });
});

describe("extractTemplateVariables (Phase 7)", () => {
  it("returns the unique {variable} names in a template", () => {
    const vars = extractTemplateVariables("{district} {district} {risk_level}");
    expect(vars.sort()).toEqual(["district", "risk_level"]);
  });

  it("returns an empty array for a template with no variables", () => {
    expect(extractTemplateVariables("no tokens here")).toEqual([]);
  });
});
