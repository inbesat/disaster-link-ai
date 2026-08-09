// ---------------------------------------------------------------------
// hooks/useHotkeys.ts
// UI/UX Phase 2 · Step 9 — global keyboard shortcuts for power users.
//
// Binds combos like "mod+1" at the window level and navigates (or runs
// an arbitrary callback) when matched. `mod` resolves to Cmd on macOS and
// Ctrl on Windows/Linux, so the same config works everywhere:
//
//   useHotkeys({
//     "mod+1": "/command-center",
//     "mod+2": "/alerts",
//     "shift+g": () => console.log("group"),
//   });
//
// String values are pushed with Next's useRouter; functions are invoked
// as-is. Typing in inputs / textareas / contenteditable never triggers a
// shortcut, and matched combos call preventDefault so the browser doesn't
// also act on them.
// ---------------------------------------------------------------------

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type HotkeyAction = string | (() => void);

const MODIFIER_KEYS = new Set(["mod", "cmd", "ctrl", "meta", "alt", "shift"]);

/** True when the event target is a form field — shortcuts must not fire. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable
  );
}

/** Strict modifier match. `mod` = Cmd on mac, Ctrl elsewhere. */
function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;

  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const wantsMod = mods.has("mod");
  const ctrlExpected = mods.has("ctrl") || (!isMac && wantsMod);
  const metaExpected = mods.has("meta") || mods.has("cmd") || (isMac && wantsMod);
  const altExpected = mods.has("alt");
  const shiftExpected = mods.has("shift");

  return (
    event.ctrlKey === ctrlExpected &&
    event.metaKey === metaExpected &&
    event.altKey === altExpected &&
    event.shiftKey === shiftExpected &&
    event.key.toLowerCase() === key
  );
}

/**
 * Global hotkey bindings. Keys are "+"-joined combos (mod/ctrl/cmd/meta/alt/
 * shift + a key), values are either a route string (navigated via useRouter)
 * or a callback. A single listener on `window` handles every combo.
 */
export function useHotkeys(shortcuts: Record<string, HotkeyAction>): void {
  const router = useRouter();
  // Keep the latest map without re-subscribing on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      for (const combo of Object.keys(shortcutsRef.current)) {
        if (!matchesCombo(event, combo)) continue;
        event.preventDefault();
        const action = shortcutsRef.current[combo];
        if (typeof action === "string") router.push(action);
        else action();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);
}

export default useHotkeys;
