// ---------------------------------------------------------------------
// lib/cache-tags.ts — Step 6/8 · Cache invalidation pipeline
//
// Single source of truth for the Next.js cache tags that bridge the two
// modes. The public shelters endpoint caches its data under
// PUBLIC_SHELTERS_CACHE_TAG (unstable_cache tags), and every shelter write
// path (server actions, the offline-sync replay endpoint) calls
// revalidateTag() with the same constant — so a Gov update purges the
// Citizen App's cached list immediately instead of waiting out the
// 5-minute revalidate window.
//
// Keeping the string in one place prevents a typo in one copy from
// silently breaking the purge.
// ---------------------------------------------------------------------

export const PUBLIC_SHELTERS_CACHE_TAG = "public_shelters";
