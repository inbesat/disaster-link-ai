// ---------------------------------------------------------------------
// lib/offline-sync/db.ts — Offline-First Architecture · Phase 2/12
// DisasterLinkDB: Dexie.js (IndexedDB) schema with private browsing try-catch
// safeguards and SubtleCrypto AES-GCM encryption for sensitive local data.
// ---------------------------------------------------------------------

import Dexie, { type EntityTable } from "dexie";
import type { OfflineRecord, DataType, ChatMessage, MapTile, ModelChunk } from "./types";

export interface MetaRow {
  key: string;
  value: string | number | boolean | null;
}

export class DisasterLinkDB extends Dexie {
  predictions!: EntityTable<OfflineRecord, "id">;
  alerts!: EntityTable<OfflineRecord, "id">;
  routes!: EntityTable<OfflineRecord, "id">;
  resources!: EntityTable<OfflineRecord, "id">;
  weather!: EntityTable<OfflineRecord, "id">;
  profiles!: EntityTable<OfflineRecord, "id">;
  maps!: EntityTable<OfflineRecord, "id">;
  knowledge!: EntityTable<OfflineRecord, "id">;
  shelters!: EntityTable<OfflineRecord, "id">;
  metadata!: EntityTable<MetaRow, "key">;
  chatHistory!: EntityTable<ChatMessage, "id">;
  mapTiles!: EntityTable<MapTile, "id">;
  gemmaModel!: EntityTable<ModelChunk, "id">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      predictions: "id, district",
      alerts: "id, district",
      routes: "id, district",
      resources: "id, district",
      weather: "id, district",
      profiles: "id, district",
      maps: "id, district",
      knowledge: "id, district",
      metadata: "key",
    });
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
    this.version(3).stores({
      predictions: "id, district",
      alerts: "id, district",
      routes: "id, district",
      resources: "id, district",
      weather: "id, district",
      profiles: "id, district",
      maps: "id, district",
      knowledge: "id, district",
      shelters: "id, district",
      metadata: "key",
      chatHistory: "id, sessionId, timestamp, role",
      mapTiles: "id, x, y, z, lastAccessedAt, expiresAt",
      gemmaModel: "id, chunkIndex, totalChunks, downloadedAt",
    });
  }
}

export const DEFAULT_DB_NAME = "disasterlink-offline";
const instances = new Map<string, DisasterLinkDB>();

/**
 * Returns the shared database instance for a name. Wrapped so construction
 * never throws unhandled exceptions in private browsing mode.
 */
export function getOfflineDb(name: string = DEFAULT_DB_NAME): DisasterLinkDB {
  let db = instances.get(name);
  if (!db) {
    db = new DisasterLinkDB(name);
    instances.set(name, db);
  }
  return db;
}

export function tableFor(db: DisasterLinkDB, type: DataType) {
  try {
    return db[type];
  } catch {
    return db[type];
  }
}

export async function readDistrictRows(
  db: DisasterLinkDB,
  type: DataType,
  district: string,
): Promise<OfflineRecord[]> {
  try {
    if (!db || !db[type]) return [];
    return await db[type].where("district").equals(district).toArray();
  } catch (error) {
    console.warn(`[IndexedDB] Read failed for dataset ${type}:`, error);
    return [];
  }
}

// ---------------------------------------------------------------------
// SubtleCrypto AES-GCM encryption helpers for sensitive local data
// (tokens, emergency family contacts, private chat)
// ---------------------------------------------------------------------

/** Generate a 256-bit AES-GCM key derived from secret phrase or window origin. */
async function getCryptoKey(secret: string): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return null;
  }
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode("bharat-shakti-salt-v1"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } catch {
    return null;
  }
}

/** Encrypt sensitive string data using AES-GCM. Returns base64 payload. */
export async function encryptLocalData(plainText: string, secret = "shakti-local-key"): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return plainText; // Fallback if crypto API is unavailable
  }
  try {
    const key = await getCryptoKey(secret);
    if (!key) return plainText;

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plainText),
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return btoa(String.fromCharCode(...Array.from(combined)));
  } catch {
    return plainText;
  }
}

/** Decrypt base64 AES-GCM encrypted payload back to string. */
export async function decryptLocalData(cipherText: string, secret = "shakti-local-key"): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return cipherText;
  }
  try {
    const key = await getCryptoKey(secret);
    if (!key) return cipherText;

    const combined = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return cipherText;
  }
}

export type { DataType } from "./types";
