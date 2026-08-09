import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { probeEmergencyPlanner, type ProviderGroup } from "@/lib/ai/openrouter";

export const runtime = "nodejs";

// ---------------------------------------------------------------------
// app/api/ai/test/route.ts — live "Test Connection" for Settings · AI.
//
// The planner's SDK tools never graduate the client key to the server
// (keys stay in localStorage), so this endpoint reports the health of the
// server-configured provider chain (GROQ_API_KEY / _BACKUP,
// OPENROUTER_API_KEY / _BACKUP, BLUESMINDS_API_KEY) for the provider
// family the operator selected. Same guardrails as the chat route.
// ---------------------------------------------------------------------

const PROVIDER_GROUPS: Record<string, ProviderGroup> = {
  "groq-llama3": "groq",
  "openai-gpt4o": "openrouter",
  "anthropic-claude35": "openrouter",
  "local-airgapped": "auto",
};

async function isOperator(): Promise<boolean> {
  const cookieStore = await cookies();
  // Guest (auth-bypassed demo) mode mirrors the chat route's default.
  if (cookieStore.get("guest_mode")?.value === "true") return true;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") ?? undefined;
  const preferred = provider ? PROVIDER_GROUPS[provider] : undefined;

  const report = await probeEmergencyPlanner(preferred);
  return NextResponse.json(report);
}
