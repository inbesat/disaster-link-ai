import { streamText, type Tool } from "ai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { openRouterModel } from "@/lib/ai/openrouter";
import { emergencyPlanTools } from "@/lib/ai/tools/shelter-tools";
import { floodTools } from "@/lib/ai/tools/flood-tools";
import { resourceInventoryTools } from "@/lib/ai/tools/resources-tools";
import { evacuationPlanTools } from "@/lib/ai/tools/evacuation-tools";
import { createClient } from "@/lib/supabase/server";
import { buildKnowledgeContext } from "@/lib/retrieval/retrieve";
import { searchSimilarDocuments } from "@/lib/rag/vector-search";
import { createRateLimiter } from "@/lib/security/rate-limit";
import {
  assertDistrictAccess,
  enforceDistrictScope,
  scopeToolResult,
} from "@/lib/security/data-isolation";

export const maxDuration = 60;

// ---------------------------------------------------------------------
// Phase 11/21 · Server-side rate limiting (per visitor IP) via the shared
// lib/security/rate-limit sliding window. Protects the LLM budget even if
// the client-side gauge is bypassed. Swap the shared limiter for a Redis
// bucket at multi-tenant scale — the API stays identical.
// ---------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const chatLimiter = createRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  return `chat:${ip}`;
}

// ---------------------------------------------------------------------
// Phase 21 · district-scoped tool guard (mock RLS at the LLM boundary).
// Every tool the model can call is wrapped so that:
//   1. If the model requests a district outside the user's jurisdiction, it
//      receives the exact unauthorized error string instead of data.
//   2. Array fields in the result are re-filtered through the same district
//      policy as defense-in-depth (mirrors the 0017 RLS policies).
// ---------------------------------------------------------------------
function withDistrictScope(
  tools: Record<string, Tool>,
  district: string,
  role: string,
): Record<string, Tool> {
  const guarded: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    const original = t.execute as
      | ((input: Record<string, unknown>, options?: unknown) => Promise<unknown>)
      | undefined;
    if (!original) {
      guarded[name] = t;
      continue;
    }
    guarded[name] = {
      // Spread preserves the SDK tool's description/inputSchema/parameters;
      // only the execute handler is replaced with the guarded version.
      ...t,
      execute: async (input: Record<string, unknown>, options?: unknown) => {
        // Request-time interception: block foreign-district queries outright.
        const denied = assertDistrictAccess(
          typeof input?.district === "string" ? input.district : undefined,
          district,
          role,
        );
        if (denied) return denied;
        const result = await original(input, options);
        // Post-execution mock-RLS filter (e.g. getShelterStatus → shelters[]).
        if (
          result &&
          typeof result === "object" &&
          Array.isArray((result as { shelters?: unknown[] }).shelters)
        ) {
          const r = result as { shelters: Array<{ district?: string | null }> };
          return { ...r, shelters: enforceDistrictScope(r.shelters, district, role) };
        }
        return scopeToolResult(result, district, role);
      },
    } as Tool;
  }
  return guarded;
}

const BASE_PROMPT = `You are the Bharat Shakti Emergency AI. You generate tactical 48-hour evacuation plans. You MUST use your tools to check real data before suggesting a plan. Be concise and authoritative.

Context from Official SOPs — retrieved laws, NDMA guidelines, and district procedures that MUST govern your planning. Follow these rules when planning:
{SOP_CONTEXT}

SECURITY / ROLE GUARDRAILS:
- The current role is ROLE. Their assigned district is DISTRICT.
- If the user is NOT a Commander (role not in "District Commander", "super_admin", or "district_admin"), REFUSE to generate mass evacuation plans or issue any wide-scale evacuation order.
- In that case, briefly explain that the action requires commander clearance and advise the user to contact the District Control Room.
- Always respect the signer's authority level; never escalate, never fabricate an override.`;

type AccessContext = { role: string; district: string };

function defaultCommandContext(): AccessContext {
  return { role: "District Commander", district: "Patna" };
}

