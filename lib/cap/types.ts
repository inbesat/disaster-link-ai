// ---------------------------------------------------------------------
// lib/cap/types.ts — Phase 3 · CAP 1.2 shared types.
// ---------------------------------------------------------------------

/** CAP 1.2 msgType. */
export type CapMsgType = "Alert" | "Update" | "Cancel";

/** CAP 1.2 scope. */
export type CapScope = "Public" | "Restricted" | "Private";

/** CAP 1.2 urgency. */
export type CapUrgency = "Immediate" | "Expected" | "Future" | "Past" | "Unknown";

/** CAP 1.2 severity. */
export type CapSeverity =
  | "Extreme"
  | "Severe"
  | "Moderate"
  | "Minor"
  | "Unknown";

/** CAP 1.2 certainty. */
export type CapCertainty = "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";

/** CAP 1.2 category. */
export type CapCategory = "Geo" | "Met" | "Safety" | "Security" | "Rescue" | "Health" | "Env" | "Other";

/** A single geographic area polygon (WGS84 lon,lat pairs). */
export interface CapArea {
  /** Short description of the affected area. */
  areaDesc: string;
  /** Polygon — at least 3 lon,lat pairs, closed (first == last). */
  polygon?: Array<[number, number]>;
  /** Circle — [lon, lat, radiusKm]. Mutually exclusive with polygon. */
  circle?: [number, number, number];
}

/** A linked resource (e.g. the generated TTS audio file). */
export interface CapResource {
  resourceDesc: string;
  mimeType: string;
  uri: string;
}

/** The `<info>` block — one per language, repeating for multilingual alerts. */
export interface CapInfo {
  /** BCP-47 tag, e.g. "hi-IN", "en-IN". */
  language: string;
  category: CapCategory;
  event: string;
  urgency: CapUrgency;
  severity: CapSeverity;
  certainty: CapCertainty;
  /** ISO 8601 when the alert takes effect. */
  effective: string;
  /** ISO 8601 when the alert expires. */
  expires: string;
  /** Display name of the sender (e.g. "District Disaster Management Authority"). */
  senderName: string;
  headline: string;
  description: string;
  /** What people should do. */
  instruction?: string;
  areas: CapArea[];
  resources?: CapResource[];
}

/** The full CAP 1.2 alert document inputs. */
export interface CapAlertInput {
  /** Unique alert identifier (UUID). */
  identifier: string;
  /** Sender address, e.g. "disasterlink.ai@ddma.gov.in". */
  sender: string;
  /** ISO 8601 sent timestamp. */
  sent: string;
  /** CAP 1.2 status — "Actual" for live broadcasts. */
  status: "Actual" | "Exercise" | "System" | "Test" | "Draft";
  msgType: CapMsgType;
  scope: CapScope;
  /** Reference to a prior alert identifier (required when msgType=Update|Cancel). */
  references?: string;
  infos: CapInfo[];
}
