// ---------------------------------------------------------------------
// lib/settings/avatar.ts — avatar persistence helpers (Settings · Phase 3).
//
// The avatar has two persistence layers:
//   1. Supabase Storage (primary) — the cropped image is uploaded to the
//      `avatars` bucket and the public URL is stored on the profile.
//   2. localStorage (mock fallback) — when Storage is offline/bypassed, the
//      cropped image is kept as a base64 data URI under AVATAR_STORAGE_KEY.
//
// The Navbar reads AVATAR_STORAGE_KEY client-side FIRST (instant update),
// then falls back to the server-provided URL — so a locally-stored avatar
// shows up in the top navbar immediately after saving.
// ---------------------------------------------------------------------

export const AVATAR_STORAGE_KEY = "drip_avatar_v1";

/** Fired (window event) whenever the stored avatar changes, so mounted
 *  navbar/avatar components update instantly in the same tab. */
export const AVATAR_CHANGED_EVENT = "drip:avatar-changed";

export function getStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAvatar(dataUri: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, dataUri);
    window.dispatchEvent(new CustomEvent(AVATAR_CHANGED_EVENT));
  } catch {
    // storage full / unavailable — avatar just won't persist across reloads
  }
}

export function clearStoredAvatar(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AVATAR_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

/** Convert a base64 data URI into a Blob (for Supabase Storage upload). */
export function dataUriToBlob(dataUri: string): Blob {
  const [meta, b64] = dataUri.split(",");
  const mime = /data:([^;]+);/.exec(meta)?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Derive clean initials (e.g. "AV") for the fallback avatar circle. */
export function initialsFor(name: string | null | undefined): string {
  return (
    (name ?? "U")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

/** File types accepted by the avatar uploader. */
export const AVATAR_ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export const AVATAR_MAX_BYTES = 8 * 1024 * 1024; // 8 MB source cap

export function isAvatarFile(file: File): boolean {
  return AVATAR_ACCEPT.includes(file.type);
}
