"use client";

// ---------------------------------------------------------------------
// components/NavbarAvatar.tsx — Settings · Phase 3.
//
// Navbar avatar that prefers the localStorage snapshot (written by the
// avatar cropper when Storage is offline/bypassed) so the top navbar
// updates INSTANTLY after a local save — then falls back to the
// server-provided URL, and finally to clean initials.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  getStoredAvatar,
  initialsFor,
  AVATAR_CHANGED_EVENT,
} from "@/lib/settings/avatar";

export default function NavbarAvatar({
  serverAvatarUrl,
  displayName,
}: {
  serverAvatarUrl: string | null;
  displayName: string;
}) {
  // Init null (matches SSR) and read localStorage in an effect to avoid
  // hydration mismatches — same pattern as LanguageContext.
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  useEffect(() => {
    const onAvatarChanged = () => setLocalAvatar(getStoredAvatar());
    setLocalAvatar(getStoredAvatar());
    window.addEventListener(AVATAR_CHANGED_EVENT, onAvatarChanged);
    return () => window.removeEventListener(AVATAR_CHANGED_EVENT, onAvatarChanged);
  }, []);

  const avatarSrc = localAvatar ?? serverAvatarUrl;

  if (avatarSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc}
        alt={displayName}
        className="h-9 w-9 rounded-full border border-border object-cover"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-muted text-xs font-semibold text-foreground">
      {initialsFor(displayName)}
    </span>
  );
}
