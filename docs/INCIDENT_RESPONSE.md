# SafeSphere — Incident Response Plan & Runbook

**Version:** 1.0.0
**Last Updated:** August 2026
**Target Environment:** SafeSphere Emergency Response Platform (Vercel + Supabase + OpenRouter)

---

## 1. Overview & Response Protocol

This document outlines standard operating procedures (SOP) for security incidents, credential compromise, unauthorized access, denial-of-service attempts, or critical infrastructure outages.

### Incident Severity Levels

| Level | Severity | Definition | Examples | SLA |
|-------|----------|------------|----------|-----|
| **SEV-1** | Critical | Active credential leak, unauthorized administrative data access, complete platform outage during active disaster. | Service role key leaked on GitHub, database breach, DDoS. | < 15 minutes |
| **SEV-2** | Major | Single API service key compromised, high rate-limit abuse from single IP, partial UI component outage. | OpenRouter key leaked, spam submission flood. | < 1 hour |
| **SEV-3** | Minor | Minor error rate spike, non-blocking bug in field app, localized tile loading failure. | Map fallback triggered, non-critical log warning. | < 4 hours |

---

## 2. Key Rotation Procedures (Step-by-Step)

If an API key or service credential is exposed or suspected of compromise, follow these step-by-step rotation procedures immediately.

### 2.1 Rotating Supabase Keys (`SUPABASE_SERVICE_ROLE_KEY` / `ANON_KEY`)
1. Log in to **Supabase Dashboard** → **Project Settings** → **API**.
2. Under **Project API Keys**, click **Generate new key** or **JWT Secret Reset**.
3. *Warning:* Resetting the JWT secret immediately invalidates all active user sessions and existing JWT tokens.
4. Copy the new `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Update environment variables in **Vercel Dashboard** → **Settings** → **Environment Variables**.
6. Redeploy the application in Vercel (`vercel --prod` or trigger redeploy via UI).

### 2.2 Rotating OpenRouter / LLM Keys (`OPENROUTER_API_KEY`, `GROQ_API_KEY`)
1. Log in to **OpenRouter Keys Dashboard** (`openrouter.ai/keys`) / **Groq Console** (`console.groq.com`).
2. Click **Create New Key** and name it `safesphere-prod-[date]`.
3. Copy the newly generated key.
4. Update `OPENROUTER_API_KEY` or `GROQ_API_KEY` in **Vercel Project Settings**.
5. Delete/Revoke the compromised key in the vendor dashboard.
6. Verify AI assistant function in `/ai-planner`.

### 2.3 Rotating Twilio Credentials (`TWILIO_AUTH_TOKEN`, `TWILIO_ACCOUNT_SID`)
1. Log in to **Twilio Console** (`console.twilio.com`).
2. Navigate to **Account** → **API Keys & Tokens**.
3. Under **Auth Token**, select **Create Secondary Auth Token**.
4. Update `TWILIO_AUTH_TOKEN` in Vercel Environment Variables.
5. Promote Secondary Token to Primary and revoke the old compromised token.
6. Verify webhook signatures in `lib/sms/twilio-webhook.ts`.

### 2.4 Rotating Vercel Deployment Tokens / Webhooks (`CRON_SECRET`)
1. Log in to **Vercel** → **Project Settings** → **Environment Variables**.
2. Generate a fresh 64-character random string (`openssl rand -hex 32`).
3. Set `CRON_SECRET` to the new value.
4. Update cron header in external triggering services (or Vercel Cron settings).

---

## 3. Revoking User Sessions

### Option A: Via Admin Panel (Soft Revocation / Individual User)
1. Navigate to `/admin` or `/settings/profile` as `super_admin`.
2. Locate the target user ID or account email.
3. Click **Revoke Sessions** / **Lock Account** (sets `account_locked_until = now() + 15 mins` via `lib/security/account-lockout.ts`).
4. Force user logout by calling `/api/user/delete` soft-deactivation or session clearance.

### Option B: Via Supabase Dashboard (Hard Mass Revocation)
1. Log in to **Supabase Dashboard** → **Authentication** → **Users**.
2. Select target user → click **Revoke All Sessions** or **Delete User**.
3. For emergency mass revocation across ALL active users:
   - Go to **Project Settings** → **API** → **JWT Settings**.
   - Click **Reset JWT Secret**.
   - All active cookies and JWTs become immediately invalid; users must log back in.

---

## 4. Blocking Malicious IPs & DDoS Mitigation

### 4.1 Vercel Firewall (Edge Layer Blocking)
1. Open **Vercel Dashboard** → **Project** → **Security** / **Firewall**.
2. Under **Custom Rules**, click **Add Rule**.
3. Select **IP Address** `equals` `[MALICIOUS_IP]`.
4. Action: **Block** (returns HTTP 403 at edge before touching serverless functions).
5. Save and deploy rule (effective worldwide within 5 seconds).

### 4.2 Application Rate Limit Rules (`lib/security/rate-limiter.ts`)
1. Emergency IP ban via Redis / Rate Limiter memory bucket:
   - The rate-limiting middleware (`middleware.ts`) automatically throttles IPs exceeding tiered thresholds (e.g., anonymous > 10 req/min, public > 30 req/min).
   - Lower the limit dynamically in `lib/security/rate-limiter.ts` if under HTTP flood attack.

---

## 5. Database Backup Restoration Procedure

In the event of database corruption, accidental deletion, or ransomware attack:

### 5.1 Point-in-Time Recovery (PITR) via Supabase Dashboard
1. Open **Supabase Dashboard** → **Database** → **Backups**.
2. Select **Point-in-Time Recovery**.
3. Choose the target restoration timestamp (up to 7-14 days prior).
4. Click **Restore to this point**. Supabase clones the restored database state.
5. Update Vercel environment variable `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` to target the restored database instance if needed.

### 5.2 Manual CLI Backup & Restore (`pg_dump` / `pg_restore`)
```bash
# Export full database schema + data backup
pg_dump "postgres://postgres:[PASSWORD]@[HOST]:5432/postgres" -F c -b -v -f safesphere_backup.dump

# Restore dump to clean target database
pg_restore --clean --no-acl --no-owner -h [HOST] -U postgres -d postgres safesphere_backup.dump
```

---

## 6. Emergency Contact Matrix

| Role | Contact Name | Channel | Phone / Email |
|------|--------------|---------|---------------|
| **Team Lead / Incident Commander** | Lead Engineer | Internal Slack / Signal | +91-9876543210 / lead@safesphere.org |
| **Database Administrator** | Supabase Lead | Supabase Support Portal | support@supabase.com |
| **Hosting & Infrastructure** | Vercel Support | Vercel Enterprise Support | enterprise-support@vercel.com |
| **Security & Compliance** | Security Officer | PGP Email | security@safesphere.org |

---

## 7. Post-Incident Protocol

Following resolution of any SEV-1 or SEV-2 incident, execute these mandatory post-incident steps:

1. **Audit Log Review:** Query `audit_logs` table (`SELECT * FROM audit_logs WHERE created_at >= [INCIDENT_START]`) to determine scope of impacted records.
2. **User Notification:** If PII or user credentials were breached, send mandatory notification within 72 hours per data protection requirements.
3. **Root Cause Analysis (RCA):** Document the initial vulnerability vector, timeline, impact, and preventive actions taken.
4. **Fix Deployment:** Commit patch, run `npm run test` and `./node_modules/.bin/tsc --noEmit`, and deploy hotfix to production.
