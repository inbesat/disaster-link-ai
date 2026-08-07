// Phase 20 — realtime collaboration library (WebSocket → polling fallback,
// concurrent-edit resolution, presence tracking). Import from "@/lib/realtime".
export {
  RealtimeClient,
  createRealtimeClient,
  type RealtimeStatus,
  type RealtimeClientOptions,
  type RealtimeStatusListener,
} from "./client";
export type { RealtimeMessage, RealtimeTransport } from "./client";
export {
  WebSocketTransport,
  PollingTransport,
  type WebSocketLike,
  type WebSocketTransportOptions,
  type PollingTransportOptions,
  type TransportKind,
} from "./transports";
export {
  applyLastWriteWins,
  isNewerEdit,
  mergeShelterEdits,
  type ConflictEdit,
  type VersionedValue,
  type LwwResult,
  type ShelterEdit,
  type MergedShelterEdit,
} from "./conflict";
export {
  PresenceTracker,
  pickFresherPresence,
  type PresenceMember,
  type PresenceEvent,
  type PresenceTrackerOptions,
} from "./presence";
