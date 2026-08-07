# 🎤 DEMO DAY CHECKLIST — Disaster Response Intelligence Platform

**Goal:** a flawless 6-minute walkthrough that ends on Admin Analytics with the judges saying "where do I sign up?"
**Demo geography:** Patna (Ganga) · Bharat Shakti Hackathon · Track: AI for Society · PS3

---

## 0. Pre-Flight Checklist (do 30 minutes before going on stage)

> Run these **in order**. Anything marked ⚠️ is critical — skip it and the demo can die on stage.

| # | Check | Command / Where | Critical? |
|---|-------|-----------------|-----------|
| 1 | **Wake up the Python ML server** | `cd ml_service && uvicorn api:app --reload --port 8000` — confirm it boots and the log shows the model loaded. Health probe: `curl http://127.0.0.1:8000/docs` (or `/predict` via the app). | ⚠️ yes |
| 2 | **Run the demo-reset script** (wipes test clutter, seeds the Hero Scenario) | `npm run demo:reset` — expect the green "✅ Hero Scenario ready" summary (1 critical prediction, 3 shelters, 5 allocations…). | ⚠️ yes |
| 3 | **Check OpenRouter API credits** (powers the AI Commander) | Log in to openrouter.ai → Settings → Credits. Need enough for ~20 calls (`$0.10`+). Also confirm `OPENROUTER_API_KEY` is in `.env`. | ⚠️ yes |
| 4 | Start the Next.js app | `npm run dev` → open `http://localhost:3000`. | ⚠️ yes |
| 5 | Set demo mode (don't burn Twilio credits) | `.env` → `NEXT_PUBLIC_DEMO_MODE=true`. Restart the app if you changed it. | yes |
| 6 | Confirm the database is reachable | `curl http://localhost:3000/api/health` → expect `{"status":"healthy","db":"connected"}`. If `db:"disconnected"`, the app still works on mocks, but the demo-reset didn't actually seed. | yes |
| 7 | Run the E2E smoke test (60 seconds of insurance) | `npx playwright test` → expect **1 passed**. | nice |
| 8 | Pre-warm the heavy routes (kills first-load lag on stage) | Visit once, in order: `/command-center` → `/ai-planner` → `/field` → `/analytics` → `/alerts`. Let the map tiles finish loading. | nice |
| 9 | Run unit tests once | `npm test` → 132 passed. (Show this number to judges if asked about quality.) | nice |
| 10 | Charge the phone + enable browser device emulation (Ctrl+Shift+M / Cmd+Shift+M) | Needed for the Mobile Field app segment. | nice |
| 11 | Mute notifications; close Slack/WhatsApp; fullscreen the browser (F11) | Distraction control. | yes |
| 12 | Have the .env + repo open in a second tab | Judges love seeing you can answer "what stack is this?" instantly. | nice |

---

## 1. The Demo Script — Minute by Minute (6:00 total + Q&A)

> **Golden rule:** *show*, then *say*. Click first, narrate second. Every screen should end on the most impressive visual before you move on.

### ⏱ 0:00–0:30 — Landing & One-Liner
- **Screen:** `/` (landing page)
- **Say:** "We built an AI-powered emergency operations center that predicts floods, plans evacuations, and moves resources — before disaster strikes. Demo district: Patna, on the Ganga."
- **Do:** point at the pulsing red beacon; mention **24×7 data ingestion** with automatic fallback.

### ⏱ 0:30–2:30 — 🌊 The Map (Command Center) — *"The Situation"*
- **Screen:** `/command-center` (guest mode if needed: login → "Continue as Guest (Demo)")
- **Narrative spine:** "This is what a district control room sees."
1. **Flood risk zones** — click a red/purple zone → popup shows risk level + **affected population estimate**. (Layer toggle: Flood Risk Zones / Shelters / Resources.)
2. **Time slider** — drag 24h → 72h → show flood *progression*.
3. **Live conditions panel** — rainfall, river level, discharge; point out the "Fallback" chip if the API is down (it's a feature, not a bug — say "our synthetic fallback keeps the demo alive").
4. **What-If Simulator** — crank rainfall to 150mm → watch the zones spread. *This is your "wow" moment on the map.*
5. **Road Closure Tool** — drop a closure pin on the active evacuation route → watch it turn red + **auto-reroute** with the "CRITICAL · REROUTING" toast. *Second wow.*
6. **Run Smart Allocation** — assigns the mock village to the nearest shelter with capacity.
7. **Measure tool** — draw 2–3 points → live km/km² readout (flood extent estimation).
8. **AlertSimulator** — fire a simulated critical alert → map frame flashes + beeps.
9. **Share Alert** — open the share card (screenshot download) — "one tap to broadcast to WhatsApp."

> **Exit cue:** end on the critical-zone pulse animation.

### ⏱ 2:30–3:30 — 🧠 The AI Commander (AI Planner) — *"The Brain"*
- **Screen:** `/ai-planner`
- **Narrative spine:** "The same data, asked in plain English."
1. Click a quick prompt chip: **"Plan evacuation for Patna district."**
2. Watch it **stream** the plan live (this is tool-calling in action — mention it).
3. Expand **Sources** — "it pulled from the flood prediction, shelter DB, and resource DB."
4. Ask a follow-up: "Which shelter has the most capacity left?" — **conversation memory** carries context.
5. Hit **thumbs up** on the plan (feedback loop).

> **Exit cue:** end on a rendered numbered action plan.

### ⏱ 3:30–4:30 — 📱 The Field Responder App — *"The Boots on the Ground"*
- **Screen:** `/field` — **enable device emulation now** (phone viewport)
- **Narrative spine:** "The command center is only as good as its data from the field."
1. **Offline mode** — DevTools → Network → Offline → the **OfflineBanner** appears and cached data is still usable. Go back online — queued writes **replay**.
2. **SOS Panic Button** — tap → sends GPS location to the control room.
3. **Voice Field Note** — tap the mic, dictate (or "Simulate Voice Input") → auto-tagged "Flood / Water".
4. **GPS Check-in** — auto-check-in with location.
5. **Shelter occupancy update** — mark Riverside High School full → watch it sync (this updates the map's shelter markers).
6. **Request Resources** — submit a critical boat request → shows on the dispatch console.
7. **Emergency Recall Banner** — broadcast from the admin side reaches this screen instantly (if time).

> **Exit cue:** flip back to desktop view.

### ⏱ 4:30–5:30 — 🛠 Admin Analytics & Control — *"The Commander's Desk"* (FINISH HERE)
- **Screens, in order:** `/dashboard` → `/analytics` → `/audit-logs` → `/health`
- **Narrative spine:** "And the district magistrate's layer — control, oversight, and proof."
1. **`/dashboard`** — KPIs (people at risk, shelters open, resources deployed), gap analysis table, disaster timeline, sit-rep generator (one click → printable summary).
2. **`/analytics`** — platform usage: active users, alert delivery rates, AI query volume.
3. **`/audit-logs`** — "every privileged action is recorded — who acknowledged which alert, when."
4. **`/health`** — system health: API status, DB, ML model, ingestion pipeline — all green.
5. **Simulation Mode** (optional 20s) — toggle a training scenario in a sandbox that doesn't touch production.

> **Exit cue:** end on the green System Health page — "everything green, ready for duty."

### ⏱ 5:30–6:00 — Close
- **Say:** "Predict → Plan → Move → Alert → Verify. One platform from river gauge to field responder. Thank you."
- Have **backup screenshots** of every screen above in a folder, in case a demo breaks.

---

## 2. Fallback Playbook (if something dies on stage)

| If… | …then |
|-----|-------|
| ML server is down | Map shows "Model offline · defaulted" — say: *"our deterministic fallback keeps the demo alive"* and keep going. |
| Database unreachable | Everything already falls back to rich mock data (shelters, reports, alerts). The demo-reset may not have run — that's fine, the map mock is pre-seeded. |
| OpenRouter credits exhausted | AI Planner still works for **tool-calling** (flood/shelter/resource lookups); only the free-text generation degrades. Or use a backup `GROQ_API_KEY`/`BLUESMINDS_API_KEY` (failover is built in). |
| Twilio sends real SMS | Can't happen — `NEXT_PUBLIC_DEMO_MODE=true` bypasses SMS with "DEMO MODE: SMS bypassed". |
| Map tiles don't load (no internet) | Canvas still renders zones/lines; keep the LAN/hotspot connected. |
| Guest mode blocked | `Continue as Guest (Demo)` on `/login` — guests get a read-only command center instantly. |
| Judge asks "is it secure?" | Point to `/trust` (privacy page), RLS policies, data isolation, rate limiting, audit logs — see `docs/SECURITY_COMPLIANCE.md`. |

---

## 3. Judges' Ammo (numbers to cite)

- **132 unit/integration tests passing** + a Playwright E2E critical-path test (`npm run test:e2e`).
- **5 APIs orchestrated:** weather/flood ingestion, XGBoost flood model (FastAPI), OpenRouter LLM with tool-calling, pgvector RAG, Twilio (demo-bypassed).
- **30-phase plan, 22 built + QA + deployment hardening** — all in git history with clean feature commits.
- **Security:** Postgres RLS + district-scoped AI guardrails + rate limiting + PII redaction + audit trail.
- **Resilience:** synthetic fallback for weather, ML, and embeddings — the demo cannot go dark.

---

## 4. After the Demo

- [ ] Reset data for the next session: `npm run demo:reset`
- [ ] Turn `NEXT_PUBLIC_DEMO_MODE` off if you want real SMS on the final day
- [ ] Save screenshots + the demo video
- [ ] Push the repo (`git remote add origin <url>` + `git push -u origin main`)
