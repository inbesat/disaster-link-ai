# 🧪 Phase 12 — Full Testing Protocol (Offline-First Demo)

**Project:** DisasterLink AI — Bharat Shakti Hackathon
**Goal:** prove the offline-first claims on stage: the app survives airplane
mode, a fresh install with no network, partial sync, corrupted model files, a
dying battery and a storage crisis — without a crash or a blank screen.

Use the **Demo Controls** panel (Settings → *Testing & Demo* → **Demo Mode** →
red "Demo" tab, left edge) to simulate most of these without touching the
device. Each scenario ends with **Pass** / **Fail** columns — a Fail means:
write what you saw, then re-run once after a refresh before reporting it.

---

## 0. Pre-flight (once per session)

| # | Step | How |
|---|------|-----|
| 1 | Start the app | `npm run dev` → `http://localhost:3000` |
| 2 | Confirm baseline tests | `npx vitest run` → expect **1157+ passed** (only 3 known pre-existing `navigation.test.ts` failures) |
| 3 | Typecheck + lint | `npx tsc --noEmit` clean · `npx eslint <changed files>` clean |
| 4 | Enable Demo Mode | `/public/settings` → **Testing & Demo** → toggle **Demo Mode** ON |
| 5 | Charge the device + close background apps | a clean browser window, fullscreen (F11) |

> The single most important backup: **record a full offline walkthrough video**
> (airplane mode → every screen still works). See §7. Judges' dev machines are
> unpredictable; a 3–4 minute screen recording is your safety net.

---

## 1. ✈️ Test 1 — Airplane Mode (the headline claim)

> Claim: *"When the towers fall, the app keeps working."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 1.1 | Fully load the app online first (let one sync finish) | Sync log shows a successful sync; freshness "just now" | | |
| 1.2 | Enable **Simulate Offline** in Demo Controls (or real airplane mode) | Orange **"Offline — Using cached data"** bar appears; app does NOT error | | |
| 1.3 | Open `/public/alerts` | Cached alerts render with severity + timestamps | | |
| 1.4 | Open `/public/map` | Cached district map tiles render ("Offline Map Active" badge) | | |
| 1.5 | Open `/public/ai` and ask **"What should I pack?"** | Nova answers from the local model — no network call, no error | | |
| 1.6 | Trigger the **SOS** flow | SOS queues locally (pending badge) instead of failing | | |
| 1.7 | Click **Restore Network** | Orange bar clears; queued SOS + writes replay | | |

**Exit cue for the pitch:** leave it on step 1.5 — a working AI chat with zero
network. That is the 10-second money shot.

---

## 2. 🆕 Test 2 — Fresh Install (first-time user, no network)

> Claim: *"A digital emergency kit that works before you even sign up."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 2.1 | Clear the site's data (or open a fresh/incognito window) | Looks like a brand-new user | | |
| 2.2 | In Demo Controls, press **Reset to First-Time User** | Routes to `/public/onboarding` with nothing cached | | |
| 2.3 | Simulate offline BEFORE finishing setup | Onboarding still completes (guest mode, no login wall) | | |
| 2.4 | Land on `/public/dashboard` offline | Dashboard renders with canned safety data, weather carousel, emergency dial | | |
| 2.5 | Set location → district saves | Preference survives refresh | | |
| 2.6 | Open the AI setup flow | Recommended tier shown; download starts once network returns | | |

---

## 3. 🔁 Test 3 — Partial Sync / 48-Hour Freshness

> Claim: *"Every cached record shows how fresh it is — nothing silently goes
> stale."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 3.1 | Confirm the freshness indicators | Each dataset shows "last synced X min/hours ago" | | |
| 3.2 | Press **Clear All Cache** in Demo Controls | Toast confirms the wipe; freshness resets to "never synced" | | |
| 3.3 | Stay offline | App still renders from empty cache gracefully (empty states, not errors) | | |
| 3.4 | Restore network | Partial re-sync fills only what was cleared; freshness timestamps come back | | |
| 3.5 | Leave the app offline for >48h window (simulated) | Old-but-valid cached data still readable; sync log marks the gap | | |

---

## 4. 💥 Test 4 — Model Corruption & Self-Healing

> Claim: *"A corrupted model is detected and re-downloaded — it doesn't brick
> the AI."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 4.1 | (Pre-req) download the Full tier once | Storage screen shows model "Complete" | | |
| 4.2 | Press **Corrupt Model** in Demo Controls | Half the chunks are deleted; toast says integrity check will re-download | | |
| 4.3 | Open storage / model settings | Integrity check flags the gap (verifyChunkHashes) and starts re-downloading | | |
| 4.4 | Ask Nova a question while chunks are missing | Graceful "model repairing — using fallback answers" state, no crash | | |
| 4.5 | Re-download completes | Model reports "Complete" again; Nova answers normally | | |

---

## 5. 🔋 Test 5 — Low Battery (sync gate)

> Claim: *"Background sync pauses at 15% to save your dying battery, and resumes
> automatically."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 5.1 | Press **Simulate Low Battery** in Demo Controls | Sync engine pauses (battery gate active) — toast confirms 15% | | |
| 5.2 | Try a manual refresh / sync | Sync is deferred, not erroring — a "paused for battery" notice shows | | |
| 5.3 | Press **Restore Battery** | Sync resumes on its own (no manual action) | | |

---

## 6. 📦 Test 6 — Storage Stress (the 200 MB budget)

> Claim: *"Cached data is managed against a 200 MB budget — maps evict by LRU,
> the model frees on demand."*

| Step | Action | Expected result | Pass | Fail |
|------|--------|-----------------|:----:|:----:|
| 6.1 | Open Storage Pressure card | Shows used/available + budget line | | |
| 6.2 | Pan the public map offline (loads many tiles) | LRU eviction kicks in — oldest tiles drop, newest stay | | |
| 6.3 | Visit `/debug/performance` | Performance budget panel: storage bytes, cache hit rate, AI latency all within budget | | |
| 6.4 | Delete the model via storage settings | ~1.3 GB frees; app keeps working (fallback answers) | | |

---

## 7. 🎥 Backup — Offline Mode Screen Recording

> **The agent cannot produce this file — it must be recorded on the demo
> machine.** Do it once, before show day.

1. Open the app, let it sync fully.
2. Start **OBS** (or Chrome DevTools → Recorder) at 1080p.
3. Enable **Simulate Offline** → walk `/public/dashboard` → `/public/alerts` →
   `/public/map` → `/public/ai` (ask one question) → trigger an SOS → **Restore
   Network** → show the sync replay.
4. Save as `docs/demo-offline-backup.mp4` (~3–4 min). Keep a copy on a USB
   stick — never rely on show-day Wi-Fi.

---

## 8. Pass gates

- [ ] Tests 1–6 each have **≥90% of steps ticked Pass**
- [ ] No console `error` or red screen during any scenario
- [ ] Offline recording backed up (§7)
- [ ] `npx vitest run` green (1157+ passed)
- [ ] `npx tsc --noEmit` and eslint clean