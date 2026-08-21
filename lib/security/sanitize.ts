// ---------------------------------------------------------------------
// lib/security/sanitize.ts — Phase 21 (Security, Privacy & Data Isolation)
//
// Defense utilities for citizen-submitted text, file upload names, and SQL column whitelisting:
//
//   sanitizeInput(text)       — XSS defense-in-depth: strips <script>/<iframe>
//                               blocks, dangerous tags, inline event handlers
//                               (onload=…), and javascript: URLs.
//   anonymizePII(text)        — replaces phone numbers and email addresses with [REDACTED].
//   redactReportText(text)    — sanitize + anonymize in one call (display path).
//   sanitizeFilename(name)    — strips dangerous characters from uploaded filenames.
//   validateSqlColumn(col, allowed) — Whitelists column names for dynamic queries.
// ---------------------------------------------------------------------

// Whole-element blocks — remove the element AND its content.
const BLOCK_TAG_PATTERN =
  /<\s*\/?\s*(script|iframe|object|embed|style|noscript|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

// <a href="javascript:…">…</a> anchors — remove the whole element incl. text.
const JAVASCRIPT_ANCHOR_BLOCK_PATTERN =
  /<\s*a\s[^>]*\bhref\s*=\s*("|')\s*javascript:[^"']*\1[^>]*>[\s\S]*?<\s*\/\s*a\s*>/gi;

// Any remaining dangerous open/close tags.
const DANGEROUS_TAG_PATTERN =
  /<\s*\/?\s*(script|iframe|object|embed|svg|style|link|meta|form|noscript|img|a)(\s[^>]*)?\/?>/gi;

// Inline event handlers: onload=, onclick=, onerror=, onmouseover=, …
const EVENT_HANDLER_PATTERN = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

// javascript: URLs smuggled through href/src/action/xlink:href.
const JAVASCRIPT_URL_PATTERN =
  /\b(href|src|action|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

/**
 * Strip XSS vectors from untrusted text.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  let out = String(text);
  out = out.replace(BLOCK_TAG_PATTERN, "");
  out = out.replace(JAVASCRIPT_ANCHOR_BLOCK_PATTERN, "");
  out = out.replace(DANGEROUS_TAG_PATTERN, "");
  out = out.replace(EVENT_HANDLER_PATTERN, "");
  out = out.replace(JAVASCRIPT_URL_PATTERN, "");
  out = out.replace(/ {2,}/g, " ");
  return out.trim();
}

/**
 * Sanitize file upload names to prevent path traversal or inline script execution in filenames.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";
  return filename
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(0, 100);
}

/**
 * SQL Column Whitelisting helper to prevent SQL injection in dynamic order/filter parameters.
 */
export function validateSqlColumn(column: string, allowedColumns: readonly string[]): string {
  if (allowedColumns.includes(column)) {
    return column;
  }
  throw new Error(`Invalid column name for query: ${column}`);
}

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const PHONE_PATTERNS = [
  /(?<![\w])(?:\+?91[\s-]?)?\d{5}[\s-]\d{5}(?!\d)/g,
  /(?<![\w])(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/g,
  /(?<![\w])(?:\+?91[\s-]?)?[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}(?!\d)/g,
  /(?<![\w])(?:\+\d{1,3}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g,
];

/**
 * Replace phone numbers and email addresses with [REDACTED].
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
// Public API field allow-list helpers
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
  facilities?: Record<string, boolean> | null;
  imageUrl?: string | null;
  updatedAt?: Date;
};

export type ShelterRowInput = Omit<PublicSafeShelter, "facilities"> & {
  facilities?: unknown;
};

function normalizeFacilities(value: unknown): Record<string, boolean> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(value)) {
    if (typeof flag === "boolean") out[key] = flag;
  }
  return Object.keys(out).length > 0 ? out : null;
}

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

export type PublicSafePrediction = {
  id: string;
  lat: number;
  lng: number;
  predictionTimestamp: Date;
  riskLevel: string;
  createdAt?: Date;
};

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
