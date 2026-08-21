"use client";

// ---------------------------------------------------------------------
// components/settings/AvatarCard.tsx — Settings · Phase 3.
//
// Avatar header card shown at the top of /settings/profile:
//   • Current avatar — server URL (or localStorage fallback), else a clean
//     initials avatar generated from the profile name.
//   • "Change Photo" — validates png/jpg/webp, opens the crop modal, then:
//       → Supabase Storage upload (primary) → persist URL on profile row +
//         auth metadata.
//       → Offline/bypassed → base64 data URI saved to localStorage, navbar
//         avatar updated immediately via the AVATAR_CHANGED_EVENT.
//   • "Remove" — clears both the server value and the local snapshot.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AvatarCropperModal from "@/components/settings/AvatarCropperModal";
import { uploadAvatar } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";
import {
  clearStoredAvatar,
  getStoredAvatar,
  initialsFor,
  isAvatarFile,
  setStoredAvatar,
  AVATAR_CHANGED_EVENT,
  AVATAR_MAX_BYTES,
} from "@/lib/settings/avatar";

type AvatarCardProps = {
  /** Server-provided avatar URL (may be null when Storage is unavailable). */
  serverAvatarUrl?: string | null;
  displayName?: string | null;
  /** Supabase user id — null for guests (localStorage-only mode). */
  userId?: string | null;
};

function AvatarFallback({ displayName, size = 88 }: { displayName?: string | null; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-cyan-400/40 bg-surface-elevated font-mono font-bold text-cyan-300"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initialsFor(displayName)}
    </div>
  );
}

export default function AvatarCard({
  serverAvatarUrl,
  displayName,
  userId,
}: AvatarCardProps) {
  // Init null (matches SSR) and read localStorage in an effect to avoid
  // hydration mismatches — same pattern as LanguageContext.
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const avatarSrc = localAvatar ?? serverAvatarUrl ?? null;

  // Read the persisted snapshot once mounted, then keep the card in sync if
  // the navbar/settings writes the local snapshot.
  useEffect(() => {
    const onAvatarChanged = () => setLocalAvatar(getStoredAvatar());
    setLocalAvatar(getStoredAvatar());
    window.addEventListener(AVATAR_CHANGED_EVENT, onAvatarChanged);
    return () => window.removeEventListener(AVATAR_CHANGED_EVENT, onAvatarChanged);
  }, []);

  function handleFilePicked(file: File | undefined) {
    if (!file) return;
    if (!isAvatarFile(file)) {
      toast.error("Please choose a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Image is too large — please use one under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.onerror = () => toast.error("Could not read the image file.");
    reader.readAsDataURL(file);
  }

  async function handleSaveAvatar(dataUri: string, blob: Blob) {
    setUploading(true);
    let savedToServer = false;
    try {
      if (!userId) throw new Error("Guest session — local mode only");

      const client = createClient();
      const file = new File([blob], `avatar-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const url = await uploadAvatar(file, userId);

      // Persist on the profile row + auth metadata so the server-rendered
      // navbar/directory pick it up after refresh.
      const { error: rowError } = await client
        .from("users")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (rowError) throw rowError;
      const { error: metaError } = await client.auth.updateUser({
        data: { avatar_url: url },
      });
      if (metaError) throw metaError;

      savedToServer = true;
      // A fresh server avatar supersedes any stale local snapshot.
      clearStoredAvatar();
      toast.success("Avatar updated!");
    } catch (error: unknown) {
      // Offline/bypassed Storage → keep the cropped image locally and update
      // the navbar avatar immediately.
      console.warn(
        "[avatar] Storage upload failed — persisting cropped image locally.",
        error,
      );
      setStoredAvatar(dataUri);
      toast.success("Avatar saved locally — will sync when online.");
    }

    setLocalAvatar(dataUri); // instant card update either way
    setCropSrc(null);
    setUploading(false);
    if (savedToServer) {
      // server data is refreshed on the next navigation
    }
  }

  async function handleRemove() {
    setRemoving(true);
    clearStoredAvatar();
    setLocalAvatar(null);
    try {
      if (userId) {
        const client = createClient();
        await client.from("users").update({ avatar_url: null }).eq("id", userId);
        await client.auth.updateUser({ data: { avatar_url: null } });
      }
      toast.success("Avatar removed.");
    } catch (error: unknown) {
      console.warn("[avatar] Server removal failed — local state cleared.", error);
      toast.success("Avatar removed locally.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section
      data-settings-key="avatar"
      className="rounded-eoc border border-panel-border bg-surface p-6"
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt="Your avatar"
              className="h-22 w-22 rounded-full border-2 border-cyan-400/40 object-cover"
              style={{ width: 88, height: 88 }}
            />
          ) : (
            <AvatarFallback displayName={displayName} />
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-panel-borderHover bg-surface-elevated text-slate-300 shadow-lg transition hover:border-cyan-400 hover:text-cyan-300"
            aria-label="Change photo"
            title="Change photo"
          >
            <Camera className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="eoc-label text-cyan-400/80">PROFILE PHOTO</p>
          <h2 className="mt-1 text-lg font-bold">Profile Avatar</h2>
          <p className="mt-1 text-sm text-slate-400">
            PNG, JPG or WEBP — square-cropped to 256×256. Shown in the top
            navigation and the responder directory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || removing}
            className="inline-flex items-center gap-2 rounded-md border border-panel-borderHover bg-surface-muted px-4 py-2 text-sm font-semibold text-foreground transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Change Photo
          </button>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={removing || uploading || !avatarSrc}
            className="inline-flex items-center gap-2 rounded-md border border-severity-red-600/40 px-4 py-2 text-sm font-semibold text-severity-red-400 transition hover:bg-severity-red-600/10 disabled:opacity-40"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            Remove
          </button>
        </div>
      </div>

      {/* Hidden file input — triggered by the buttons above */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFilePicked(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      <AvatarCropperModal
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        onSave={(dataUri, blob) => handleSaveAvatar(dataUri, blob)}
      />
    </section>
  );
}
