// Phase 21 — sanitization & PII anonymization tests: XSS vector stripping,
// phone/email redaction, coordinate safety, and innocent-text preservation.
import { describe, it, expect } from "vitest";
import { sanitizeInput, anonymizePII, redactReportText } from "./sanitize";

describe("sanitizeInput (XSS prevention)", () => {
  it("removes a full <script> block including its payload", () => {
    expect(sanitizeInput("<script>alert(1)</script>Water rising")).toBe("Water rising");
  });

  it("removes an <iframe> block", () => {
    expect(
      sanitizeInput("Road blocked <iframe src=\"https://evil.example\"></iframe> now"),
    ).toBe("Road blocked now");
  });

  it("is case-insensitive against obfuscated tags", () => {
    expect(sanitizeInput("<ScRiPt>alert(1)</ScRiPt>")).toBe("");
    expect(sanitizeInput("<IFRAME>payload</IFRAME>")).toBe("");
  });

  it("strips inline event handlers (onload=, onerror=, …)", () => {
    expect(sanitizeInput('<img src="x" onload="alert(1)">flood')).toBe("flood");
    // Non-dangerous tags are neutralized (handler removed) and left as inert
    // text — React escapes them, so they cannot execute.
    expect(sanitizeInput("<div onclick='evil()'>text</div>")).toBe("<div>text</div>");
    expect(sanitizeInput('<p onmouseover=alert(1)>hi</p>')).toBe("<p>hi</p>");
  });

  it("removes javascript: URLs from href/src attributes", () => {
    expect(sanitizeInput('<a href="javascript:alert(1)">link</a> flood')).toBe("flood");
  });

  it("removes unclosed dangerous tags (no closing tag provided)", () => {
    expect(sanitizeInput("Water <script>alert(1) rising")).toBe("Water alert(1) rising");
  });

  it("leaves normal citizen text and innocent angle brackets intact", () => {
    expect(sanitizeInput("Pani ghar me aa raha hai Rajendra Nagar")).toBe(
      "Pani ghar me aa raha hai Rajendra Nagar",
    );
    // "5 < 10" is a comparison, not a tag — must survive.
    expect(sanitizeInput("depth 5 < 10 meters")).toBe("depth 5 < 10 meters");
  });
});

describe("anonymizePII", () => {
  it("redacts Indian mobile numbers in common formats", () => {
    expect(anonymizePII("Call 9876543210 now")).toBe("Call [REDACTED] now");
    expect(anonymizePII("Reach +91 9876543210")).toBe("Reach [REDACTED]");
    expect(anonymizePII("Contact +91-98765-43210")).toBe("Contact [REDACTED]");
    expect(anonymizePII("SMS 987 654 3210 please")).toBe("SMS [REDACTED] please");
  });

  it("redacts international numbers with a country code", () => {
    expect(anonymizePII("Call +1 415 555 2671")).toBe("Call [REDACTED]");
  });

  it("redacts email addresses including tagged/domain-suffixed forms", () => {
    expect(anonymizePII("Email me@example.com now")).toBe("Email [REDACTED] now");
    expect(anonymizePII("reach john.doe+tag@sub.example.co.in")).toBe(
      "reach [REDACTED]",
    );
  });

  it("redacts both phone and email in one string", () => {
    expect(anonymizePII("9998887776 and rescue@bihar.gov.in")).toBe(
      "[REDACTED] and [REDACTED]",
    );
  });

  it("never redacts GIS coordinates (incl. 4-decimal precision)", () => {
    expect(anonymizePII("Flood at 25.612, 85.142")).toBe("Flood at 25.612, 85.142");
    expect(anonymizePII("lat 25.612 lng 85.142")).toBe("lat 25.612 lng 85.142");
    expect(anonymizePII("At 25.5941, 85.1376")).toBe("At 25.5941, 85.1376");
  });

  it("does not mangle long numeric IDs (the (?!\\d) guard)", () => {
    expect(anonymizePII("case id 98765432101")).toBe("case id 98765432101");
  });

  it("leaves plain text without PII untouched", () => {
    expect(anonymizePII("Pani ghar me aa raha hai")).toBe("Pani ghar me aa raha hai");
  });
});

describe("redactReportText (combined display path)", () => {
  it("anonymizes PII and strips XSS in one pass", () => {
    expect(
      redactReportText(
        "<script>hack</script>Call 9876543210 or me@example.com for help",
      ),
    ).toBe("Call [REDACTED] or [REDACTED] for help");
  });

  it("preserves coordinate data while redacting PII", () => {
    expect(redactReportText("At 25.612, 85.142 — call 9876543210")).toBe(
      "At 25.612, 85.142 — call [REDACTED]",
    );
  });
});
