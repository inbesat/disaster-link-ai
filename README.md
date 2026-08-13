# SafeSphere — AI-Powered Disaster Response Platform

**Built for the Bharat Shakti Hackathon | Track: AI for Society | Problem Statement 3**

When the waters rise, every minute counts. SafeSphere fuses real-time flood forecasts, geospatial intelligence (PostGIS), multi-channel emergency broadcasting (FM/SMS/Push), and a RAG-driven emergency knowledge base into a single Emergency Operations Center — helping responders decide *where* to evacuate, *what* to deploy, and *whom* to alert before disaster strikes.

Our demo targets **Patna, Bihar** — one of India's most flood-prone districts on the Ganga — for high-fidelity data simulation.

---

## Table of Contents

- [Landing Page](#-landing-page)
- [Dual-Mode Architecture](#-dual-mode-architecture)
- [Government Mode (EOC)](#-government-mode-eoc)
  - [Command Center](#command-center)
  - [Interactive Map](#interactive-map)
  - [AI Emergency Planner](#ai-emergency-planner)
  - [Alert Management](#alert-management)
  - [Shelter Management](#shelter-management)
  - [Resource Inventory](#resource-inventory)
  - [FM Radio Broadcasting](#fm-radio-broadcasting)
  - [Evacuation Planning](#evacuation-planning)
  - [Dispatch Console](#dispatch-console)
  - [AI Advisor Chat](#ai-advisor-chat)
  - [RAG Knowledge Base](#rag-knowledge-base)
  - [Admin Control Panel](#admin-control-panel)
- [Public Mode (Citizen App)](#-public-mode-citizen-app)
  - [Citizen Dashboard](#citizen-dashboard)
  - [Report Submission](#report-submission)
  - [Shelter Finder](#shelter-finder)
  - [Safety Status](#safety-status)
- [Field Responder Mode](#-field-responder-mode)
- [AI & ML Pipeline](#-ai--ml-pipeline)
- [Multi-Channel Alert Broadcasting](#-multi-channel-alert-broadcasting)
- [Offline-First PWA](#-offline-first-pwa)
- [Security Architecture](#-security-architecture)
- [Tech Stack](#-tech-stack)
- [Local Setup](#-local-setup)
- [Folder Structure](#-folder-structure)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Demo Geography](#-demo-geography-patna-bihar)

---

## Landing Page

The two-door landing page lets citizens and government responders enter through separate flows. Citizens get a simplified companion app; responders get the full EOC command center.

<!-- SCREENSHOT: Landing page — full-width hero with two door buttons -->
![Landing Page](docs/screenshots/landing-page.png)

**Features:**
- Two-door entry: "I Need Help" (citizen) / "I'm a Responder" (gov)
- Real-time disaster alert ticker
- Multi-language support (23 Indian languages)
- PWA install prompt for offline access
- Accessibility: high-contrast mode, screen reader support

---

## Dual-Mode Architecture

SafeSphere runs in two distinct modes from the same codebase. The middleware enforces strict crossover guards — citizens can never access gov routes, and gov users see only their district's data.

<!-- SCREENSHOT: Side-by-side comparison of citizen vs gov dashboard -->
![Dual Mode Comparison](docs/screenshots/dual-mode-comparison.png)

| Mode | Identity | Access | Data Scope |
|------|----------|--------|------------|
| **Public** | `role=public` cookie | `/public/*` routes only | District-scoped, PII-sanitized |
| **Gov** | `role=district_admin` / `super_admin` | `/gov/*`, `/admin/*` routes | Full operational data |
| **Field** | `role=field_responder` | `/field/*` routes | Own district, write access |
| **Guest** | `guest_mode=true` cookie | Read-only demo | Mock data, no persistence |

---

## Government Mode (EOC)

The Emergency Operations Center is the primary interface for disaster response coordinators. It provides real-time situational awareness, AI-assisted planning, and multi-channel alert dissemination.

### Command Center

The main dashboard with live metrics, alert feed, and operational status.

<!-- SCREENSHOT: Command Center — dark theme with metrics cards, alert ticker, mini map -->
![Command Center](docs/screenshots/command-center.png)

**Widgets:**
- Active disaster events count
- Shelter occupancy (total/capacity)
- Pending resource requests
- Active alerts by severity
- Field responder locations
- Recent activity timeline

---

### Interactive Map

A full-screen geospatial view powered by MapLibre GL with PostGIS-backed queries.

<!-- SCREENSHOT: Full-screen map with shelter markers, flood zones, evacuation routes -->
![Interactive Map](docs/screenshots/interactive-map.png)

**Layers:**
- Flood risk zones (color-coded by severity)
- Shelter locations (capacity/occupancy indicators)
- Resource depots and movement trails
- Evacuation routes (OSRM-powered)
- Road closures
- Crowdsourced citizen reports
- Real-time weather overlay

**Tools:**
- Distance measurement
- Area selection
- Coordinate picker
- Layer toggle panel
- Fullscreen mode

---

### AI Emergency Planner

LangGraph-powered multi-agent system that generates 48-hour tactical evacuation plans.

<!-- SCREENSHOT: AI Planner — chat interface with plan output and map preview -->
![AI Planner](docs/screenshots/ai-planner.png)

**Capabilities:**
- Flood risk assessment using XGBoost model
- Shelter allocation optimization
- Resource deployment recommendations
- Evacuation route generation
- NDMA guideline compliance checking
- Interactive plan modification via chat

---

### Alert Management

Severity-graded alert system with multi-channel dissemination.

<!-- SCREENSHOT: Alert log — table with severity badges, timestamps, ack status -->
![Alert Management](docs/screenshots/alert-management.png)

**Alert Levels:**
| Level | Trigger | Action |
|-------|---------|--------|
| **Critical** | Flood risk >= Evacuate | Immediate SMS + Push + FM broadcast |
| **Warning** | Flood risk >= Warning | Push notification + email |
| **Watch** | Flood risk >= Watch | In-app notification |
| **Safe** | Risk assessment complete | No alert |

---

### Shelter Management

Real-time shelter tracking with PostGIS-powered nearest-shelter queries.

<!-- SCREENSHOT: Shelter grid — cards with capacity bars, facility badges, map pin -->
![Shelter Management](docs/screenshots/shelter-management.png)

**Features:**
- Live occupancy tracking
- Facility status (water, food, medical, electricity)
- Auto-status: "full" when occupancy >= capacity
- Contact person and phone
- Photo uploads (validated, 5MB max)
- Public API with PII-sanitized responses

---

### Resource Inventory

Track and dispatch emergency resources across districts.

<!-- SCREENSHOT: Resource inventory — sortable table with category icons, status badges -->
![Resource Inventory](docs/screenshots/resource-inventory.png)

**Resource Categories:**
- Boats (NDRF rescue vessels)
- Medical (first-aid kits, medicines)
- Water (bottled water pallets)
- Food (ration packs)
- Personnel (search & rescue teams)
- Power (generators)

**Operations:**
- CSV bulk import
- Individual add/edit/delete
- Dispatch approval workflow
- Movement trail tracking (depot → disaster site)

---

### FM Radio Broadcasting

Multi-strategy FM emergency alert system for areas without internet.

<!-- SCREENSHOT: FM broadcast dashboard — station list, approval queue, audio preview -->
![FM Broadcasting](docs/screenshots/fm-broadcasting.png)

**Broadcast Strategies:**
1. **CAP Alert** — Direct CAP v1.2 XML to station API
2. **RDS Encoding** — Radio Data System text overlay
3. **FTP Drop** — Audio file upload for stations without API
4. **Email to Studio** — SMTP fallback for manual broadcast
5. **TTS Synthesis** — ElevenLabs / Azure Neural / Google Cloud voice generation

**Approval Workflow:**
- Auto-broadcast for Critical alerts (configurable per station)
- Admin approval queue for Warning-level alerts
- One-click approve/reject with audit trail

---

### Evacuation Planning

Generate and compare evacuation routes using OSRM/GraphHopper.

<!-- SCREENSHOT: Evacuation plan — route map with waypoints, timeline, resource needs -->
![Evacuation Planning](docs/screenshots/evacuation-planning.png)

**Features:**
- Multi-route comparison
- Estimated evacuation time
- Resource requirements per route
- Road closure awareness
- Shelter capacity-aware routing
- Export to PDF/print

---

### Dispatch Console

Real-time resource dispatch and field coordination.

<!-- SCREENSHOT: Dispatch console — split view with request list and map -->
![Dispatch Console](docs/screenshots/dispatch-console.png)

**Workflow:**
1. Field responder submits resource request
2. Dispatcher reviews and approves
3. Source depot selected (nearest available)
4. Route generated and shared
5. Delivery confirmed by field team
6. Movement trail recorded

---

### AI Advisor Chat

Natural language interface to the disaster management system.

<!-- SCREENSHOT: AI chat — message bubbles with tool call outputs, map previews -->
![AI Advisor](docs/screenshots/ai-advisor.png)

**Capabilities:**
- Query shelter status by name/district
- Check resource availability
- Get flood predictions for coordinates
- Generate evacuation plans
- Retrieve relevant SOPs from knowledge base
- All queries scoped to user's district (mock RLS)

**Provider Chain:**
OpenRouter (primary) → Groq (fallback) → Bluesminds (emergency fallback)

---

### RAG Knowledge Base

Retrieval-Augmented Generation over emergency documents.

<!-- SCREENSHOT: Knowledge base — document list, search results, chunk preview -->
![Knowledge Base](docs/screenshots/knowledge-base.png)

**Pipeline:**
1. PDF upload (NDMA guidelines, SOPs, district plans)
2. Text extraction → chunking → OpenAI embedding (1536-d)
3. Vector storage in pgvector (HNSW index)
4. Cosine similarity search at query time
5. Context injection into AI planner prompts

**Supported Documents:**
- NDMA flood management guidelines
- District Disaster Management Plans
- Standard Operating Procedures
- Historical flood response reports

---

### Admin Control Panel

Super-admin and district-admin controls for system management.

<!-- SCREENSHOT: Admin panel — user table, district config, audit logs -->
![Admin Panel](docs/screenshots/admin-panel.png)

**Sections:**
- **User Management** — Role assignment, activate/deactivate
- **District Configuration** — Rain thresholds, river danger marks, auto-alert SMS
- **Audit Logs** — Security events, admin actions, login history
- **System Health** — API status, ML service health, database metrics
- **Broadcast History** — All sent alerts with delivery status
- **Bulk Operations** — Mass actions on resources/alerts

---

## Public Mode (Citizen App)

A simplified, mobile-first interface for citizens during emergencies. No login required — just tap and go.

### Citizen Dashboard

<!-- SCREENSHOT: Citizen dashboard — risk level card, nearest shelter, safety button -->
![Citizen Dashboard](docs/screenshots/citizen-dashboard.png)

**Widgets:**
- Current flood risk level (color-coded)
- Nearest shelter with walking distance
- "I Am Safe" status button
- Emergency helpline numbers
- Family contact quick-dial
- Recent alerts feed

---

### Report Submission

Crowdsourced ground-truth reporting for response teams.

<!-- SCREENSHOT: Report form — GPS picker, type selector, text input, photo upload -->
![Report Submission](docs/screenshots/report-submission.png)

**Report Types:**
- Flooding
- Road blocked
- Shelter needed
- Rescue required

**Security:**
- SpamPatrol external spam check
- Duplicate text detection
- Rate limiting (5 reports/10min per location)
- XSS sanitization on all text
- PII anonymization on public surfaces

---

### Shelter Finder

Public shelter search with real-time availability.

<!-- SCREENSHOT: Shelter finder — map with shelter markers, list with capacity -->
![Shelter Finder](docs/screenshots/shelter-finder.png)

**Features:**
- Nearest-shelter query (PostGIS)
- Facility filtering (water, food, medical)
- Live occupancy status
- Walking/driving directions
- One-tap "I'm heading there" notification

---

### Safety Status

Let family and responders know you're safe.

<!-- SCREENSHOT: Safety status — confirmation dialog with share options -->
![Safety Status](docs/screenshots/safety-status.png)

**Channels:**
- In-app button
- SMS keyword: "SAFE" to the emergency number
- WhatsApp message
- Voice IVR (for feature phones)

---

## Field Responder Mode

Mobile-optimized interface for on-ground response teams.

<!-- SCREENSHOT: Field responder — task list, resource request form, shelter update -->
![Field Responder](docs/screenshots/field-responder.png)

**Features:**
- Task assignment and status updates
- Resource request submission
- Shelter occupancy reporting
- GPS-tagged field notes
- Offline data sync (Dexie IndexedDB)
- SOS shake gesture

---

## AI & ML Pipeline

### Flood Prediction Model

XGBoost classifier trained on synthetic flood data.

<!-- SCREENSHOT: ML prediction output — risk class, confidence, probability chart -->
![ML Prediction](docs/screenshots/ml-prediction.png)

**Features (inputs):**
| Feature | Description | Range |
|---------|-------------|-------|
| `cumulative_rainfall_72h` | Total rainfall in last 72 hours (mm) | 0–500 |
| `river_level_trend` | River level change over 72h (m) | -2 to +5 |
| `soil_saturation_index` | Soil moisture (0=dry, 1=saturated) | 0–1 |
| `elevation_m` | Terrain elevation (meters) | 0–500 |

**Output:** Risk class (0=Safe, 1=Watch, 2=Warning, 3=Evacuate) + confidence score

### LangGraph Agent System

Multi-agent orchestration for complex emergency planning.

<!-- SCREENSHOT: Agent orchestration panel — graph visualization, tool calls -->
![Agent System](docs/screenshots/agent-system.png)

**Agents:**
- **Flood Analyst** — Risk assessment and prediction
- **Shelter Manager** — Capacity optimization
- **Resource Coordinator** — Allocation and dispatch
- **Evacuation Planner** — Route generation
- **Communications Officer** — Alert dissemination

---

## Multi-Channel Alert Broadcasting

Alerts cascade through multiple channels to reach citizens across connectivity levels.

<!-- SCREENSHOT: Broadcasting dashboard — channel status, delivery metrics -->
![Broadcasting](docs/screenshots/broadcasting.png)

```
┌─────────────┐
│ Alert Engine │
└──────┬──────┘
       │
       ├──→ SMS (Twilio) ──────→ Feature phones
       ├──→ Web Push (VAPID) ──→ Smartphones
       ├──→ Email (Nodemailer) → Office/responder email
       ├──→ FM Radio (CAP) ───→ Radio listeners
       ├──→ WhatsApp ──────────→ Messaging apps
       └──→ In-App (Novu) ────→ Dashboard alerts
```

**FM Radio Chain:**
1. Alert engine triggers on risk escalation
2. CAP v1.2 XML generated
3. Strategy selected (CAP/RDS/FTP/Email)
4. TTS voice generated (ElevenLabs → Azure → Google)
5. Audio stored in Supabase Storage
6. Dispatched to FM stations
7. Approval queue for non-critical alerts
8. Audit trail recorded

---

## Offline-First PWA

Full functionality without internet — critical for disaster scenarios.

<!-- SCREENSHOT: PWA — offline indicator, cached data, sync status -->
![Offline PWA](docs/screenshots/offline-pwa.png)

**Architecture:**
```
Service Worker (Workbox)
  ├── Precache: app shell, icons, offline page
  ├── Runtime cache: API (network-first), static (cache-first)
  └── Background sync: queue offline actions

IndexedDB (Dexie)
  ├── Predictions cache
  ├── Alerts cache
  ├── Shelter data
  ├── Pending reports (sync on reconnect)
  └── Offline task queue
```

**Features:**
- Offline shell with `/~offline` fallback page
- Background sync for pending reports
- Push notification queue (replayed on reconnect)
- Battery saver detection
- Network status indicator
- Wake lock for active screens

---

## Security Architecture

### Authentication & Authorization

<!-- SCREENSHOT: Auth flow — login page, OTP verification, role selection -->
![Auth Flow](docs/screenshots/auth-flow.png)

**Dual-Mode Auth:**
- **Public citizens:** Phone → OTP → `role=public` cookie
- **Gov responders:** Email/password → Supabase Auth → profile.role
- **Demo guests:** One-tap bypass → `guest_mode` cookie
- **Judges' sandbox:** Read-only mode, all writes mocked

**RBAC Matrix:**
| Role | Routes | API Access | Data Scope |
|------|--------|------------|------------|
| `super_admin` | All admin routes | Full | All districts |
| `district_admin` | Admin routes | Write | Own district |
| `field_responder` | Field routes | Write (resources) | Own district |
| `viewer` | Dashboard (read-only) | Read-only | Own district |
| `public` | Citizen app | Public endpoints | District-scoped |
| `guest` | Demo only | Public endpoints | Mock data |

### Security Controls

| Control | Implementation |
|---------|---------------|
| **Rate Limiting** | In-memory sliding window (configurable per endpoint) |
| **XSS Protection** | `sanitizeInput()` strips `<script>`, event handlers, `javascript:` URLs |
| **PII Redaction** | `anonymizePII()` replaces phones/emails with `[REDACTED]` |
| **CSRF** | SameSite=Lax cookies + server action validation |
| **Content Security Policy** | Strict CSP: no `unsafe-eval`, no `unsafe-inline` scripts |
| **HSTS** | 2-year max-age with preload |
| **SQL Injection** | Prisma ORM parameterized queries + raw SQL with tagged templates |
| **File Upload** | MIME whitelist (JPEG/PNG/WebP/GIF), 5MB size limit, extension check |
| **API Auth** | Bearer token on ML service, Twilio signature verification on webhooks |
| **Data Isolation** | Application-level district scoping + RLS policies |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | React SSR/SSG, API routes, Server Actions |
| **Language** | TypeScript 5 (strict) | Type safety, IDE support |
| **Styling** | Tailwind CSS 3.4 + DaisyUI 4 | Utility-first CSS, component library |
| **UI Primitives** | shadcn/ui (Radix UI) | Accessible, composable components |
| **Mapping** | MapLibre GL + react-map-gl | Vector tile maps, WebGL rendering |
| **Geospatial** | PostGIS + Turf.js | Spatial queries, geospatial analysis |
| **Database** | Supabase (PostgreSQL 15) | Auth, database, storage, realtime |
| **ORM** | Prisma 6 | Type-safe database queries |
| **Vector Search** | pgvector (HNSW) | RAG document embeddings |
| **AI Orchestration** | LangChain + LangGraph | Multi-agent planning system |
| **AI Providers** | OpenAI, Groq, OpenRouter, Bluesminds | LLM inference with fallback chain |
| **ML Model** | XGBoost (Python) | Flood risk classification |
| **ML Service** | FastAPI + uvicorn | Python microservice bridge |
| **TTS** | ElevenLabs, Azure Neural, Google Cloud | Multi-provider voice synthesis |
| **SMS** | Twilio | Emergency SMS alerts |
| **Push Notifications** | Web Push (VAPID) | Browser push notifications |
| **Email** | Nodemailer | Alert emails |
| **Offline** | Dexie (IndexedDB) + Workbox | Offline-first PWA |
| **PWA** | next-pwa (Workbox) | Service worker, caching |
| **Testing** | Vitest + Playwright | Unit + E2E tests |
| **CI/CD** | GitHub Actions + Vercel | Automated build + deploy |

---

## Android App (APK)

SafeSphere ships as an installable Android APK. The APK is a
[Capacitor](https://capacitorjs.com) WebView wrapper that loads the live
production site — all server features (auth, Supabase, alerts, offline sync)
keep working inside the app.

### How to download

The **"Get Android App"** button on the landing page (and the **"Download
APK"** link in the navbar) serves `/apk/SafeSphere.apk`. The APK is built and
committed into `public/apk/` automatically by the
`.github/workflows/build-apk.yml` workflow whenever it runs.

To install: download the APK on an Android phone and open it. Your phone will
ask you to allow installing from unknown sources (the app is debug-signed and
not on Google Play, so a warning is expected — choose "Install anyway").

### Rebuilding the APK

The APK is a wrapper around the production site, so the domain is baked in at
build time.

```bash
# 1. Update the domain if it changed
#    → edit server.url in capacitor.config.ts
# 2. Sync web assets + config into the Android project
npx cap sync android
# 3. Build the debug APK
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

The workflow rebuilds automatically **on push to `main`** and can also be
triggered manually from **Actions → Build Android APK → Run workflow** — the
result is committed to `public/apk/SafeSphere.apk` and the site redeploys.

### Changing your production domain later

Yes, you can change it. Because the URL is baked into the APK, a domain change
requires a rebuild:

1. Edit `server.url` in `capacitor.config.ts`.
2. Run the **Build Android APK** workflow (or `npx cap sync android` +
   `./gradlew assembleDebug` locally).
3. Commit/push the new `public/apk/SafeSphere.apk` so the site serves it.

---

## Local Setup

### Prerequisites

- **Node.js 20+** (LTS) and npm
- **Python 3.10+** (for ML service)
- A **Supabase** project (free tier works)
- Optionally: OpenAI API key for embeddings

### Step-by-Step

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd disaster-response-platform

# 2. Install Node.js dependencies
npm install

# 3. Set up Python ML service
cd ml_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with your real Supabase + API keys

# 5. Apply database migrations (in Supabase SQL Editor)
#    Run in order:
#    - supabase/migrations/0001_initial_schema.sql
#    - supabase/migrations/0002_enable_postgis.sql
#    - supabase/migrations/0003_enable_pgvector.sql
#    - (remaining migrations in order)

# 6. Sync Prisma schema
npx prisma db push
npx prisma generate

# 7. Start the ML service (terminal 1)
cd ml_service
uvicorn api:app --reload --port 8000

# 8. Start the dev server (terminal 2)
npm run dev
```

Open **http://localhost:3000** — you should see the landing page.

### Quick Start (Demo Mode)

If you just want to explore without Supabase:
```bash
npm run dev
# Click "Continue as Guest" on the landing page
# The demo runs entirely on mock data — no database needed
```

---

## Folder Structure

```
disaster-response-platform/
├── app/                          # Next.js App Router
│   ├── (admin)/                  #   Admin panel routes
│   ├── (dashboard)/              #   Gov EOC routes
│   ├── (field)/                  #   Field responder routes
│   ├── (public)/                 #   Citizen app routes
│   ├── (auth)/                   #   Auth pages (login, signup, 2FA)
│   ├── actions/                  #   Server Actions (10 files)
│   ├── api/                      #   API Routes (31 endpoints)
│   │   ├── agents/               #     AI agent orchestration
│   │   ├── chat/                 #     AI chat streaming
│   │   ├── cron/                 #     Scheduled jobs
│   │   ├── webhooks/             #     Twilio/SMS/WhatsApp
│   │   └── ...                   #     27 more API directories
│   └── ...
├── components/                   # React components (27 directories)
│   ├── command-center/           #   EOC dashboard widgets
│   ├── map/                      #   MapLibre map components
│   ├── ai/                       #   AI chat/advisor UI
│   ├── admin/                    #   Admin panel components
│   ├── public/                   #   Citizen app components
│   ├── offline/                  #   Offline mode UI
│   ├── pwa/                      #   PWA install/update UI
│   └── ui/                       #   shadcn/ui primitives
├── lib/                          # Shared utilities (66 modules)
│   ├── security/                 #   Auth, rate-limit, sanitize, OTP
│   ├── supabase/                 #   Client, server, storage
│   ├── ai/                       #   AI bridge, tools, fallback
│   ├── agents/                   #   LangGraph agent definitions
│   ├── rag/                      #   RAG pipeline (chunker, embeddings)
│   ├── broadcast/                #   FM broadcast system (20 files)
│   ├── sms/                      #   SMS commands, Twilio webhook
│   ├── tts/                      #   Text-to-speech providers
│   ├── offline/                  #   Offline utilities
│   └── validations/              #   Zod schemas
├── hooks/                        # Custom React hooks (31 files)
├── server/                       # Server-only code
│   ├── prisma.ts                 #   Prisma client singleton
│   └── services/                 #   Alert engine, push notifier
├── prisma/                       # Prisma schema (28 models)
├── supabase/migrations/          # SQL migrations (28 files)
├── ml_service/                   # Python ML microservice
│   ├── api.py                    #   FastAPI server
│   ├── train_model.py            #   XGBoost training
│   └── flood_xgboost_model.pkl   #   Trained model
├── worker/                       # Custom service worker
├── hooks/                        # Custom React hooks
├── locales/                      # i18n (23 languages)
├── scripts/                      # Utility scripts (15 files)
├── tests/                        # E2E tests (Playwright)
├── docs/                         # Documentation
└── public/                       # Static assets, PWA manifest
```

---

## Environment Variables

See `.env.example` for the full list (223 lines). Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | For RAG | OpenAI API key for embeddings |
| `GROQ_API_KEY` | For AI | Groq API key for fast LLM |
| `OPENROUTER_API_KEY` | For AI | OpenRouter API key (primary) |
| `TWILIO_ACCOUNT_SID` | For SMS | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | For SMS | Twilio auth token |
| `ML_SERVICE_URL` | For ML | Python ML service URL |
| `CRON_SECRET` | For cron | Bearer token for cron jobs |

---

## API Reference

### Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/shelters` | List all shelters |
| `GET` | `/api/alerts` | Recent alerts |
| `GET` | `/api/predictions` | Flood predictions |
| `GET` | `/api/flood` | Flood data by coordinates |
| `GET` | `/api/weather` | Weather conditions |
| `GET` | `/api/health` | System health check |

### Protected Endpoints (Require Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/chat` | role cookie | AI chat streaming |
| `POST` | `/api/rag/search` | role cookie | RAG document search |
| `POST` | `/api/broadcast/dispatch` | admin | Send FM broadcast |
| `POST` | `/api/cron/ingest` | Bearer token | Data ingestion |
| `POST` | `/api/webhooks/sms` | Twilio sig | SMS webhook |

### Server Actions

| Action | File | Description |
|--------|------|-------------|
| `sendOTP` | `app/actions/auth.ts` | Send OTP to phone |
| `verifyOTP` | `app/actions/auth.ts` | Verify OTP code |
| `govLogin` | `app/actions/auth.ts` | Government login |
| `simulateCriticalAlert` | `app/actions/alerts.ts` | Trigger demo alert |
| `addShelter` | `app/actions/shelters.ts` | Create shelter |
| `submitCitizenReport` | `app/actions/reports.ts` | Submit citizen report |
| `ingestDocument` | `app/actions/documents.ts` | Upload RAG document |

---

## Demo Geography: Patna, Bihar

For a compelling, verifiable demo we focus on **Patna, Bihar** — one of India's most flood-prone districts on the Ganga's south bank.

<!-- SCREENSHOT: Map of Patna with district boundaries and flood zones -->
![Patna Demo Map](docs/screenshots/patna-demo-map.png)

**Why Patna:**
- High flood exposure on the Ganga's south bank
- Real hydrology data from CWC gauge stations
- Relatable geography for Indian hackathon judges
- Dense urban area with clear evacuation challenges

**Simulated Data:**
- 5+ shelter locations across Patna districts
- 10+ resource depots with realistic inventory
- Weather data from OpenWeatherMap API
- Flood predictions from XGBoost model
- Historical flood patterns for training data

---

## Repository Hygiene

- **CI:** Every PR runs `npm run lint` + `npx tsc --noEmit` via GitHub Actions
- **Secrets:** `.env`, `.env.local` are gitignored — never commit real keys
- **Code Quality:** ESLint + Prettier enforced
- **Type Safety:** TypeScript strict mode enabled
- **Testing:** Vitest (unit) + Playwright (E2E)

---

## Team

Built for **Bharat Shakti Hackathon | Track: AI for Society | PS3**

A data-driven answer to India's most recurring natural disaster.

---

## License

MIT
