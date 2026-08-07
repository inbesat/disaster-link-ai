# 🚨 Disaster Response Intelligence Platform

**AI-powered flood prediction, emergency planning, and resource allocation — built for the Bharat Shakti Hackathon (Track: AI for Society — Problem Statement 3).**

When the waters rise, every minute counts. This platform fuses real-time flood forecasts, geospatial intelligence (PostGIS), and RAG-driven emergency knowledge (pgvector) into a single Emergency Operations Center (EOC) dashboard — helping responders decide *where* to evacuate, *what* to deploy, and *whom* to alert before disaster strikes.

Our demo targets **Patna, Bihar** — one of India's most flood-prone districts on the Ganga — for high-fidelity data simulation.

---

## ✨ What It Does

- **🌊 Flood Prediction** — ingests hydrology forecasts and renders risk levels (`safe / watch / warning / critical`) on an interactive map.
- **🏕️ Shelter & Resource Management** — tracks shelter capacity and stockpile locations, with PostGIS-powered "nearest available" queries.
- **📡 Alert Orchestration** — severity-graded alert log for SMS/email/push/siren dissemination.
- **🧠 RAG Knowledge Base** — retrieves the most relevant emergency plans and procedures via vector similarity search over `emergency_documents`.
- **🏗️ Emergency Operations Center UI** — a dark, high-density command-center aesthetic built on custom Tailwind design tokens.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router) · React · TypeScript · Tailwind CSS |
| **Backend / Data** | [Supabase](https://supabase.com/) (PostgreSQL 15) · [Prisma ORM](https://www.prisma.io/) |
| **Geospatial** | [PostGIS](https://postgis.net/) (GiST spatial indexes) |
| **AI / RAG** | [pgvector](https://github.com/pgvector/pgvector) (HNSW embeddings) · OpenAI embeddings (1536-d) |
| **Mapping** | [MapLibre GL](https://maplibre.org/) |
| **Hydrology** | Google Flood Forecasting Framework / GEE hydrology layers |
| **CI/CD** | GitHub Actions (lint + type-check) |

---

## 📦 Prerequisites

- **Node.js 20+** (LTS) and npm
- A **Supabase** project (free tier is fine) with the SQL Editor enabled
- Optionally: an **OpenAI API key** for generating document embeddings

---

## 🚀 Local Setup (Step by Step)

```bash
# 1. Clone & install
git clone <your-repo-url>
cd disaster-response-platform
npm install

# 2. Configure environment
#    Add your credentials to .env (see the commented sections for what each key is for).

# 3. Apply the database schema (in the Supabase SQL Editor)
#    Run, in order: supabase/migrations/0001_initial_schema.sql
#                    supabase/migrations/0002_enable_postgis.sql
#                    supabase/migrations/0003_enable_pgvector.sql

# 4. Sync the Prisma schema to your database & generate the client
npx prisma db push
npx prisma generate

# 5. Run the dev server
npm run dev
```

Open **http://localhost:3000** — you should see the EOC dashboard.

> **Demo data:** Phase 2 adds a Patna-specific seed script to populate realistic shelters, resources, and emergency plans.

---

## 🗂️ Folder Structure

```
disaster-response-platform/
├── app/                 # Next.js App Router pages, layouts, route handlers
├── components/          # Reusable React UI components (EOC panels, charts, map)
├── lib/                 # Frontend-safe utilities & clients (e.g. lib/supabase.ts)
├── server/              # Server-only logic: Prisma client, API/action helpers
├── types/               # Shared TypeScript types (Domain models, severity enums)
├── ml_models/           # ML assets: flood-risk model weights, pre-processing, inference
├── data_ingestion/      # Data pipelines: hydrology fetchers, District DB, seeders
├── prisma/              # Prisma schema (mirrors the SQL schema exactly)
├── supabase/migrations/ # Raw SQL migrations (PostGIS + pgvector)
└── .github/workflows/   # CI pipeline (lint + type-check)
```

- **`/server`** — everything that must *never* run in the browser (Prisma client, DB queries, secrets).
- **`/lib`** — safe, shared utilities both client and server can import (Supabase client, formatters).
- **`/data_ingestion`** — the pipelines that pull hydrology/weather data and shape it into `flood_predictions`.

---

## 📍 Demo Geography: Patna, Bihar

For a compelling, verifiable demo we deliberately focus on **Patna, Bihar** — a district with high flood exposure on the Ganga's south bank.

- All flood forecasts, shelters, and resource deployments are simulated **within Patna's district boundary**.
- Hydrology inputs come from the **Google flood forecasting framework** calibrated to the Ganga river gauge stations near Patna.
- This gives judges a single, relatable geography with high-fidelity, consistent data.

---

## 🛡️ Repository Hygiene

- **CI**: every PR and push to `main` runs `npm run lint` + `npx tsc --noEmit` via `.github/workflows/ci.yml`.
- **Secrets**: `.env`, `.env.local` are gitignored — never commit real keys.

---

## 🏅 Team

Built for **Bharat Shakti Hackathon · Track: AI for Society · PS3** — a data-driven answer to India's most recurring natural disaster.
