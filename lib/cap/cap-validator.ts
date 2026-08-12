// ---------------------------------------------------------------------
// lib/cap/cap-validator.ts — Phase 3 · CAP 1.2 validation.
//
// Enforces the CAP 1.2 mandatory-field rules before a message is stored
// or dispatched. Because the deployment must stay dependency-free (no
// native C++ bindings like libxmljs2 — they crash Vercel builds), the
// primary check is structural: required elements at the alert + info
// level, enum membership (status/msgType/scope/category/urgency/
// severity/certainty), well-formed geometry, and coherent timestamp
// ordering (sent <= effective < expires).
//
// validateCapXml() uses the pure-JS validateCAP() helper — regex/tag
// matching only, zero runtime dependencies.
// ---------------------------------------------------------------------

import { CAP_NAMESPACE } from "./cap-builder";
import type { CapInfo } from "./types";

export interface CapValidationResult {
  ok: boolean;
  errors: string[];
}

/** Result shape for the pure-JS XML validator. */
export interface CapXmlValidation {
  isValid: boolean;
  errors: string[];
}

/** Alert-level fields as loose strings so bad values are detectable. */
export interface CapAlertLike {
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  scope: string;
  infos: CapInfo[];
}

const MSG_TYPES = ["Alert", "Update", "Cancel", "Ack", "Error"];
const SCOPES = ["Public", "Restricted", "Private"];
const STATUSES = ["Actual", "Exercise", "System", "Test", "Draft"];
const CATEGORIES = [
  "Geo",
  "Met",
  "Safety",
  "Security",
  "Rescue",
  "Fire",
  "Health",
  "Env",
  "Transport",
  "Infra",
  "CBRNE",
  "Other",
];
const URGENCIES = ["Immediate", "Expected", "Future", "Past", "Unknown"];
const SEVERITIES = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
const CERTAINTIES = ["Observed", "Likely", "Possible", "Unlikely", "Unknown"];

/** Human-readable label for the CAP XSD element so errors read well. */
function typeLabel(value: unknown): string {
  if (typeof value !== "string") return "missing";
  return value.length > 60 ? `${value.slice(0, 57)}…` : value;
}

/** Validate a single CAP <info> block's mandatory fields. */
function validateInfo(info: CapInfo, index: number): string[] {
  const prefix = `info[${index}]`;
  const errors: string[] = [];

  if (!info.language) errors.push(`${prefix}.language is required`);
  if (!CATEGORIES.includes(info.category)) {
    errors.push(`${prefix}.category "${typeLabel(info.category)}" is not a valid CAP category`);
  }
  if (!info.event.trim()) errors.push(`${prefix}.event is required`);
  if (!URGENCIES.includes(info.urgency)) {
    errors.push(`${prefix}.urgency "${typeLabel(info.urgency)}" is not a valid CAP urgency`);
  }
  if (!SEVERITIES.includes(info.severity)) {
    errors.push(`${prefix}.severity "${typeLabel(info.severity)}" is not a valid CAP severity`);
  }
  if (!CERTAINTIES.includes(info.certainty)) {
    errors.push(`${prefix}.certainty "${typeLabel(info.certainty)}" is not a valid CAP certainty`);
  }
  if (!info.effective) errors.push(`${prefix}.effective is required`);
  if (!info.expires) errors.push(`${prefix}.expires is required`);
  if (!info.senderName.trim()) errors.push(`${prefix}.senderName is required`);
  if (!info.headline.trim()) errors.push(`${prefix}.headline is required`);
  if (!info.description.trim()) errors.push(`${prefix}.description is required`);
  if (info.instruction && !info.instruction.trim()) {
    errors.push(`${prefix}.instruction must not be blank when present`);
  }

  if (!info.areas.length) {
    errors.push(`${prefix}.area is required — an alert must name its affected area`);
  }
  info.areas.forEach((area, areaIndex) => {
    if (!area.areaDesc.trim()) {
      errors.push(`${prefix}.area[${areaIndex}].areaDesc is required`);
    }
    if (area.polygon && area.circle) {
      errors.push(`${prefix}.area[${areaIndex}] must use either polygon OR circle, not both`);
    }
    if (area.polygon && area.polygon.length < 3) {
      errors.push(`${prefix}.area[${areaIndex}].polygon needs at least 3 coordinate pairs`);
    }
    if (area.circle) {
      const [lon, lat, radius] = area.circle;
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(radius)) {
        errors.push(`${prefix}.area[${areaIndex}].circle must be [lon, lat, radiusKm]`);
      }
    }
  });

  return errors;
}

