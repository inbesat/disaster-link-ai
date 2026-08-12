-- =====================================================================
-- 0027_fm_ivr_fallback.sql
-- Phase 5 · IVR Voice-Call Fallback — Twilio call tracking on broadcast
-- logs.
--
-- The IVR fallback places a Twilio call to a station control room and
-- logs it to fm_broadcast_logs (strategy = 'ivr'). Twilio reports the
-- call's lifecycle back via /api/webhooks/twilio/call-status; to match
-- that callback to the right log row we store the CallSid here.
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
-- =====================================================================

ALTER TABLE public.fm_broadcast_logs
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

-- Call-status webhooks look up the log by CallSid — index it.
CREATE INDEX IF NOT EXISTS idx_fm_broadcast_logs_external_ref
  ON public.fm_broadcast_logs(external_ref);

-- =====================================================================
-- VERIFY:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'fm_broadcast_logs' AND column_name = 'external_ref';
-- Should return one row.
-- =====================================================================
