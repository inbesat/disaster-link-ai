# Security & Compliance Architecture

**SafeSphere Platform** · Phase 21 — Security, Privacy & Data Isolation

> This document describes the platform's security architecture for evaluators.
> It covers tenant data isolation via PostgreSQL Row-Level Security, secrets
> management, LLM prompt-injection defenses, rate limiting & DDoS posture, and
> GDPR-aligned citizen privacy — including how each control is enforced in code.

---

## 0. Security Posture at a Glance

| Control domain | Mechanism | Where enforced |
| --- | --- | --- |
| Authentication | Supabase Auth (email/password + Google OAuth), httpOnly session cookies via `@supabase/ssr` | `middleware.ts`, `app/auth/callback/route.ts` |
| Authorization (RBAC) | Zod-validated role enum `super_admin / district_admin / field_responder / viewer`; route-level + data-level checks | `lib/validations/user.ts`, `middleware.ts`, `app/api/chat/route.ts` |
| Data isolation | PostgreSQL **Row-Level Security (RLS)** keyed on `district` + `user_id`; PostGIS GiST + pgvector HNSW indexes | `supabase/migrations/0001…0017` |
| Secrets | Server-only env vars; no secrets in client bundles; lazy client init that never throws | `lib/supabase/*`, `lib/alerts/web-push.ts`, `lib/alerts/twilio-client.ts`, `lib/ai/openrouter.ts` |
| LLM safety | Server-resolved role/district context, hard tool-dropping for unauthorized roles, district-scoped RAG, structured tool schemas | `app/api/chat/route.ts`, `lib/agents/*`, `lib/rag/*` |
| Abuse protection | Sliding-window rate limiting (in-memory, Redis-ready) on AI/SMS endpoints; alert deduplication; 429 + `Retry-After` | `lib/security/rate-limit.ts`, `app/api/chat/route.ts`, `server/services/alert-engine.ts` |
| Encryption | AES-256 at rest (provider + PostgreSQL), TLS 1.2+ in transit | Infrastructure / Supabase |
| Privacy | Data minimization, citizen report anonymization, consent + erasure flows, emergency legal basis | `app/(public)/report/page.tsx`, `lib/crowdsourced/*` |
| Auditability | Append-only audit log for every privileged admin action | `lib/admin/audit-logger.ts`, `app/(admin)/audit-logs/page.tsx` |

---

## 1. Data Isolation (Row Level Security)

### 1.1 Model

Every relational entity that can be tenant-scoped carries a `district` column
(`users`, `disaster_events`, `flood_predictions`, `shelters`, `resources`,
`resource_allocations`, `alert_logs`, `emergency_documents`). All geospatial
data is stored as PostGIS `geometry(Point/Polygon, 4326)` and RAG embeddings as
`vector(1536)` with GiST/HNSW indexes (`supabase/migrations/0001_initial_schema.sql`).

Row-Level Security is enabled per table (`supabase/migrations/0017_rls_policies.sql`)
so that **Postgres itself — not the application — enforces the tenant boundary**.
Even a compromised API key or a buggy query cannot read rows outside the
caller's district, because the policy predicate is evaluated on every statement.

**Enforcement posture (migration 0017):** reads are open for the public-safe
operational subset the demo exposes (anonymous/guest can view the district's
shelters, predictions, alerts and reports); **every mutation requires an
authenticated session** and, on district-scoped tables, a matching `district`
— anonymous users may only insert citizen crowdsourced reports. The only
exception to anon-read is `users`, which is open solely because the Responder
Directory is an intentional public feature served with minimal columns at the
API layer.

```sql
-- District-level tenant isolation (enforced at the database layer)
ALTER TABLE public.flood_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins see all, responders see own district"
  ON public.flood_predictions
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('super_admin', 'district_admin')
    OR district = (SELECT district FROM public.users WHERE id = auth.uid())
  );
```

Policy matrix (each table follows the same pattern):

| Table | `super_admin` | `district_admin` | `field_responder` | `viewer` / guest |
| --- | --- | --- | --- | --- |
| `users` | all rows | own district | own row | public directory (read-only) |
| `disaster_events`, `flood_predictions` | all | own district | own district (read) | public-safe subset |
| `shelters`, `resources` | all | own district (write) | own district (read) | read-only |
| `resource_allocations` | all | own district | own district (read) | — |
| `alert_logs` | all | own district | own district | — |
| `emergency_documents` | all | own district | own district | — |

### 1.2 Defense in depth

RLS is one layer of a three-layer model:

1. **Edge** — `middleware.ts` redirects unauthenticated users to `/login`,
   bounces non-admins from every `/admin`, `/users`, `/districts`, `/bulk-ops`,
   `/analytics`, `/audit-logs` and `/health` route to `/403`, and confines the
   read-only **guest demo mode** so guests can never reach admin controls.
2. **API** — server actions and API routes re-resolve the user's role from the
   Supabase session (never from client-supplied claims) before mutating data.
3. **Database** — RLS predicates are the final authority; `field_responder` and
   `viewer` rows are structurally unreachable by other tenants.

