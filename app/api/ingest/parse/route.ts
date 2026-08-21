import { NextRequest, NextResponse } from "next/server";
import { parseCitizenReport } from "@/lib/ai/groq-parser";
import { sanitizeInput } from "@/lib/security/sanitize";
import { requireSession } from "@/lib/security/require-role";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

// ---------------------------------------------------------------------
// POST /api/ingest/parse
// Server-side wrapper around the Groq NLP parser. The browser NEVER imports
// lib/ai/groq-parser (it reads GROQ_API_KEY / GROQ_MODEL from env) — the
// WebhookSimulator / social-ingest UIs call this endpoint instead, keeping
// the LLM client (and any key reference) out of the client bundle.
// Body: { text: string }
// ---------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Any signed-in identity (demo guests included) may parse a report text.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const budget = rateLimit(`ingest-parse:${clientIp(request)}`, 30, 60_000);
  if (!budget.success) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: { text?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const text = sanitizeInput(typeof body.text === "string" ? body.text : "").slice(0, 2000);
  if (!text) {
    return NextResponse.json({ ok: false, error: "text is required." }, { status: 400 });
  }

  try {
    const parsed = await parseCitizenReport(text);
    return NextResponse.json({
      ok: true,
      parsed: {
        issue: parsed.issue,
        severity: parsed.severity,
        people_trapped: parsed.people_trapped,
        people_count: parsed.people_count,
        locations: parsed.locations.map(sanitizeInput),
        summary: sanitizeInput(parsed.summary),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to parse citizen report:", error);
    return NextResponse.json({ ok: false, error: "Parsing failed." }, { status: 500 });
  }
}