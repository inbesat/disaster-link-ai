"use server";

// ---------------------------------------------------------------------
// app/actions/preferences.ts — real persistence for users.preferred_language.
//
// Called by LanguageSelector after a language change. Uses the Supabase
// server client so the update happens against the authenticated user's row
// (RLS-scoped). Guests / unauthenticated visitors get `{ ok: false }` — the
// UI keeps working via localStorage regardless.
// ---------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export type UpdatePreferredLanguageResult =
  | { ok: true }
  | { ok: false; error?: string };

export async function updatePreferredLanguage(
  lang: string,
): Promise<UpdatePreferredLanguageResult> {
  if (!isLocale(lang)) {
    return { ok: false, error: `Unsupported language code: ${lang}` };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Guests and signed-out visitors have no profile row to persist to —
      // the localStorage preference still applies for this browser.
      return { ok: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("users")
      .update({ preferred_language: lang as Locale })
      .eq("id", user.id);

    if (error) {
      console.warn("[preferences] Failed to persist preferred_language:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[preferences] Server sync failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
