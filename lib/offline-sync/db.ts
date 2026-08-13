// ---------------------------------------------------------------------
// lib/offline-sync/db.ts — Offline-First Architecture · Phase 2
// DisasterLinkDB: the Dexie.js (IndexedDB) schema for the 48-hour offline
// window. One table per dataset, all sharing the district-indexed
// OfflineRecord row shape so reads never touch the network:
//
//   const rows = await db.resources.where("district").equals("Patna").toArray();
//
// The `metadata` table tracks engine bookkeeping (lastFullSync,
// lastSyncedAt per dataset) as simple key/value rows.
// ---------------------------------------------------------------------
// NOTE: imported lazily by the sync engine (and the hook) so importing
// this module in a Node/SSR context never touches IndexedDB up front.
// ---------------------------------------------------------------------

import Dexie, { type EntityTable } from "dexie";
import type { OfflineRecord, DataType, ChatMessage, MapTile, ModelChunk } from "./types";

/** Row shape in the key/value metadata table. */
export interface MetaRow {
  key: string;
  value: string | number | boolean | null;
}

/**
 * The IndexedDB database. Schema declared at construction so Dexie can
 * create/upgrade tables on first open. All columns use the exact names of
 * OfflineRecord fields (id, district, data, cachedAt, expiresAt).
 */
export class DisasterLinkDB extends Dexie {
  predictions!: EntityTable<OfflineRecord, "id">;
  alerts!: EntityTable<OfflineRecord, "id">;
  routes!: EntityTable<OfflineRecord, "id">;
  resources!: EntityTable<OfflineRecord, "id">;
  weather!: EntityTable<OfflineRecord, "id">;
  profiles!: EntityTable<OfflineRecord, "id">;
  maps!: EntityTable<OfflineRecord, "id">;
  knowledge!: EntityTable<OfflineRecord, "id">;
  metadata!: EntityTable<MetaRow, "key">;
  chatHistory!: EntityTable<ChatMessage, "id">;
  mapTiles!: EntityTable<MapTile, "id">;
  gemmaModel!: EntityTable<ModelChunk, "id">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      // Secondary index on district powers `getOfflineData(type, district)`.
      predictions: "id, district", // & id (default PK)
      alerts: "id, district",
      routes: "id, district",
      resources: "id, district",
      weather: "id, district",
      profiles: "id, district",
      maps: "id, district",
      knowledge: "id, district",
      metadata: "key",
    });
    // Phase 3 · storage management — chat log, LRU map tiles, model chunks.
    // Version 2 declares the COMPLETE schema: Dexie drops any v1 table that
    // is not listed here, so the original eight dataset tables + metadata
    // must be re-declared alongside the three new ones.
    this.version(2).stores({
      predictions: "id, district",
      alerts: "id, district",
      routes: "id, district",
      resources: "id, district",
      weather: "id, district",
      profiles: "id, district",
      maps: "id, district",
      knowledge: "id, district",
      metadata: "key",
      chatHistory: "id, sessionId, timestamp, role",
      mapTiles: "id, x, y, z, lastAccessedAt, expiresAt",
      gemmaModel: "id, chunkIndex, totalChunks, downloadedAt",
    });
  }
}

/** Standard database name for the platform. */
export const DEFAULT_DB_NAME = "disasterlink-offline";

/** Per-name instances so tests can open isolated databases. */
const instances = new Map<string, DisasterLinkDB>();

/**
 * Returns the shared database instance for a name (cached per name). Call
 * from the browser only (the sync engine guards SSR before calling).
 */
export function getOfflineDb(name: string = DEFAULT_DB_NAME): DisasterLinkDB {
  let db = instances.get(name);
  if (!db) {
    db = new DisasterLinkDB(name);
    instances.set(name, db);
  }
  return db;
}

/** The table store for a given dataset type. */
export function tableFor(db: DisasterLinkDB, type: DataType) {
  return db[type];
}

/** Reads all cached rows for a district from a dataset table. */
export async function readDistrictRows(
  db: DisasterLinkDB,
  type: DataType,
  district: string,
): Promise<OfflineRecord[]> {
  return db[type].where("district").equals(district).toArray();
}

export type { DataType } from "./types";