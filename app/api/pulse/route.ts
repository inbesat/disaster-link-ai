import { NextResponse } from "next/server";
import { safeLog } from "@/lib/logger";

// ---------------------------------------------------------------------
// /api/pulse — Live Disaster Pulse for the public transparency panel.
//
// Aggregates two feeds server-side (keys never reach the browser):
//   • NewsData.io  — Indian disaster headlines (flood/cyclone/earthquake)
//   • USGS         — global earthquakes ≥ M4.5 (free GeoJSON feed)
//
// Module-level 5-minute cache protects third-party quotas. Each source
// degrades independently and reports its own "live" | "unavailable"
// status so the widget can show honest provenance instead of failing.
// ---------------------------------------------------------------------

export const dynamic = "force-dynamic";

type PulseNewsItem = { title: string; source: string; pubDate: string; link: string };
type PulseQuake = { place: string; magnitude: number; timeMs: number };

type PulsePayload = {
  ok: true;
  news: { status: "live" | "unavailable"; items: PulseNewsItem[] };
  quakes: { status: "live" | "unavailable"; items: PulseQuake[] };
  fetchedAt: string;
};

const CACHE_TTL_MS = 5 * 60_000;
const NEWS_TIMEOUT_MS = 8_000;
const QUAKES_TIMEOUT_MS = 8_000;

let cache: { payload: PulsePayload; at: number } | null = null;

async function fetchNews(apiKey: string): Promise<{ status: "live" | "unavailable"; items: PulseNewsItem[] }> {
  if (!apiKey || apiKey.length < 20) {
    return { status: "unavailable", items: [] };
  }
  try {
    const url =
      "https://newsdata.io/api/1/news?apikey=" + encodeURIComponent(apiKey) +
      "&q=flood%20OR%20cyclone%20OR%20earthquake&country=in&language=en&size=6";
    const res = await fetch(url, { signal: AbortSignal.timeout(NEWS_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      status?: string;
      results?: Array<{ title?: string; source_id?: string; pubDate?: string; link?: string }>;
    };
    const items: PulseNewsItem[] = (data.results ?? [])
      .filter((r): r is typeof r & { title: string } => Boolean(r.title))
      .slice(0, 6)
      .map((r) => ({
        title: r.title.slice(0, 160),
        source: (r.source_id ?? "newsdata").slice(0, 40),
        pubDate: r.pubDate ?? "",
        link: r.link ?? "",
      }));
    return items.length > 0 ? { status: "live", items } : { status: "unavailable", items: [] };
  } catch (error: unknown) {
    safeLog("warn", `[pulse] news feed failed: ${String(error)}`);
    return { status: "unavailable", items: [] };
  }
}

async function fetchQuakes(feedUrl: string | undefined): Promise<{ status: "live" | "unavailable"; items: PulseQuake[] }> {
  if (!feedUrl) return { status: "unavailable", items: [] };
  try {
    const res = await fetch(feedUrl, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(QUAKES_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      features?: Array<{ properties?: { mag?: number | null; place?: string; time?: number } }>;
    };
    const items: PulseQuake[] = (data.features ?? [])
      .map((f) => ({
        magnitude: typeof f.properties?.mag === "number" ? f.properties.mag : -1,
        place: f.properties?.place ?? "Unknown location",
        timeMs: typeof f.properties?.time === "number" ? f.properties.time : Date.now(),
      }))
      .filter((q) => q.magnitude >= 4.5)
      .sort((a, b) => b.timeMs - a.timeMs)
      .slice(0, 5);
    return { status: "live", items };
  } catch (error: unknown) {
    safeLog("warn", `[pulse] quake feed failed: ${String(error)}`);
    return { status: "unavailable", items: [] };
  }
}

export async function GET(): Promise<NextResponse> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.payload, cached: true });
  }

  const [news, quakes] = await Promise.all([
    fetchNews(process.env.NEWSDATA_API_KEY),
    fetchQuakes(process.env.USGS_EARTHQUAKE_FEED_URL),
  ]);

  const payload: PulsePayload = {
    ok: true,
    news,
    quakes,
    fetchedAt: new Date().toISOString(),
  };
  cache = { payload, at: Date.now() };
  return NextResponse.json(payload);
}
