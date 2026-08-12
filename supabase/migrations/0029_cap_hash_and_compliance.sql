-- =====================================================================
-- 0029_cap_hash_and_compliance.sql
-- Phase 8 · Compliance, Logging & Audit Trail.
--
-- 1. cap_alerts.cap_hash — SHA-256 digest of cap_xml (tamper-proofing).
-- 2. Report indexes — the /api/broadcast/fm/report + history queries
--    filter cap_alerts by created_at/language and join broadcast logs.
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TAMPER-PROOFING HASH ON cap_alerts
-- ---------------------------------------------------------------------
ALTER TABLE public.cap_alerts
  ADD COLUMN IF NOT EXISTS cap_hash TEXT;

-- Backfill for any existing rows (idempotent; recomputable anytime).
-- Postgres crypto extension may not be enabled in every environment, so
-- this backfill is best-effort and guarded.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    UPDATE public.cap_alerts
       SET cap_hash = encode(digest(cap_xml, 'sha256'), 'hex')
     WHERE cap_hash IS NULL;
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL; -- pgcrypto absent — hash is written by the app on insert.
END $$;

-- ---------------------------------------------------------------------
-- 2. REPORT / HISTORY INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cap_alerts_created_at ON public.cap_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_cap_alerts_language   ON public.cap_alerts(language);
CREATE INDEX IF NOT EXISTS idx_cap_alerts_disaster_event_id_created
  ON public.cap_alerts(disaster_event_id, created_at DESC);

-- =====================================================================
-- VERIFY:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'cap_alerts' AND column_name = 'cap_hash';
-- =====================================================================
