import { afterEach, describe, expect, it } from "vitest";
import {
  targetLanguageName,
  translateAlertForSMS,
} from "./ai-translator";

const ALERT = "⚠️ CRITICAL: River level at danger mark — evacuate floodplain villages immediately.";

afterEach(() => {
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY_BACKUP;
});

describe("translateAlertForSMS", () => {
  it("returns the text verbatim when the target is English", async () => {
    expect(await translateAlertForSMS(ALERT, "en")).toBe(ALERT);
  });

  it("returns the text verbatim for the full name 'English'", async () => {
    expect(await translateAlertForSMS(ALERT, "English")).toBe(ALERT);
  });

  it("returns an empty string for empty input", async () => {
    expect(await translateAlertForSMS("", "hi")).toBe("");
  });

  it("falls back to the original text when no Groq key is configured", async () => {
    const result = await translateAlertForSMS(ALERT, "hi");
    expect(result).toBe(ALERT);
  });
});

describe("targetLanguageName", () => {
  it("maps codes to language names", () => {
    expect(targetLanguageName("hi")).toBe("Hindi");
    expect(targetLanguageName("ml")).toBe("Malayalam");
    expect(targetLanguageName("bn")).toBe("Bengali");
  });

  it("passes unknown codes through", () => {
    expect(targetLanguageName("xx")).toBe("xx");
  });

  it("handles case-insensitive input", () => {
    expect(targetLanguageName("HI")).toBe("Hindi");
  });
});
