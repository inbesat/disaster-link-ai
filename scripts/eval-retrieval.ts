// ---------------------------------------------------------------------
// scripts/eval-retrieval.ts
// Phase 15 item 7 — retrieval recall evaluation script.
//
// Measures recall@k (the fraction of known-good chunks returned) against a
// hand-labelled set of sample emergency queries mapped to the seeded SOPs.
// Runs entirely offline against the seeded knowledge base, so it works in CI
// and during a demo without an OpenAI key or a live database.
//
//   Run:  npm exec tsx scripts/eval-retrieval.ts
//   Env:  TOP_K (default 3) to change the cutoff.
// ---------------------------------------------------------------------

import invariant from "node:assert/strict";

// The seeded knowledge base (mirrors supabase/migrations/0011). Queries are
// mapped to the relevant SOP(s); a query "hits" if at least one expected doc
// appears in the top-k results.
type KnowledgeDoc = { title: string; docType: string; content: string };

const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    title: "Flood Evacuation Standard Operating Procedure",
    docType: "procedure",
    content:
      "In a CRITICAL flood risk, the District Control Room must: 1) Immediately place affected riverside wards under EVACUATE status via the Command Center. 2) Activate the Mass Evacuation Planner and assign evacuees to the nearest open shelter within 10 km. 3) Deploy buses and NDRF boats. 4) Broadcast an alert to responders by SMS and browser push. 5) Track convoys until all villages are marked COMPLETE.",
  },
  {
    title: "Shelter Management & Capacity Protocol",
    docType: "procedure",
    content:
      "Shelters accept evacuees while occupancy is below capacity. When occupancy reaches capacity, set status to FULL and route evacuees to the next nearest open shelter. Maintain water, food, medical kits, and power.",
  },
  {
    title: "Critical Alert Distribution Rules",
    docType: "procedure",
    content:
      "Critical alerts (risk_level CRITICAL or EVACUATE) are texted via SMS to all field responders and broadcast to the in-app notification center and browser push. Alerts are de-duplicated to one per district per 6 hours.",
  },
  {
    title: "Flood Risk Levels and Responses",
    docType: "report",
    content:
      "Risk levels GATE: SAFE no action; WATCH continue weather monitoring, pre-position boats; WARNING prepare evacuation and notify vulnerable villages; EVACUATE move people to shelters immediately.",
  },
];

type QueryCase = { query: string; expectedDocs: string[] };

const CASES: QueryCase[] = [
  {
    query: "What is the evacuation protocol for floods?",
    expectedDocs: ["Flood Evacuation Standard Operating Procedure"],
  },
  {
    query: "Which shelters accept evacuees and when do we close one?",
    expectedDocs: ["Shelter Management & Capacity Protocol"],
  },
  {
    query: "How are critical alerts broadcast to field responders?",
    expectedDocs: ["Critical Alert Distribution Rules"],
  },
  {
    query: "risk levels safe watch warning evacuate",
    expectedDocs: ["Flood Risk Levels and Responses"],
  },
  {
    query: "evacuate vulnerable riverside villages",
    expectedDocs: ["Flood Evacuation Standard Operating Procedure"],
  },
  {
    query: "when is a shelter marked full",
    expectedDocs: ["Shelter Management & Capacity Protocol"],
  },
];

// ---------------------------------------------------------------------
// Minimal token-overlap scorer (recall baseline without pgvector).
// Scores a query against a doc by the fraction of query terms it contains.
// ---------------------------------------------------------------------
function tokenize(text: string): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const t of text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)) {
    if (!set.has(t)) {
      set.add(t);
      seen.push(t);
    }
  }
  return seen;
}

function score(query: string, doc: KnowledgeDoc): number {
  const q = tokenize(query);
  const d = new Set<string>(tokenize(`${doc.title} ${doc.content}`));
  if (q.length === 0 || d.size === 0) return 0;
  let hits = 0;
  for (const term of q) if (d.has(term)) hits++;
  return hits / q.length;
}

function retrieveTopK(query: string, k: number): string[] {
  return KNOWLEDGE_BASE.map((doc) => ({ title: doc.title, s: score(query, doc) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((r) => r.title);
}

function runRecall(k: number): { recall: number; passed: Array<{ query: string; hit: boolean; returned: string[] }> } {
  let hits = 0;
  const passed: Array<{ query: string; hit: boolean; returned: string[] }> = [];
  for (const c of CASES) {
    const returned = retrieveTopK(c.query, k);
    const hit = c.expectedDocs.some((t) => returned.includes(t));
    if (hit) hits++;
    passed.push({ query: c.query, hit, returned });
  }
  return { recall: hits / CASES.length, passed };
}

// ---------------------------------------------------------------------
// Live pgvector path (optional): exercises retrieveRelevantDocuments when a
// database is reachable. Skips cleanly otherwise so the script is demo-safe.
// ---------------------------------------------------------------------
async function liveRecall(): Promise<string> {
  try {
    const { retrieveRelevantDocuments } = await import(
      "../lib/retrieval/retrieve"
    );
    let hits = 0;
    for (const c of CASES) {
      const rows = await retrieveRelevantDocuments(c.query, 4);
      if (c.expectedDocs.some((t) => rows.map((r) => r.title).includes(t))) hits++;
    }
    return `live pgvector recall@4: ${hits}/${CASES.length} = ${((hits / CASES.length) * 100).toFixed(0)}%`;
  } catch (error: unknown) {
    return `live pgvector recall: skipped (${(error as Error).message})`;
  }
}

async function main() {
  const k = Number(process.env.TOP_K) || 3;
  const { recall, passed } = runRecall(k);

  console.log(`\nRetrieval recall evaluation (offline, top-${k})`);
  console.log("=".repeat(72));
  for (const row of passed) {
    const mark = row.hit ? "PASS" : "FAIL";
    console.log(`  [${mark}] "${row.query}"`);
    console.log(`        returned: ${row.returned.join(" | ") || "(none)"}`);
  }
  console.log("=".repeat(72));
  console.log(`Recall@${k}: ${recall.toFixed(2)} (${(recall * 100).toFixed(0)}%)`);
  console.log(await liveRecall());

  // Guard: recall must clear the demo bar (>= 0.8) to be trustworthy.
  invariant(recall >= 0.8, `Recall@${k} fell below 0.80 threshold (got ${recall.toFixed(2)})`);
  console.log(`\nOK — recall meets the 0.80 threshold.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});