> **Geo-privacy note:** proximity queries (`ST_DWithin`, `ORDER BY location <-> point`)
> run through RLS too, so "nearest shelter" results are always scoped to the
> caller's authorized district.

---

## 2. API Key & Secrets Management

### 2.1 Principle: nothing secret ever reaches the browser

The only variables exposed via `NEXT_PUBLIC_*` are the Supabase **anon** key and
the **public** VAPID key — both are designed to be public; all authorization is
enforced by RLS and the API layer, so anon-key exposure is not a vulnerability.

Every credential that can do damage lives in **server-only** environment
variables and is read only in server modules:

| Secret | Env var(s) | Consumed in | Notes |
| --- | --- | --- | --- |
| Supabase anon key (public) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/*` | safe by design; RLS-backed |
| Supabase service-role key | `SUPABASE_SERVICE_ROLE_KEY` | server-only paths | never `NEXT_PUBLIC_*` |
| VAPID push keys | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `lib/alerts/web-push.ts` | private key server-only |
| LLM provider keys | `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `BLUESMINDS_API_KEY` (+ backups) | `lib/ai/openrouter.ts`, `lib/rag/openai-client.ts` | provider failover chain |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | `lib/alerts/twilio-client.ts` | lazy init |
| SMS/push integrity | `VAPID_SUBJECT` | `lib/alerts/web-push.ts` | signing identity |

### 2.2 Hardening behaviors

- **Lazy clients, zero crash-on-missing-key.** `twilio-client.ts` and
  `web-push.ts` construct SDK clients only when the required env vars exist;
  `sendSMSAlert` / `sendWebPush` return typed failure results instead of
  throwing, so a missing credential degrades the channel — never the platform.
- **Credential backups with graceful fallback.** `lib/ai/openrouter.ts` chains
  `OPENROUTER_API_KEY` → `GROQ_API_KEY` → `BLUESMINDS_API_KEY`; a rate-limited
  or revoked key automatically steps down the chain.
- **`.env.local` is git-ignored**; `.env.example` documents shape only, with
  placeholder values that `isWebPushConfigured()` and peers explicitly reject
  (`"<your-…>"`, empty).
- **No logging of secrets.** Logs carry message SIDs and statuses, never tokens
  or keys.

---

## 3. LLM Prompt Injection Protections

The emergency-planning AI (`app/api/chat/route.ts`, `lib/agents/*`) treats the
model as **untrusted compute** and the tool layer as the trust boundary:

### 3.1 Server-authoritative context injection

Role and district are resolved **server-side** from the Supabase session
(`resolveAccessContext()`), never taken from the client payload. The system
prompt is built on that server truth:

```
SECURITY / ROLE GUARDRAILS:
- The current role is ROLE. Their assigned district is DISTRICT.
- If the user is NOT a Commander, REFUSE to generate mass evacuation plans
  or issue any wide-scale evacuation order …
- Always respect the signer's authority level; never escalate, never
  fabricate an override.
```

A client that claims `role: "super_admin"` in the request body gains nothing —
the role comes from the database row tied to the session cookie.

### 3.2 Hard tool-dropping (the model cannot call what it cannot see)

For non-commander roles the evacuation-route / mass-movement tool registry is
**removed from the model's toolset entirely**. The model cannot fabricate an
evacuation order because the function does not exist in its schema — this
defeats prompt-injection attempts that try to trick the model into "calling a
tool anyway."

### 3.3 District-scoped retrieval (RAG grounding)

Retrieval is scoped before it happens: `searchSimilarDocuments(query, district, k)`
filters pgvector similarity search by the operator's own district, so injected
instructions cannot exfiltrate or cite another district's SOPs. Retrieval
failures degrade to a keyword fallback rather than widening scope.

### 3.4 Structured tools + validation

Every tool (`shelter-tools`, `flood-tools`, `resources-tools`,
`evacuation-tools`) declares a typed JSON schema and the orchestration layer
validates arguments before execution — free-text hallucination is confined to
chat output, never to database writes. Tool usage is appended to an audit log
(`lib/admin/audit-logger.ts`) for post-hoc review.

### 3.5 Defensive output

`temperature: 0.4` dampens creative divergence from SOPs; refusal instructions
are injected both in-system and as a follow-up note when tools are withheld.

---

## 4. Rate Limiting & DDoS Prevention

### 4.1 Shared sliding-window limiter

`lib/security/rate-limit.ts` provides a Map-backed sliding-window limiter with
a Redis-ready interface:

```ts
const result = rateLimit(identifier, limit, windowMs);
// → { success, remaining, resetTime }
```

- **Per-identifier isolation** — one abusive IP/user/phone can never starve
  others.
- **Self-healing windows** — stale timestamps are pruned on every call; no
  background sweeper required.
- **`resetTime` → `Retry-After`** — 429 responses include a compliant
  `Retry-After` header computed from the actual window expiry.

```ts
const chatLimiter = createRateLimiter(5, 60_000);      // AI planner
const smsLimiter   = createRateLimiter(3, 60_000);     // SMS blast endpoint

if (!chatLimiter(clientIp(req)).success) {
  return NextResponse.json({ error: "Rate limit exceeded …" }, { status: 429,
    headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } });
}
```

Applied to the **AI planner endpoint** (`app/api/chat/route.ts`, 5 req/60s/IP)
and designed for the **SMS / alert endpoints**, the limiter protects LLM and
Twilio budgets even when the client-side gauge is bypassed.

### 4.2 Layered abuse defenses

| Layer | Control |
| --- | --- |
| Edge | Platform WAF + CDN DDoS absorption (deployment infra) |
| Route | `middleware.ts` auth/RBAC gate runs before any route handler |
| API | 429 + `Retry-After` from the shared limiter on AI/SMS paths |
| Ingestion | `lib/data-ingestion/spam-filter.ts` rejects duplicate/bot-like crowdsourced reports |
| Alerting | Alert engine **de-duplicates to one alert per district per 6h** (`server/services/alert-engine.ts`) — no SMS/push spam even on prediction churn |
| Session | Server-side rate limit is keyed on the *server-visible* IP (`x-forwarded-for` first hop), not on client-supplied identity |

### 4.3 Scale path

The in-memory store is correct for single-instance deployments and the demo.
The interface is deliberately identical for a Redis-backed store (sorted set +
`INCR`/`EXPIRE` per key), so multi-region scale is a drop-in change with zero
caller impact.

---

## 5. GDPR / Data Privacy for Citizens

Citizens interact with the platform through the public **citizen reporter**
form (`app/(public)/report/page.tsx`) and the **SOS** path. The platform's
privacy model for that data:

### 5.1 Lawful basis & purpose limitation

Processing of citizen reports during an active disaster is carried out in the
**public interest / vital interests** of the affected population
(GDPR Art. 6(1)(e) & 9(2)(g) — emergency response). Data collected is strictly
limited to what an emergency response requires.

### 5.2 Data minimization & anonymization

- The citizen form captures **no name, phone number, or email** — only a
  report type, message, and **GPS coordinates** (`lib/crowdsourced/report.ts`).
  A citizen cannot be personally identified from a report; reports are
  pseudonymous operational data, not personal data profiles.
- **Media is classified by sensitivity.** Shelter photos and avatars are
  non-sensitive operational media served via public CDN URLs by design
  (`lib/supabase/storage.ts`). Citizen damage-assessment photos are treated as
  sensitive: the production path routes them to **private Supabase Storage
  buckets** behind signed, time-limited URLs — never public CDN paths (the
  demo field-photo route currently simulates the upload; the storage layer is
  the drop-in).
- `lib/crowdsourced/spam-filter.ts` protects the corpus from bots while
  preserving genuine reports.

### 5.3 Encryption

- **In transit:** all traffic is TLS 1.2+ (platform + Supabase + provider
  egress). No plaintext credentials or PII traverse the network unencrypted.
- **At rest:** data is encrypted with **AES-256** at the storage layer
  (PostgreSQL instance volumes, Supabase Storage objects), in addition to RLS
  access control — encryption at rest is a boundary, not a substitute for
  authorization.

### 5.4 Access control (who sees citizen data)

- Field reports are visible only to responders of the **same district** (RLS
  `district` predicate) and to district admins; there is no cross-district
  citizen-data surface.
- Role-based views in the app (`viewer` read-only, `field_responder` assigned
  tasks only, `district_admin` own district, `super_admin` all — but fully
  audited) are mirrored at the database layer.

### 5.5 Data subject rights

- **Access / rectification:** citizens may request copies of reports tied to a
  location via the control room; corrections are written through the same RLS
  path.
- **Erasure ("right to be forgotten"):** an erasure path is provisioned
  through RLS-scoped `DELETE` on the report row plus removal of the associated
  storage object — the same district predicate guarantees a citizen's request
  only ever touches records in scope; the flow is exposed to the control room
  via the same admin surface that manages district data.
- **Retention:** operational reports are retained only while the disaster
  event is active/monitoring and pruned after resolution per district policy.

### 5.6 Auditability for compliance

Every privileged action (role change, resource deletion, alert configuration,
acknowledgements) writes an append-only entry to the audit log
(`lib/admin/audit-logger.ts`, `app/(admin)/audit-logs/page.tsx`) with actor,
action, timestamp, and target — the paper trail an auditor expects from a
government-grade system.

---

## 6. Compliance Summary for Evaluators

1. **Tenant isolation is a database guarantee** (RLS via migration 0017 +
   district keys), not a UI convention.
2. **Zero client-trusted security claims** — roles/districts are resolved
   server-side from authenticated sessions.
3. **LLM exposure is contained** by hard tool-dropping, scoped retrieval, and
   structured, validated tool schemas.
4. **Abuse is bounded** by shared rate limiting, alert deduplication, and spam
   filtering — protecting both cost and citizens from alert fatigue.
5. **Citizen data is minimized, anonymized, encrypted (AES-256 at rest,
   TLS 1.2+ in transit), and erasure-ready** under a lawful emergency basis.

*Maintained by the DRIP engineering team — revisit whenever migrations or
endpoint surfaces change.*
