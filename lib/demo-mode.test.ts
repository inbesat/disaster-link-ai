import { describe, expect, it } from "vitest";
import { isDemoMode } from "./demo-mode";

describe("isDemoMode", () => {
  it("returns true when NEXT_PUBLIC_DEMO_MODE is 'true'", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
  });

  it("returns false for any other value", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    expect(isDemoMode()).toBe(false);

    process.env.NEXT_PUBLIC_DEMO_MODE = "1";
    expect(isDemoMode()).toBe(false);
  });

  it("returns false when the variable is unset", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    expect(isDemoMode()).toBe(false);
  });
});
