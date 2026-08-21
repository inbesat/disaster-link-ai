# SafeSphere — Demo Day Safety Net & Contingency Plan

**Goal:** Guarantee 100% demo success during live presentations and judging rounds regardless of network drops, service outages, or hardware glitches.

---

## 1. Safety Net Checklist & Contingencies

### 🎥 1. Backup Demo Video
- **Backup Location:** Pre-loaded local MP4 file on demo laptop (`~/Desktop/SafeSphere_6Min_Walkthrough_HD.mp4`) + Unlisted YouTube / Drive mirror (`https://safesphere.org/demo-backup-video`).
- **Trigger Condition:** Severe Wi-Fi failure or unresolvable browser freeze.
- **Protocol:** Switch screen share / HDMI input to media player, play video with audio, and narrate live over the pre-recorded footage.

### ⚡ 2. Demo Data Reset Script (1 Command, 10 Seconds)
- **Command:** `npm run demo:reset`
- **Script Location:** `scripts/seed-demo.ts` / `scripts/demo-reset.ts`
- **Execution Time:** ~8 seconds
- **Result:** Wipes test clutter, seeds Patna Ganga flood scenario (1 critical prediction, 3 active shelters, 5 fleet allocations, live alert logs) and prints green verification summary:
  ```bash
  ✅ Hero Scenario ready: Patna Ganga District
  ```

### 🏛 3. Judges' Sandbox Link (Read-Only, No Login Required)
- **URL:** `https://safesphere.org/command-center?guest=true` (or click **"Continue as Guest (Demo)"** on `/login`)
- **Access Level:** Read-only command center view with live map layer toggles, simulated alert triggers, and shelter occupancy indicators.
- **Security Guardrail:** Guest mode locks administrative mutations, SMS dispatching, and sensitive PII access while preserving interactive map exploration.

### 📱 4. QR Code for Judges
- **Target URL:** `https://safesphere.org` (Mobile Field Responder & Citizen Alert view)
- **Generation:** Printed 5x5 inch laminated cards placed on judges' table + digital QR code on screen at `/settings/integrations` or landing page modal.
- **Quick Test:** Judges scan QR code with smartphone camera → immediately opens responsive mobile view with PWA offline capabilities pre-loaded.

### 📶 5. Venue Internet & Mobile Hotspot Backup
- **Primary:** Venue Wi-Fi (pre-tested 30 minutes prior to presentation).
- **Secondary Backup:** Dedicated 5G Mobile Hotspot (iPhone/Android hotspot enabled and pre-connected as saved network on demo laptop).
- **Offline Fallback:** SafeSphere's built-in offline PWA caching (`dexie` IndexedDB store) and synthetic weather/flood data generator allow 90% of the UI to function without active internet.

### 💻 6. Local Dev Server Ultimate Fallback
- **Command:** `npm run dev` running locally on `http://localhost:3000`.
- **Python ML Service:** `cd ml_service && uvicorn api:app --port 8000` running in second terminal tab.
- **Fallback Behavior:** If Vercel or cloud Supabase is unreachable, local server uses cached mock state and local SQLite/Prisma mock adapters to drive the entire 6-minute presentation seamlessly.

### 👁 7. Team Member Sentry Monitoring Assignment
- **Assigned Role:** Co-presenter / Logistics Lead
- **Dashboard:** Sentry Real-Time Issues Stream open on second screen or tablet.
- **Action Plan:** If an error occurs on stage, co-presenter inspects exception tag in Sentry (`/monitoring/sentry.ts`) and silently notifies speaker via signal if provider failover was triggered.

---

## 2. Emergency Trigger Protocol Summary

| Scenario | Primary Fix | Fallback Action | Maximum Delay |
|----------|-------------|-----------------|---------------|
| **Wi-Fi Disconnects** | Switch to 5G Hotspot | App enters offline mode; Dexie cache serves map & field data | 3 seconds |
| **OpenRouter LLM Rate Limit** | Provider chain auto-switches to Groq/Bluesminds | FallbackEngine provides structured SOP plan | 0 seconds (auto) |
| **Database Connection Fail** | App switches to local synthetic mock state | Narrate "synthetic fallback mode active for field resilience" | 0 seconds (auto) |
| **Total Hardware / OS Crash** | Restart laptop | Switch HDMI to backup tablet with pre-recorded video | 15 seconds |
