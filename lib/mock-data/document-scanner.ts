// ---------------------------------------------------------------------
// lib/mock-data/document-scanner.ts — Phase 6 · Step 9 · Local OCR
// Document Scanner (mock Tesseract).
//
// Citizens need digital copies of their Aadhaar/ID cards if the physical
// ones are washed away — but cloud OCR APIs cost money and need internet.
// Real tesseract.js runs fully in the browser (no API, no server):
//
//     npm install tesseract.js
//
//     import Tesseract from "tesseract.js";
//     const { data } = await Tesseract.recognize(image, "eng+hin");
//
// The swap-in below mimics that exact call signature with a deterministic
// mock result, so the UI proves the whole flow — capture → recognize →
// save locally — with zero network and zero cost. Swap `mockOcrRecognize`
// for the real `Tesseract.recognize` later without touching the UI.
//
// The extracted fields are persisted to localStorage (guarded, SSR-safe)
// so a scanned ID survives reloads — same pattern as the SOS/safe-status
// helpers in public-alerts.ts.
// ---------------------------------------------------------------------

/** Fields the scanner extracts from a captured ID. */
export type ScannedIdFields = {
  /** Document holder name. */
  name: string;
  /** Masked document number, e.g. "XXXX-XXXX-1234". */
  documentNumber: string;
  /** Date of birth label, e.g. "12 Mar 1994". */
  dateOfBirth: string;
};

/** Shape mirrors what tesseract.js resolves — the mock's `recognize`. */
export type OcrResult = {
  /** Raw recognized text block. */
  text: string;
  /** 0–100 recognition confidence. */
  confidence: number;
  /** Structured fields parsed from the text. */
  fields: ScannedIdFields;
};

/** The mock document the demo "reads" (the demo citizen of Patna). */
const MOCK_ID = {
  name: "Priya Sharma",
  documentNumber: "XXXX-XXXX-1234",
  dateOfBirth: "12 Mar 1994",
};

/**
 * Mock Tesseract.recognize() — runs locally, instantly, for free. Accepts
 * the image source and returns a deterministic, typed result. `imageName`
 * is ignored by the mock but keeps the swap-in signature honest.
 */
export function mockOcrRecognize(
  _image: string | Blob,
  _imageName?: string,
): OcrResult {
  // The mock ignores the input; reference it so the swap-in signature stays
  // honest without tripping no-unused-vars.
  void _image;
  void _imageName;
  return {
    text: [
      "Government of India",
      "Name: Priya Sharma",
      "Date of Birth: 12 Mar 1994",
      "Document Number: XXXX-XXXX-1234",
      "Gender: Female",
    ].join("\n"),
    confidence: 97.4,
    fields: { ...MOCK_ID },
  };
}

/** localStorage key for the last scanned ID. */
export const SCANNED_ID_KEY = "drip:scanned-id";

/** SSR-safe read of the saved scanned ID; null when absent/corrupt. */
export function readScannedId(): ScannedIdFields | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SCANNED_ID_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScannedIdFields>;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.documentNumber === "string" &&
      typeof parsed.dateOfBirth === "string"
    ) {
      return parsed as ScannedIdFields;
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist a scanned ID (guarded, never throws). */
export function writeScannedId(fields: ScannedIdFields): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCANNED_ID_KEY, JSON.stringify(fields));
  } catch {
    // storage unavailable — the scan just won't persist
  }
}

export default mockOcrRecognize;
