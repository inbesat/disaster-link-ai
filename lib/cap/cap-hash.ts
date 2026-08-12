// ---------------------------------------------------------------------
// lib/cap/cap-hash.ts — Phase 8 · CAP tamper-proofing.
//
// Every cap_alerts row stores a SHA-256 digest of its cap_xml. Anyone can
// recompute the digest from the stored XML and compare it to cap_hash to
// prove the message wasn't altered after generation — the audit-trail
// guarantee DDMA/MIB compliance reviewers expect.
// ---------------------------------------------------------------------

import { createHash } from "node:crypto";

/** SHA-256 hex digest of the exact CAP XML string (tamper-evident id). */
export function hashCapXml(capXml: string): string {
  return createHash("sha256").update(capXml, "utf8").digest("hex");
}

/** True when the stored hash matches a recomputation of the XML. */
export function verifyCapHash(capXml: string, expectedHash: string | null): boolean {
  if (!expectedHash) return false;
  return hashCapXml(capXml) === expectedHash;
}
