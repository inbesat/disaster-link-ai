// Phase 20/11 — realtime collaboration library with WebSocket & presence security.
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
  RealtimeMessageSchema,
  type WebSocketLike,
  type WebSocketTransportOptions,
  type PollingTransportOptions,
  type TransportKind,
} from "./transports";
export {
  SupabaseRealtimeTransport,
  sanitizeRealtimePayload,
  type ChannelEvent,
  type RealtimeUserContext,
  type SupabaseRealtimeTransportOptions,
} from "./supabase-transport";
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
  getSanitizedLastSeenStatus,
  isAuthorizedForPresence,
  type PresenceMember,
  type SanitizedPresenceMember,
  type FuzzyPresenceStatus,
  type PresenceEvent,
  type PresenceTrackerOptions,
} from "./presence";
