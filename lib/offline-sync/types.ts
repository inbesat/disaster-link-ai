// ---------------------------------------------------------------------
// lib/offline-sync/types.ts — Offline-First Architecture · Phase 2
// Shared types for the 48-hour offline data sync engine. The Dexie
// database (lib/offline-sync/db.ts) stores every table under a common
// shape — a district-indexed record row — so `getOfflineData(type,
// district)` always reads IndexedDB, never the network.
// ---------------------------------------------------------------------

/** Every dataset the engine can cache for the offline window. */
export type DataType =
  | "predictions"
  | "alerts"
  | "routes"
  | "resources"
  | "weather"
  | "profiles" // user's district profile
  | "maps" // user's state map tiles
  | "knowledge"; // RAG context chunks

/** All supported dist types for guards + UI dtype labels. */
export const DATA_TYPES: readonly DataType[] = [
  "predictions",
  "alerts",
  "routes",
  "resources",
  "weather",
  "profiles",
  "maps",
  "knowledge",
];

export function isDataType(value: unknown): value is DataType {
  return typeof value === "string" && (DATA_TYPES as readonly string[]).includes(value);
}

/** A single cached row in any Dexie table. */
export interface OfflineRecord<T = unknown> {
  /** Primary key — server id, or `${district}:${date}` for aggregate rows. */
  id: string;
  district: string;
  /** Cached payload (exact server shape for rows, snapshot for aggregates). */
  data: T;
  /** When this row was last refreshed. */
  cachedAt: string;
  /** When this row expires (cachedAt + dataset TTL). */
  expiresAt: string;
}

/** Row shape for tables keyed by a fixed entity (profile, metadata). */
export interface OfflineEntity<T = unknown> {
  key: string;
  district: string;
  data: T;
  cachedAt: string;
  expiresAt: string;
}

/** TTL for a 48-hour offline window, per data type. */
export type TtlHours = number;

/** Priority-band of a dataset inside the sync queue. */
export type SyncPriority = "critical" | "high" | "normal" | "low";

/** One dataset's sync configuration (see lib/offline-sync/config.ts). */
export interface DataSourceConfig<T = unknown> {
  type: DataType;
  /** Storage estimate shown on the Sync Status dashboard (bytes). */
  sizeBytes: number;
  /** Expected rows in the dataset — drives the per-row byte estimate. */
  expectedRows?: number;
  /** How often the dataset should be refreshed while online, in hours. */
  refreshHours: number;
  /** Expiry after which a cached row is stale (48h window default). */
  ttlHours: TtlHours;
  priority: SyncPriority;
  /** Fetch the latest dataset rows from the backend. */
  fetch: (options: { district: string; signal?: AbortSignal }) => Promise<T[]>;
  /** Map a server row to a stable id. */
  idOf?: (row: T) => string;
}

/** Live freshness state for one dataset, consumed by useSyncStatus(). */
export interface SyncStatusEntry {
  type: DataType;
  /** Last successful fetch for this dataset. */
  lastSyncedAt: string | null;
  /** Cached rows currently stored. */
  rowCount: number;
  /** Approximate bytes cached (rowCount × configured size). */
  sizeBytes: number;
  /** True when lastSyncedAt is within the 48h offline window. */
  fresh: boolean;
  /** True while the engine is fetching this dataset. */
  syncing: boolean;
}

/** Overall sync state exposed to hooks/useSyncStatus.ts. */
export interface SyncStatus {
  /** True when the device + backend are reachable right now. */
  online: boolean;
  /** lastFullSync timestamp (epoch ms) from the metadata table. */
  lastFullSync: number | null;
  /** Epoch ms of the next scheduled automatic sync. */
  nextSyncAt: number | null;
  /** True while a fullSync() is running. */
  syncing: boolean;
  /** Per-dataset freshness + sizes. */
  datasets: SyncStatusEntry[];
  /** Districts the engine is configured to cache. */
  districts: string[];
}

export type SyncEventName = "drip:sync:updated" | "drip:sync:started" | "drip:sync:finished";

/** Custom window event detail payload. */
export interface SyncEventDetail {
  type: DataType | "all";
  district: string;
  errors: number;
}

// ---------------------------------------------------------------------
// Phase 3 · storage-management entities
// ---------------------------------------------------------------------

/** A chat turn persisted for the offline session log. */
export interface ChatMessage {
  /** `${sessionId}:${timestamp}` — natural key, one per turn. */
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  district?: string;
  timestamp: string;
  /** End-to-end latency of the assistant turn (ms). */
  latencyMs?: number;
}

/** One cached map tile (z/x/y) for the user's state, LRU-evicted. */
export interface MapTile {
  /** `${z}/${x}/${y}` — natural key; the same tile is never duplicated. */
  id: string;
  x: number;
  y: number;
  z: number;
  /** Raster bytes (tile image) or null until fetched. */
  data: Blob | null;
  fetchedAt: string;
  /** Eviction clock — bumped on every read so LRU order stays hot. */
  lastAccessedAt: string;
  expiresAt: string;
}

/** One 4-bit model chunk stored in the resumable download store. */
export interface ModelChunk {
  /** chunkIndex (0-based) — natural key for resume accounting. */
  id: number;
  chunkIndex: number;
  /** Total chunk count captured when the manifest was created. */
  totalChunks: number;
  /** Raw bytes for this chunk. */
  bytes: Blob;
  downloadedAt: string;
}

/** Persisted model download manifest (resume/pause state). */
export interface ModelManifest {
  version: number;
  modelId: string;
  /** Total model size in bytes (from Content-Length when known). */
  totalBytes: number;
  chunkSize: number;
  totalChunks: number;
  /** Progress bookmark: last fully-written chunk index. */
  lastChunkIndex: number;
  status: "idle" | "downloading" | "paused" | "complete" | "error";
  /** The tile where the model is hosted (used for resume). */
  baseUrl: string;
  updatedAt: string;
}

/** Top-level storage snapshot for the Storage Manager UI. */
export interface StorageSnapshot {
  supported: boolean;
  usageBytes: number;
  quotaBytes: number;
  /** True when navigator.storage.persist() granted persistent storage. */
  persisted: boolean;
  error?: string;
}