/** Validate the alert-level fields + every info block. */
export function validateCapAlert(input: CapAlertLike): CapValidationResult {
  const errors: string[] = [];

  if (!input.identifier.trim()) errors.push("alert.identifier is required");
  if (!input.sender.trim()) errors.push("alert.sender is required");
  if (!input.sent) errors.push("alert.sent is required");
  if (!STATUSES.includes(input.status)) {
    errors.push(`alert.status "${typeLabel(input.status)}" is not a valid CAP status`);
  }
  if (!MSG_TYPES.includes(input.msgType)) {
    errors.push(`alert.msgType "${typeLabel(input.msgType)}" is not a valid CAP msgType`);
  }
  if (!SCOPES.includes(input.scope)) {
    errors.push(`alert.scope "${typeLabel(input.scope)}" is not a valid CAP scope`);
  }
  if (!input.infos.length) errors.push("alert requires at least one <info> block");

  input.infos.forEach((info, i) => errors.push(...validateInfo(info, i)));

  // Timestamp coherence: sent <= effective < expires.
  const sent = Date.parse(input.sent);
  const effective = Date.parse(input.infos[0]?.effective ?? "");
  const expires = Date.parse(input.infos[0]?.expires ?? "");
  if (Number.isFinite(sent) && Number.isFinite(effective) && effective < sent) {
    errors.push("info[0].effective must not precede alert.sent");
  }
  if (Number.isFinite(effective) && Number.isFinite(expires) && expires <= effective) {
    errors.push("info[0].expires must be after info[0].effective");
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------
// Dependency-free XML validation (validateCAP).
// Pure regex/tag matching — good enough for our own builder output and
// keeps Vercel builds free of native bindings.
// ---------------------------------------------------------------------

/** Elements (outside <info>) that CAP 1.2 mandates on every alert. */
const REQUIRED_ALERT_TAGS = ["identifier", "sender", "sent", "status", "msgType", "scope"];

/** Lightweight well-formedness + mandatory-tag check for generated CAP XML. */
export function validateCAP(xmlString: string): CapXmlValidation {
  const errors: string[] = [];

  if (!xmlString || !xmlString.trim()) {
    return { isValid: false, errors: ["CAP XML is empty"] };
  }

  const rootMatch = xmlString.match(/<alert(?:[^>]*)xmlns="([^"]+)"/);
  if (!rootMatch) {
    errors.push("Missing <alert> root element with CAP xmlns");
  } else if (rootMatch[1] !== CAP_NAMESPACE) {
    errors.push(`Unexpected alert xmlns "${rootMatch[1]}" (expected ${CAP_NAMESPACE})`);
  }

  const openCount = (xmlString.match(/<alert[\s>]/g) ?? []).length;
  const closeCount = (xmlString.match(/<\/alert>/g) ?? []).length;
  if (openCount !== 1 || closeCount !== 1) {
    errors.push("Expected exactly one <alert> element");
  }

  for (const tag of REQUIRED_ALERT_TAGS) {
    const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`);
    if (!re.test(xmlString)) {
      errors.push(`Missing mandatory element <${tag}>`);
    }
  }

  const infoCount = (xmlString.match(/<info>[\s\S]*?<\/info>/g) ?? []).length;
  if (infoCount < 1) errors.push("Missing mandatory <info> block");

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate an already-generated CAP XML string (async, Promise-shaped so
 * callers/tests keep working). Pure-JS — no native dependencies.
 */
export async function validateCapXml(capXml: string): Promise<CapValidationResult> {
  const { isValid, errors } = validateCAP(capXml);
  return { ok: isValid, errors };
}
