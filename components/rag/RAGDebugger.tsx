"use client";

import { useState } from "react";
import { Loader2, Search, Terminal } from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------
// components/rag/RAGDebugger.tsx
// Transparency/grounding debugger — shows judges the exact SOP chunks that
// vector search retrieves for a query (with cosine similarity), i.e. proves
// how the AI "knows" what it knows.
// ---------------------------------------------------------------------

const DISTRICTS = ["All districts", "Patna", "Ernakulam", "Kamrup", "Kochi", "Guwahati"];

type RetrievedChunk = {
  title: string;
  content: string;
  docType: string | null;
  score: number;
};

type SearchPayload = {
  ok: boolean;
  results: RetrievedChunk[];
};

function scoreColor(score: number): string {
  if (score >= 0.8) return "text-severity-green-400";
  if (score >= 0.6) return "text-severity-amber-400";
  return "text-severity-red-400";
}

export default function RAGDebugger() {
  const [query, setQuery] = useState("How do I evacuate a riverside ward?");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RetrievedChunk[] | null>(null);
  const [json, setJson] = useState("");
  const [tookMs, setTookMs] = useState<number | null>(null);

  async function runSearch() {
    if (!query.trim()) {
      toast.error("Enter a query to test retrieval.");
      return;
    }
    setLoading(true);
    setJson("");
    setData(null);
    setTookMs(null);
    const started = performance.now();

    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          district: district === DISTRICTS[0] ? null : district,
          topK,
        }),
      });
      const payload = (await res.json()) as SearchPayload;
      setTookMs(Math.round(performance.now() - started));
      setData(payload.results);
      setJson(JSON.stringify(payload, null, 2));
    } catch {
      toast.error("Search failed.");
      setJson("Error: search request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-eoc border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-accent" aria-hidden />
        <p className="eoc-label text-accent">RAG DEBUGGER · TRANSPARENCY</p>
      </div>
      <h2 className="mt-1 text-lg font-bold">Test RAG Retrieval</h2>
      <p className="mt-1 text-xs text-slate-400">
        Type a question to see the exact SOP chunks the AI planner would be
        grounded on, ranked by cosine similarity.
      </p>

      {/* Controls */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
            placeholder="e.g. How do I triage casualties before evacuation?"
            className="h-11 w-full rounded-lg border border-border bg-surface-muted pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-sm outline-none focus:border-accent"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-sm outline-none focus:border-accent"
        >
          {[1, 3, 5].map((k) => (
            <option key={k} value={k}>
              Top {k}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => void runSearch()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow-accent transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Searching vectors…
          </>
        ) : (
          "Test RAG Retrieval"
        )}
      </button>

      {/* Results */}
      {!loading && data && data.length > 0 && (
        <div className="mt-5">
          <p className="eoc-label mb-2 text-slate-400">
            {data.length} CHUNK{data.length === 1 ? "" : "S"} · {tookMs}ms
          </p>
          <ul className="space-y-3">
            {data.map((doc, i) => (
              <li
                key={i}
                className="rounded-eoc border border-border bg-surface-muted/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">
                    #{i + 1} · {doc.title}
                  </p>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${scoreColor(
                      doc.score,
                    )}`}
                  >
                    sim {doc.score.toFixed(3)}
                  </span>
                </div>
                {doc.docType && (
                  <p className="eoc-label mt-1 text-slate-500">{doc.docType}</p>
                )}
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border/60 bg-background p-3 font-mono text-[12px] leading-relaxed text-slate-300">
                  {doc.content}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw JSON terminal view */}
      {json && (
        <div className="mt-5 overflow-hidden rounded-eoc border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-severity-red-500" />
            <span className="h-2 w-2 rounded-full bg-severity-amber-500" />
            <span className="h-2 w-2 rounded-full bg-severity-green-500" />
            <span className="ml-2 text-[11px] font-mono text-slate-400">
              response.json
            </span>
          </div>
          <pre className="max-h-64 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-severity-green-300">
            {json}
          </pre>
        </div>
      )}
    </section>
  );
}