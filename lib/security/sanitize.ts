// ---------------------------------------------------------------------
// lib/security/sanitize.ts — Phase 21 (Security, Privacy & Data Isolation)
//
// Two defense utilities for citizen-submitted text:
//
//   sanitizeInput(text)   — XSS defense-in-depth: strips <script>/<iframe>
//                           blocks, dangerous tags, inline event handlers
//                           (onload=…), and javascript: URLs. React already
//                           escapes rendered text; this protects stored data
//                           and any non-React consumer (API responses, export).
//
//   anonymizePII(text)    — replaces phone numbers and email addresses with
//                           [REDACTED] so citizen reports never surface PII
//                           on the public dashboard.
//
//   redactReportText(text) — sanitize + anonymize in one call (display path).
// ---------------------------------------------------------------------

// Whole-element blocks — remove the element AND its content. The backreference
// \1 matches the closing tag of the same element name.
const BLOCK_TAG_PATTERN =
  /<\s*\/?\s*(script|iframe|object|embed|style|noscript|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

// <a href="javascript:…">…</a> anchors — remove the whole element incl. text.
// Runs before DANGEROUS_TAG_PATTERN so the anchor body is not left behind.
const JAVASCRIPT_ANCHOR_BLOCK_PATTERN =
  /<\s*a\s[^>]*\bhref\s*=\s*("|')\s*javascript:[^"']*\1[^>]*>[\s\S]*?<\s*\/\s*a\s*>/gi;

// Any remaining dangerous open/close tags (case-insensitive), incl. unclosed
// or self-closing forms like <script src=…> or <img onerror=…>.
const DANGEROUS_TAG_PATTERN =
  /<\s*\/?\s*(script|iframe|object|embed|svg|style|link|meta|form|noscript|img|a)(\s[^>]*)?\/?>/gi;

// Inline event handlers: onload=, onclick=, onerror=, onmouseover=, …
// Handles double-quoted, single-quoted and bare attribute values.
const EVENT_HANDLER_PATTERN = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

// javascript: URLs smuggled through href/src/action/xlink:href.
const JAVASCRIPT_URL_PATTERN =
  /\b(href|src|action|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

/**
 * Strip XSS vectors from untrusted text: <script>/<iframe> blocks (content
 * included), dangerous tags, event handlers, and javascript: URLs. Plain text
 * (including comparisons like "5 < 10") is left untouched.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  let out = String(text);
  out = out.replace(BLOCK_TAG_PATTERN, "");
  out = out.replace(JAVASCRIPT_ANCHOR_BLOCK_PATTERN, "");
  out = out.replace(DANGEROUS_TAG_PATTERN, "");
  out = out.replace(EVENT_HANDLER_PATTERN, "");
  out = out.replace(JAVASCRIPT_URL_PATTERN, "");
  // Collapse the runs of spaces left where a tag used to sit.
  out = out.replace(/ {2,}/g, " ");
  return out.trim();
}

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Phone shapes (Indian + international mobile):
//   1. 9876543210 / +91 9876543210 / +919876543210
//   2. 987-654-3210 / +91 987-654-3210 (explicit separators)
//   3. 987 654 3210 / +1 415 555 2671 (general 3-3-4 with optional country code)
// The patterns use a non-word lookbehind (a plain \b fails before "+") and a
// trailing (?!\d) guard, and always require 10 digits — so GIS coordinates
// like "25.612, 85.142" are never matched and 11-digit IDs are not mangled.
const PHONE_PATTERNS = [
  // 5-5 grouping, the common Indian form: +91-98765-43210 / 98765 43210
  /(?<![\w])(?:\+?91[\s-]?)?\d{5}[\s-]\d{5}(?!\d)/g,
  // Unbroken 10 digits: 9876543210 / +91 9876543210 / +919876543210
  /(?<![\w])(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/g,
  // Explicit 3-3-4 separators: 987-654-3210 / +91 987-654-3210
  /(?<![\w])(?:\+?91[\s-]?)?[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}(?!\d)/g,
  // General 3-3-4 with optional country code: 987 654 3210 / +1 415 555 2671
  /(?<![\w])(?:\+\d{1,3}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g,
];

/**
 * Replace phone numbers and email addresses with [REDACTED] so PII never
 * reaches the public dashboard.
 */
export function anonymizePII(text: string): string {
  if (!text) return "";
  let out = String(text).replace(EMAIL_PATTERN, "[REDACTED]");
  for (const pattern of PHONE_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}

/** Display-path helper: anonymize PII first, then strip any XSS vectors. */
export function redactReportText(text: string): string {
  return sanitizeInput(anonymizePII(text));
}

// ---------------------------------------------------------------------
// sanitizeShelterForPublic — Step 4/6 · Public API field allow-list.
//
// The shelters table is shared by both modes (Phase 12 cross-mode bridge):
// PUBLIC = name, location, capacity, occupancy, facilities (amenities are
// exactly what a citizen needs to pick a shelter); GOV-ONLY = contact_person,
// phone, operational_notes — the latter withheld here at the API layer.
// RLS (0020) already permits anon SELECTs at the row level, so this
// allow-list is the actual column-level enforcement boundary for the
// public endpoint; the gov endpoint returns the full row untouched.
// ---------------------------------------------------------------------

export type PublicSafeShelter = {
  id: string;
  name: string;
  district: string | null;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status: string;
  /** Amenity flags { water, food, medical, … } — public, like the map chips. */
  facilities?: Record<string, boolean> | null;
  imageUrl?: string | null;
  updatedAt?: Date;
};

/**
 * Input shape for the shelter sanitizer: same as the public output but the
 * `facilities` column arrives as Prisma `JsonValue`, so it is accepted as
 * `unknown` and normalized below.
 */
export type ShelterRowInput = Omit<PublicSafeShelter, "facilities"> & {
  facilities?: unknown;
};

/**
 * Coerce the JSON `facilities` column into a boolean amenity map. Anything
 * that is not a plain object (or any non-boolean value inside it) is
 * dropped, so a malformed gov-stored value can never leak into the public
 * payload as a string/array.
 */
function normalizeFacilities(value: unknown): Record<string, boolean> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(value)) {
    if (typeof flag === "boolean") out[key] = flag;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Pick only the citizen-safe fields off a shelter row. Gov-only columns
 * (contactPerson, phone, operationalNotes) are dropped; the display name is
 * run through sanitizeInput and facilities normalized to a boolean map as
 * defense-in-depth.
 */
export function sanitizeShelterForPublic(shelter: ShelterRowInput): PublicSafeShelter {
  return {
    id: shelter.id,
    name: sanitizeInput(shelter.name),
    district: shelter.district,
    lat: shelter.lat,
    lng: shelter.lng,
    capacity: shelter.capacity,
    currentOccupancy: shelter.currentOccupancy,
    status: shelter.status,
    facilities: normalizeFacilities(shelter.facilities),
    imageUrl: shelter.imageUrl ?? null,
    updatedAt: shelter.updatedAt,
  };
}

// ---------------------------------------------------------------------
// sanitizePredictionForPublic / sanitizeAlertForPublic — Step 4 · the rest
// of the cross-mode scrubber. Same idea as the shelter allow-list: the
// shared tables carry gov-only columns that RLS permits anon to read at the
// row level, so the public endpoints strip them here.
// ---------------------------------------------------------------------

export type PublicSafePrediction = {
  id: string;
  lat: number;
  lng: number;
  predictionTimestamp: Date;
  riskLevel: string;
  createdAt?: Date;
};

/**
 * Pick only the citizen-safe fields off a flood prediction row. The raw ML
 * payload (raw_model_output) and model confidence (confidence_score) are
 * gov-only and never leave the public endpoint.
 */
export function sanitizePredictionForPublic(
  prediction: PublicSafePrediction,
): PublicSafePrediction {
  return {
    id: prediction.id,
    lat: prediction.lat,
    lng: prediction.lng,
    predictionTimestamp: prediction.predictionTimestamp,
    riskLevel: prediction.riskLevel,
    createdAt: prediction.createdAt,
  };
}

export type PublicSafeAlert = {
  id: string;
  severity: string;
  message: string;
  district: string | null;
  sentAt: Date;
  createdAt?: Date;
};

/**
 * Pick only the citizen-safe fields off an alert row. Hides internal
 * delivery stats (channel) and composer details (trigger_condition, ack
 * state, internal FK). The message is XSS-stripped as defense-in-depth
 * (no PII redaction — gov alerts intentionally carry helpline numbers).
 */
export function sanitizeAlertForPublic(alert: PublicSafeAlert): PublicSafeAlert {
  return {
    id: alert.id,
    severity: alert.severity,
    message: sanitizeInput(alert.message),
    district: alert.district,
    sentAt: alert.sentAt,
    createdAt: alert.createdAt,
  };
}
