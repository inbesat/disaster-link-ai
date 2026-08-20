import { describe, expect, it } from "vitest";
import { safeParseJSON } from "./utils";

describe("safeParseJSON", () => {
  it("returns fallback for null, undefined, or empty string", () => {
    expect(safeParseJSON(null)).toBeNull();
    expect(safeParseJSON(undefined)).toBeNull();
    expect(safeParseJSON("")).toBeNull();
    expect(safeParseJSON("   ")).toBeNull();
    expect(safeParseJSON(null, { default: true })).toEqual({ default: true });
  });

  it("parses valid JSON string successfully", () => {
    expect(safeParseJSON('{"a": 1}')).toEqual({ a: 1 });
    expect(safeParseJSON("[1, 2, 3]")).toEqual([1, 2, 3]);
    expect(safeParseJSON("true")).toBe(true);
    expect(safeParseJSON("123")).toBe(123);
  });

  it("returns fallback for malformed JSON string without throwing", () => {
    expect(safeParseJSON("{invalid json}")).toBeNull();
    expect(safeParseJSON("{invalid json}", "fallback")).toBe("fallback");
  });
});
