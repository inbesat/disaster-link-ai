-- =====================================================================
-- 0016_crowdsourced_reports.sql
-- Phase 17 — Crowdsourced Ground Truth.
-- Citizen-submitted reports (social / app / SMS) that provide on-the-ground
-- ground truth. Starts `unverified`; promoted to `verified` as responders
-- confirm true signals, or `rejected` when they are spam/false.
-- Idempotent; run after 0015.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.crowdsourced_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  report_type         text NOT NULL,                          -- flooding | road_blocked | shelter_needed | rescue
  source              text NOT NULL DEFAULT 'app',            -- social | app | sms
  raw_text            text NOT NULL,
  confidence_score    double precision NOT NULL DEFAULT 0.5,  -- 0..1
  verification_status text NOT NULL DEFAULT 'unverified',     -- unverified | verified | rejected
  image_url           text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crowdsourced_reports_type
  ON public.crowdsourced_reports (report_type);

CREATE INDEX IF NOT EXISTS idx_crowdsourced_reports_verification
  ON public.crowdsourced_reports (verification_status, created_at DESC);