# 🎤 Phase 12 — 2-Minute Demo Script (Offline-First)

**Presenters:** DisasterLink AI — Bharat Shakti Hackathon
**Golden rule:** *show, then say.* Click first, narrate second. End every beat
on the most visual thing on screen.

Open the **Demo Controls** panel first (Settings → Testing & Demo → Demo Mode →
red "Demo" tab) so every scenario below is one tap away.

---

| Time | Beat | Screen | Say (≈30 words each) | Do |
|------|------|--------|----------------------|----|
| **0:00–0:15** | The hook | `/` landing | "Most disaster apps die when the towers fall. When the network goes down in a flood, the app that depends on the cloud dies with it. Ours doesn't." | Point at the red beacon. |
| **0:15–0:35** | The digital emergency kit | `/public/dashboard` (guest) | "This is a digital emergency kit — it works before you even sign up. Alerts, shelters, family contacts, and an AI assistant, all on-device." | Show the safety card, weather carousel, emergency dial. |
| **0:35–1:00** | Airplane mode | Demo Controls → **Simulate Offline** | "Watch what happens when I cut the network — right now." | Tap Simulate Offline. Orange "Offline — Using cached data" bar drops. Pause for effect. |
| **1:00–1:20** | It still works offline | `/public/map` → `/public/ai` | "The map tiles, the alerts, the routing — all cached for 48 hours. And the AI assistant? It runs right here in the browser — a 1.3 GB safety model, no cloud." | Pan the cached map, then ask Nova "What should I pack?" and let it stream. |
| **1:20–1:40** | Self-healing + sync | Demo Controls → **Restore Network** → freshness card | "The moment connectivity returns, everything re-syncs — and every record shows exactly how fresh it is. Nothing silently goes stale." | Restore Network; point at the freshness timestamps + sync replay. |
| **1:40–2:00** | The close | Health / debug panel | "FM radio reaches 65% of rural India — more than smartphones. So we built for the networks people actually have: 48-hour offline cache, a browser AI that needs no internet, and a rule-based fallback that answers even when the model is gone. When the towers fall, DisasterLink is still standing." | Fade to the performance budget panel if time allows. |

---

## Talking points to weave in (have these memorised)

- **FM radio reaches 65% of rural India** — more than smartphones; our alerts
  ride the networks people actually have.
- **48-hour cache** — every dataset survives a 2-day outage with freshness
  timestamps.
- **600 MB–1.3 GB local AI** — Balanced vs Full tier; runs in a Web Worker so
  the UI never freezes.
- **Rule-based fallback** — 50+ scenarios answered locally even with the model
  deleted; the AI never goes fully silent.
- **Digital emergency kit** — works before sign-up, in airplane mode, on a
  dying battery.

## Exit-cue cheat sheet

- Best screen to leave up at the 2-minute mark: **the offline AI chat streaming
  an answer with zero network.**
- If anything dies: say *"and that's exactly the failure our system handles —
  watch this"* and hit the matching Demo Control. Every crash is a demo beat.