// ---------------------------------------------------------------------
// lib/tts/audio-store.ts — Phase 26 · alert-audio storage + 24 h cache.
//
// Stores the generated MP3 voice + beep WAV in the Supabase `alert-audio`
// storage bucket, keyed by a content hash so identical alerts share one
// file. A 24 h in-memory cache avoids re-uploading the same alert; when
// storage is unavailable (demo/dev without buckets) we fall back to
// returning base64 data-URIs so the admin preview still plays.
// ---------------------------------------------------------------------

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "alert-audio";
const BEEP_FILE = "assets/radio-beep-1000hz-0.5s.wav";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CachedAlertAudio {
  audioUrl: string | null;
  beepUrl: string | null;
  /** Base64 fallback when Storage is not configured — still playable. */
  audioDataUri: string | null;
  beepDataUri: string;
  /** True when served from the 24 h cache instead of a fresh upload. */
  cached: boolean;
}

const cache = new Map<string, { url: string; expiresAt: number }>();

/** Stable content key — identical alerts map to the same stored file. */
export function alertAudioCacheKey(input: {
  script: string;
  language: string;
}): string {
  return createHash("sha256")
    .update(`${input.language}|${input.script}`)
    .digest("hex")
    .slice(0, 24);
}

function toDataUri(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/**
 * Persist (or reuse) the voiced MP3 + beep WAV for an alert.
 * Returns public URLs when Storage works; data-URIs as a fallback.
 */
export async function storeAlertAudio(params: {
  cacheKey: string;
  voice: Buffer;
  beep: Buffer;
}): Promise<CachedAlertAudio> {
  const { cacheKey, voice, beep } = params;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      audioUrl: cached.url,
      beepUrl: null,
      audioDataUri: toDataUri(voice, "audio/mpeg"),
      beepDataUri: toDataUri(beep, "audio/wav"),
      cached: true,
    };
  }

  const supabase = createClient();
  const voicePath = `${cacheKey.slice(0, 2)}/${cacheKey}.mp3`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(voicePath, new Uint8Array(voice), {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (error) throw new Error(error.message);

    // The beep is a shared static asset — upload once with upsert.
    const { error: beepError } = await supabase.storage
      .from(BUCKET)
      .upload(BEEP_FILE, new Uint8Array(beep), {
        contentType: "audio/wav",
        upsert: true,
      });
    if (beepError) throw new Error(beepError.message);

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);
    const { data: beepUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(BEEP_FILE);

    cache.set(cacheKey, { url: urlData.publicUrl, expiresAt: Date.now() + CACHE_TTL_MS });

    return {
      audioUrl: urlData.publicUrl,
      beepUrl: beepUrlData.publicUrl,
      audioDataUri: toDataUri(voice, "audio/mpeg"),
      beepDataUri: toDataUri(beep, "audio/wav"),
      cached: false,
    };
  } catch {
    // Storage not configured / unavailable in this environment — fall back
    // to data URIs so generation still succeeds for the preview.
    return {
      audioUrl: null,
      beepUrl: null,
      audioDataUri: toDataUri(voice, "audio/mpeg"),
      beepDataUri: toDataUri(beep, "audio/wav"),
      cached: false,
    };
  }
}

/** Test/dev hook. */
export function clearAlertAudioCache(): void {
  cache.clear();
}

/**
 * Phase 8 · retention — delete alert-audio files older than maxAgeDays.
 * The shared beep asset (and any folder entries) is always kept. Storage
 * is paged (100/page); failures are logged and never thrown so a cron run
 * that hits a storage outage still reports what it could check.
 */
export async function pruneExpiredAlertAudio(options: {
  maxAgeDays?: number;
  dryRun?: boolean;
} = {}): Promise<{
  checked: number;
  deleted: string[];
  retained: number;
  dryRun: boolean;
}> {
  const maxAgeDays = options.maxAgeDays ?? 90;
  const dryRun = options.dryRun ?? false;
  const cutoff = Date.now() - maxAgeDays * 24 * 3_600_000;
  const deleted: string[] = [];
  let checked = 0;

  try {
    const supabase = createClient();
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(BUCKET).list("", {
        limit: 100,
        offset,
        sortBy: { column: "created_at", order: "asc" },
      });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      offset += data.length;

      for (const item of data) {
        // Folders carry no id (null in some API versions) and the shared
        // beep asset is never pruned.
        if (item.id == null || item.name === BEEP_FILE) continue;
        checked += 1;
        const created = item.created_at ? new Date(item.created_at).getTime() : null;
        if (created !== null && created < cutoff) {
          deleted.push(item.name);
        }
      }
      if (data.length < 100) break;
    }

    if (!dryRun && deleted.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(deleted);
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    console.error("[audio-store] Retention prune failed:", error);
  }

  return {
    checked,
    deleted,
    retained: checked - deleted.length,
    dryRun,
  };
}