async function resolveAccessContext(): Promise<AccessContext> {
  const cookieStore = await cookies();

  // Guest (auth-bypassed demo) mode: assume a commander role for the demo.
  if (cookieStore.get("guest_mode")?.value === "true") {
    return defaultCommandContext();
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return defaultCommandContext();

    const { data: profile } = await supabase
      .from("users")
      .select("role, district")
      .eq("id", user.id)
      .maybeSingle();

    return {
      role: (profile?.role as string | undefined) ?? "viewer",
      district: (profile?.district as string | undefined) ?? "Unknown",
    };
  } catch {
    return defaultCommandContext();
  }
}

export async function POST(req: Request) {
  // Phase 21 · Enforce the server-side rate limit before doing any work.
  const rate = chatLimiter(clientKey(req));
  if (!rate.success) {
    const retryAfterMs = Math.max(0, rate.resetTime - Date.now());
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait before sending another request.",
        retryAfterMs,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  const { messages, currentDistrict } = await req.json();
  const { role, district } = await resolveAccessContext();

  // Pull the latest user utterance to ground a RAG knowledge-base search.
  const lastUserMessage = [...(messages as Array<{ role?: string; content?: string }>)]
    .reverse()
    .find((m) => m.role === "user");

  const queryText = lastUserMessage?.content?.toString().trim() ?? "";

  // Step 8 · Vector retrieval (cosine similarity via pgvector). The district is
  // scoped to the commander's own district so they only get their SOPs. On any
  // retrieval failure this degrades to the wider keyword-aware context builder.
  let officialContext = "";
  if (queryText) {
    try {
      const hits = await searchSimilarDocuments(queryText, district, 3);
      if (hits.length) {
        officialContext = hits
          .map(
            (hit) =>
              `- [${hit.title}${hit.docType ? ` (${hit.docType})` : ""}] (sim ${hit.score.toFixed(
                3,
              )}): ${hit.content}`,
          )
          .join("\n");
      }
    } catch (error) {
      console.warn("[chat] vector retrieval failed; using keyword fallback.", error);
    }
  }

  // Keyword / fallback grounding keeps the planner informed when vector search
  // returns nothing usable.
  const fallbackKnowledge = queryText ? await buildKnowledgeContext(queryText) : "";

  const knowledge = officialContext || fallbackKnowledge;

  const viewingContext =
    typeof currentDistrict === "string" && currentDistrict
      ? `The user is currently viewing the ${currentDistrict} sector.`
      : "";

  // Server-side guardrail (Phase 10): only commanders may invoke the
  // evacuation-route / mass-movement tools. For every other role we hard-drop
  // the tool from the registry, so the model physically cannot fabricate an
  // evacuation route or wide-scale movement order.
  const isCommander = ["District Commander", "super_admin", "district_admin"].includes(
    role,
  );

  const system = BASE_PROMPT.replace("ROLE", role)
    .replace("DISTRICT", district)
    .replace(
      "{SOP_CONTEXT}",
      knowledge ||
        "No official SOPs matched this query — answer using your tools and general emergency-management best practice (NDMA/state Disaster Management Act guidelines).",
    )
    .concat(viewingContext ? `\n\n${viewingContext}` : "")
    .concat(
      isCommander
        ? ""
        : "\n\nNOTE: You do NOT have evacuation tool access. If the user asks for evacuation plans or routes, explain that this requires commander clearance and direct them to the District Control Room.",
    );

  const commanderTools = {
    ...emergencyPlanTools,
    ...floodTools,
    ...resourceInventoryTools,
    ...evacuationPlanTools,
  } satisfies Record<string, Tool>;
  const responderTools = {
    ...emergencyPlanTools,
    ...floodTools,
    ...resourceInventoryTools,
  } satisfies Record<string, Tool>;

  const result = streamText({
    model: openRouterModel,
    system,
    messages,
    // Phase 21 · every tool call is scoped to the user's district — the LLM
    // cannot query data outside its jurisdiction (mock RLS at the tool layer).
    tools: withDistrictScope(isCommander ? commanderTools : responderTools, district, role),
    temperature: 0.4,
  });

  return result.toUIMessageStreamResponse();
}
