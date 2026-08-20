import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("env parser", () => {
  it("parses valid env schema without throwing", () => {
    const parsed = parseEnv();
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });
});
