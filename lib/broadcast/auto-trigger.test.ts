// ---------------------------------------------------------------------
// lib/broadcast/auto-trigger.test.ts — Phase 7 · broadcast trigger
// automation rules engine (pure functions + spec constants).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTO_APPROVE_SECONDS,
  MAX_BROADCASTS_PER_MINUTE,
  buildApprovalMessage,
  buildApprovalRdsText,
  riskToSeverity,
  ruleFiresForSeverity,
} from "./auto-trigger";

describe("riskToSeverity — risk label normalisation", () => {
  it("maps Evacuate / critical to 'critical'", () => {
    expect(riskToSeverity("Evacuate")).toBe("critical");
    expect(riskToSeverity("critical")).toBe("critical");
    expect(riskToSeverity("  CRITICAL ")).toBe("critical");
  });

  it("maps Warning / high to 'warning'", () => {
    expect(riskToSeverity("Warning")).toBe("warning");
    expect(riskToSeverity("high")).toBe("warning");
  });

  it("returns null below the action threshold", () => {
    expect(riskToSeverity("Safe")).toBeNull();
    expect(riskToSeverity("Watch")).toBeNull();
    expect(riskToSeverity("low")).toBeNull();
    expect(riskToSeverity("moderate")).toBeNull();
    expect(riskToSeverity(null)).toBeNull();
    expect(riskToSeverity(undefined)).toBeNull();
    expect(riskToSeverity("")).toBeNull();
  });
});

describe("ruleFiresForSeverity — threshold logic", () => {
  it("a warning rule fires for both warning and critical", () => {
    expect(ruleFiresForSeverity("warning", "warning")).toBe(true);
    expect(ruleFiresForSeverity("warning", "critical")).toBe(true);
  });

  it("a critical rule fires only for critical", () => {
    expect(ruleFiresForSeverity("critical", "critical")).toBe(true);
    expect(ruleFiresForSeverity("critical", "warning")).toBe(false);
  });
});

describe("approval preview builders", () => {
  const input = { disasterType: "flood", district: "Patna", severity: "critical" as const };

  it("builds a voice script with a headline, description and instruction", () => {
    const message = buildApprovalMessage(input);
    expect(message.length).toBeGreaterThan(40);
    expect(message).toContain("Patna");
  });

  it("builds an RDS one-liner within the 64-char RDS limit", () => {
    const rdsText = buildApprovalRdsText(input);
    expect(rdsText.length).toBeLessThanOrEqual(64);
    expect(rdsText.length).toBeGreaterThan(10);
    expect(rdsText).toMatch(/PATNA/i);
  });
});

describe("spec constants", () => {
  it("caps broadcasts at 5 per minute", () => {
    expect(MAX_BROADCASTS_PER_MINUTE).toBe(5);
  });

  it("auto-approves after 3 minutes (180 s) by default", () => {
    expect(DEFAULT_AUTO_APPROVE_SECONDS).toBe(180);
  });
});
