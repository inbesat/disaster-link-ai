# 🗣️ Phase 12 — Q&A Prep (Judge Edition)

**Project:** DisasterLink AI — Bharat Shakti Hackathon · **Contact:**
DisasterLink AI — Bharat Shakti Hackathon (team leads on the submission page)

Anticipated questions, with the honest, specific answers. Every number cited
below is real behaviour in the codebase — rehearse the short form out loud.

---

## Q1 — "How big is the model? What if my phone can't handle it?"

**Short:** *Three tiers — Cloud-only, Balanced (~600 MB) and Full (~1.3 GB).
The device's RAM, WebGPU and storage are checked first, and we recommend the
tier that fits.*

**Detail:**
- Capability check at setup reads RAM, WebGPU support and free storage and
  recommends a tier — a low-end phone gets the Balanced model or Cloud-only.
- The model streams in 4 MB chunks with resume, so a flaky network doesn't
  restart the download.
- It runs in a **Web Worker** — the UI thread never blocks, and it's
  unloaded when the tab is backgrounded.

---

## Q2 — "Doesn't the battery die running AI on-device?"

**Short:** *We gate it. Below 20% battery, background sync pauses; below 15% the
model goes idle. Charging resumes everything automatically.*

**Detail:**
- Battery gate (`lib/perf/battery-gate.ts`): sync pauses under 20% unless
  charging, retries every 5 minutes.
- Model lifecycle: lazy-load on first use, idle-unload, unload on background —
  no constant inference churn.
- Demo: Demo Controls → **Simulate Low Battery** shows the pause live.

---

## Q3 — "What if the AI gives wrong or dangerous advice during a flood?"

**Short:** *Every answer is confidence-scored and cross-checked against the
cached data, and every answer has a "Report Incorrect" button that feeds back
to the district team.*

**Detail:**
- Answers cite their sources (which cached dataset they came from) and carry a
  confidence score; low-confidence answers refuse with a "contact the control
  room" fallback instead of guessing.
- The offline assistant uses a **rule-based fallback of 50+ scenarios** when the
  model is unavailable, so the app never gives a confident wrong answer from a
  broken model.
- Demo: Demo Controls → **Corrupt Model** shows the self-heal + safe fallback.

---

## Q4 — "How do I know the cached data isn't stale?"

**Short:** *Every cached record carries a freshness timestamp and a 48-hour
expiry — nothing silently goes stale, and it's all visible on the sync log.*

**Detail:**
- Each dataset row stores `cachedAt` + `expiresAt`; the data-health widget turns
  amber/red when a dataset is old, and freshness timestamps are shown per card.
- 48-hour offline window is the design target (matches the "digital emergency
  kit" pitch).
- Demo: **Clear All Cache** resets freshness to "never synced" and re-sync
  restores timestamps — great live proof.

---

## Q5 — "What about people who don't have a smartphone?"

**Short:** *Alerts ride the networks people actually have — FM radio reaches 65%
of rural India, and SMS works on any feature phone, including JioPhone.*

**Detail:**
- CAP-feed broadcast to FM stations (API push → RDS text → IVR fallback to the
  station control room) — see `docs/FM_BROADCAST_PITCH.md`.
- SMS alert channel with a demo bypass so the pitch never sends real texts;
  feature-phone users still get the evacuation message.
- On-device assistant is a *complement*, not the only path — the offline cache
  and rule-based fallback make the app useful even mid-outage.

---

## Q6 — "Is this actually offline, or are you cheating with a mock?"

**Short:** *Genuinely offline — airplane mode with the network killed. The AI
model and all cached data are on the device; we'll demo it with the network
switched off, not a mock toggle.*

**Detail:**
- The orange **"Offline — Using cached data"** bar is driven by a real
  connectivity monitor (browser network + backend heartbeat), and the Demo
  Control "Simulate Offline" forces that same path.
- Unit suite: 1157+ tests passing (`npx vitest run`), `tsc` and eslint clean —
  the offline primitives (Dexie, model store, connectivity, battery gate) are
  individually tested.

---

## Quick-recall table

| Concern | One-liner |
|---------|-----------|
| Model too big | Tiers 600 MB–1.3 GB, capability-checked, Web Worker |
| Battery | Battery gate pauses sync <20%, resumes on charge |
| Wrong advice | Confidence scores + cited sources + "Report Incorrect" |
| Stale data | Freshness timestamps + 48 h expiry + amber warnings |
| No smartphone | FM/CAP + SMS, feature-phone friendly |
| Is it real | Airplane-mode live demo, 1157+ tests, tsc/eslint clean |