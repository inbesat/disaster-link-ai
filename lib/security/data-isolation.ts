// ---------------------------------------------------------------------
// lib/security/data-isolation.ts — Phase 21 (Security, Privacy & Data
// Isolation) · Application-level mock of Supabase Row-Level Security.
//
// Mirrors the RLS policies in supabase/migrations/0017_rls_policies.sql at
// the application layer so that even before the database policies are
// connected, a Patna commander can never see Kerala's data:
//
//   enforceDistrictScope(data, userDistrict, userRole)
//     super_admin        → entire array (global visibility)
//     district_admin /
//     field_responder    → only rows whose district matches the user's
//     anything else      → nothing (least privilege)
//
// The same rules drive the AI tool-call guard (assertDistrictAccess) used by
// app/api/chat/route.ts so the LLM cannot query outside its jurisdiction.
// ---------------------------------------------------------------------

export type DistrictScoped = { district?: string | null };

/**
 * Normalize a district label for comparison: strip parenthetical suffixes
 * ("Patna (Ganga)" → "patna"), trim, lowercase. Keeps "Patna" and
 * "patna" from different data sources comparable.
 */
export function normalizeDistrict(district: string | null | undefined): string {
  return (district ?? "").split("(")[0].trim().toLowerCase();
}

/**
 * Application-level Row-Level Security. Filters a data array to the rows the
 * user is allowed to see — the exact policy matrix from the RLS migration:
 *
 *   super_admin        → all rows
 *   district_admin     → own district
 *   field_responder    → own district
 *   any other role     → no rows (least privilege)
 */
export function enforceDistrictScope<T extends DistrictScoped>(
  data: T[],
  userDistrict: string,
  userRole: string,
): T[] {
  if (userRole === "super_admin") return data;
  if (userRole === "district_admin" || userRole === "field_responder") {
    return data.filter(
      (item) => normalizeDistrict(item.district) === normalizeDistrict(userDistrict),
    );
  }
  return [];
}

/**
 * Guard for LLM tool calls. Returns `null` when the request is authorized
 * (super_admin, or the requested district matches the user's), otherwise the
 * exact error string the model should receive.
 */
export function assertDistrictAccess(
  requestedDistrict: string | null | undefined,
  userDistrict: string,
  userRole: string,
): string | null {
  if (userRole === "super_admin") return null;
  if (
    requestedDistrict &&
    normalizeDistrict(requestedDistrict) !== normalizeDistrict(userDistrict)
  ) {
    return `Error: Unauthorized. You may only query data for ${userDistrict}.`;
  }
  return null;
}

/**
 * Post-execution defense-in-depth: run enforceDistrictScope over any array
 * fields in a tool result whose items carry a `district` property (e.g. the
 * `shelters` array). Arrays without district-bearing items — like resource
 * inventory — are left untouched; they are already protected by the
 * request-time assertDistrictAccess guard.
 */
export function scopeToolResult(
  result: unknown,
  userDistrict: string,
  userRole: string,
): unknown {
  if (Array.isArray(result)) {
    const items = result as Array<Record<string, unknown>>;
    if (items.some((item) => typeof item?.district === "string")) {
      return enforceDistrictScope(items, userDistrict, userRole);
    }
    return result;
  }
  if (result && typeof result === "object") {
    const out: Record<string, unknown> = { ...(result as Record<string, unknown>) };
    for (const key of Object.keys(out)) {
      if (Array.isArray(out[key])) {
        const items = out[key] as Array<Record<string, unknown>>;
        if (items.some((item) => typeof item?.district === "string")) {
          out[key] = enforceDistrictScope(items, userDistrict, userRole);
        }
      }
    }
    return out;
  }
  return result;
}
