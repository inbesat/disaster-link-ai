"use client";

// ---------------------------------------------------------------------
// components/settings/SettingsSearchHost.tsx — Settings · Phase 9.
//
// Client wrapper around SettingsSearchBar that owns the "instant filter &
// highlight" behavior scoped to the CURRENT settings page:
//   • As the user types, every card on the current page is dimmed/ignored
//     unless its data-settings-key belongs to the current search results
//     (non-matching cards get reduced opacity + grayscale; the top match
//     stays at full brightness).
//   • Choosing a result from the current page scrolls to that card and
//     plays a brief cyan ring flash.
// The dropdown navigation to other sections stays handled by SearchBar.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import SettingsSearchBar from "@/components/settings/SettingsSearchBar";
import { searchSettings } from "@/lib/settings/search-index";

const SETTINGS_CSS_SELECTOR = "[data-settings-key]";

export default function SettingsSearchHost() {
  const [query, setQuery] = useState("");

  // Which card (data-settings-key) is currently the top match while searching.
  const highlightedKey = useMemo(() => {
    if (!query.trim()) return null;
    const ranked = searchSettings(query);
    if (ranked.length === 0) return null;
    // Only highlight in-place when the entry belongs to the current page.
    return ranked[0].cardRoute ? ranked[0].key : null;
  }, [query]);

  // Apply dim/highlight to the cards rendered on the current page.
  useEffect(() => {
    const root = document.querySelector("main");
    const cards = root
      ? Array.from(root.querySelectorAll<HTMLElement>(SETTINGS_CSS_SELECTOR))
      : [];
    const hasQuery = Boolean(query.trim());
    const activeKey = highlightedKey;

    function resetAll() {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.filter = "none";
        card.classList.remove("settings-search-flash");
      });
    }

    if (!hasQuery) {
      resetAll();
      return;
    }

    cards.forEach((card) => {
      const isMatch = card.dataset.settingsKey === activeKey;
      card.style.opacity = isMatch ? "1" : "0.35";
      card.style.filter = isMatch ? "none" : "grayscale(0.6)";
      if (isMatch) {
        card.classList.add("settings-search-flash");
      } else {
        card.classList.remove("settings-search-flash");
      }
    });

    return resetAll;
  }, [highlightedKey, query]);

  /** Explicit pick of an in-page card: jump + ring flash. */
  function handleHighlight(key: string) {
    setQuery("");
    requestAnimationFrame(() => {
      const card = document.querySelector<HTMLElement>(`[data-settings-key="${key}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("settings-search-jump");
      window.setTimeout(() => card.classList.remove("settings-search-jump"), 1800);
    });
  }

  return (
    <>
      <SettingsSearchBar
        onQueryChange={(value) => setQuery(value)}
        onHighlight={handleHighlight}
      />
      <style>{`
        @keyframes settFlash {
          0%   { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55); }
          100% { box-shadow: 0 0 0 14px rgba(56, 189, 248, 0); }
        }
        .settings-search-flash {
          transition: box-shadow 0.5s ease;
          animation: settFlash 1.2s ease-out infinite;
        }
        .settings-search-jump { animation: settFlash 1.4s ease-out; }
      `}</style>
    </>
  );
}