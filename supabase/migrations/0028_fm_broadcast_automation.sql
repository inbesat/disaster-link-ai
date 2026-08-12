-- =====================================================================
-- 0028_fm_broadcast_automation.sql
-- Phase 7 · Broadcast Trigger Automation & Rules Engine.
--
-- 1. alert_rules_fm   — per-district FM broadcast automation rules.
-- 2. fm_approval_requests — human-in-the-loop approval queue (auto-
--    broadcast vs. manual approval, with configurable auto-approval).
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALERT RULES (FM)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_rules_fm (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district              VARCHAR(50) NOT NULL,          -- district name or 'all'
    disaster_type         VARCHAR(30) NOT NULL,          -- flood | cyclone | earthquake | heatwave | all
    trigger_severity      VARCHAR(20) NOT NULL,          -- warning | critical
    auto_broadcast        BOOLEAN NOT NULL DEFAULT false, -- auto-trigger or manual approval
    target_languages      TEXT[] NOT NULL DEFAULT '{hi,en}',
    fm_radius_km          INTEGER NOT NULL DEFAULT 50,   -- how far to broadcast
    rds_enabled           BOOLEAN NOT NULL DEFAULT true,
    ivr_fallback_enabled  BOOLEAN NOT NULL DEFAULT true,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_by            UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_fm_district ON public.alert_rules_fm(district, disaster_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_fm_active   ON public.alert_rules_fm(is_active);

ALTER TABLE public.alert_rules_fm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_rules_fm_gov_all ON public.alert_rules_fm;
CREATE POLICY alert_rules_fm_gov_all ON public.alert_rules_fm
  FOR ALL
  USING (public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder'));

-- ---------------------------------------------------------------------
-- 2. FM APPROVAL REQUESTS — pending broadcasts awaiting admin action.
--    Auto-approval after auto_approve_after_seconds when untouched.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fm_approval_requests (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_event_id           UUID REFERENCES public.disaster_events(id) ON DELETE SET NULL,
    district                    VARCHAR(50) NOT NULL,
    disaster_type               VARCHAR(30) NOT NULL,
    severity                    VARCHAR(20) NOT NULL,      -- warning | critical
    message                     TEXT NOT NULL,             -- AI voice-preview script
    rds_text                    TEXT NOT NULL,             -- scrolling text preview
    stations_count              INTEGER NOT NULL DEFAULT 0,
    status                      VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    auto_approve_after_seconds  INTEGER NOT NULL DEFAULT 180,
    decided_by                  UUID,
    decided_at                  TIMESTAMPTZ,
    cap_alert_id                TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fm_approval_status    ON public.fm_approval_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_fm_approval_event     ON public.fm_approval_requests(disaster_event_id);

ALTER TABLE public.fm_approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fm_approval_requests_gov_all ON public.fm_approval_requests;
CREATE POLICY fm_approval_requests_gov_all ON public.fm_approval_requests
  FOR ALL
  USING (public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder'));

-- ---------------------------------------------------------------------
-- 3. SEED DEMO RULES — representative automation configs.
--    (name+disaster matching keeps re-runs safe via ON CONFLICT.)
-- ---------------------------------------------------------------------
INSERT INTO public.alert_rules_fm
  (district, disaster_type, trigger_severity, auto_broadcast, target_languages, fm_radius_km, rds_enabled, ivr_fallback_enabled)
VALUES
  ('all',    'flood',      'critical', true,  '{hi,en}', 50, true,  true),
  ('patna',  'flood',      'warning',  false, '{hi,en}', 40, true,  true),
  ('bihar',  'flood',      'warning',  false, '{hi,bn}', 50, true,  true),
  ('puri',   'cyclone',    'critical', true,  '{hi,en,or}', 60, true, true),
  ('all',    'cyclone',    'critical', true,  '{hi,en}', 60, true,  true),
  ('all',    'earthquake', 'critical', false, '{hi,en}', 80, false, true),
  ('all',    'heatwave',   'warning',  false, '{hi,en}', 50, true,  false)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- VERIFY:
--   SELECT count(*) FROM public.alert_rules_fm;          -- expect 7
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN ('alert_rules_fm','fm_approval_requests');
-- =====================================================================
