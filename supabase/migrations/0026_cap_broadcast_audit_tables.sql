-- =====================================================================
-- 0026_cap_broadcast_audit_tables.sql
-- Phase 26 · FM Radio Emergency Broadcasting — CAP alert audit trail +
-- TTS audio registry + per-station broadcast logs.
--
-- Phase 3 output ("Add cap_alerts table") plus the two companion tables
-- the runtime depends on (lib/cap/cap-service.ts writes cap_alerts,
-- app/api/tts/generate/route.ts writes alert_audio, and
-- lib/broadcast/fm-dispatcher.ts writes fm_broadcast_logs). These mirror
-- the Prisma models in prisma/schema.prisma exactly.
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALERT AUDIO — one row per generated TTS voice. `cache_key` dedupes
-- identical alerts for the 24 h cache; the dispatch pipeline links
-- dispatches to an audio record via `alert_id`.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_audio (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id     TEXT,                              -- CAP <identifier>, when linked
    language     TEXT NOT NULL,                     -- 'hi' | 'en' | 'bn' | 'ta' | ...
    provider     TEXT NOT NULL,                     -- elevenlabs | azure | google
    duration_sec DOUBLE PRECISION NOT NULL,
    script       TEXT NOT NULL,                     -- the exact spoken broadcast script
    cache_key    TEXT NOT NULL,                     -- sha256(language|script)[0:24]
    audio_url    TEXT,                              -- Supabase Storage public URL (or NULL for data-URI fallback)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_audio_cache_key ON public.alert_audio(cache_key);
CREATE INDEX IF NOT EXISTS idx_alert_audio_alert_id  ON public.alert_audio(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_audio_language  ON public.alert_audio(language);

-- RLS: anyone may read audio metadata (citizens see alerts); only gov
-- roles can create/manage generations.
ALTER TABLE public.alert_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_audio_public_select ON public.alert_audio;
CREATE POLICY alert_audio_public_select ON public.alert_audio
  FOR SELECT
  USING (
    public.current_user_role() IS NULL
    OR public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS alert_audio_gov_all ON public.alert_audio;
CREATE POLICY alert_audio_gov_all ON public.alert_audio
  FOR ALL
  USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 2. CAP ALERTS — CAP v1.2 alert audit trail. One row per CAP message
-- generated for an FM broadcast. `alert_id` is the CAP <identifier>
-- (unique per sender); `disaster_event_id` links the message to the
-- triggering disaster event. cap_xml holds the full document.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cap_alerts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id          VARCHAR(100) NOT NULL UNIQUE,  -- CAP <identifier>, e.g. dl-<event>-<ts36>
    disaster_event_id UUID REFERENCES public.disaster_events(id) ON DELETE SET NULL,
    cap_xml           TEXT NOT NULL,                 -- full CAP v1.2 document
    audio_url         TEXT,                          -- voiced MP3 resource link
    language          VARCHAR(10),                   -- BCP-47 tag, e.g. 'hi-IN'
    severity          VARCHAR(20),                   -- Extreme | Severe | Moderate | ...
    status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | sent | delivered | failed
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cap_alerts_disaster_event_id ON public.cap_alerts(disaster_event_id);
CREATE INDEX IF NOT EXISTS idx_cap_alerts_status          ON public.cap_alerts(status);
CREATE INDEX IF NOT EXISTS idx_cap_alerts_created_at      ON public.cap_alerts(created_at);

-- RLS: alert documents are public (mandated dissemination); only gov
-- roles can create/update them.
ALTER TABLE public.cap_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cap_alerts_public_select ON public.cap_alerts;
CREATE POLICY cap_alerts_public_select ON public.cap_alerts
  FOR SELECT
  USING (
    public.current_user_role() IS NULL
    OR public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS cap_alerts_gov_all ON public.cap_alerts;
CREATE POLICY cap_alerts_gov_all ON public.cap_alerts
  FOR ALL
  USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 3. FM BROADCAST LOGS — per-station dispatch audit trail. One row per
-- strategy attempt for a CAP alert + station. Written by the FM
-- dispatcher (lib/broadcast/fm-dispatcher.ts); `retry_count` tracks the
-- retry budget, `status` moves sent → delivered / retrying → failed.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fm_broadcast_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cap_alert_id   UUID REFERENCES public.cap_alerts(id)   ON DELETE SET NULL,
    fm_station_id  UUID REFERENCES public.fm_stations(id)  ON DELETE SET NULL,
    strategy       VARCHAR(20) NOT NULL,       -- cap_api | rds | ftp | email | ivr
    status         VARCHAR(20) NOT NULL DEFAULT 'sent',    -- sent | delivered | failed | retrying
    response_code  INTEGER,                    -- HTTP / protocol status
    response_body  TEXT,                       -- raw upstream response (truncated)
    broadcast_time TIMESTAMPTZ,                -- when the station confirmed delivery
    retry_count    INTEGER NOT NULL DEFAULT 0,
    test_mode      BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fm_broadcast_logs_cap_alert_id  ON public.fm_broadcast_logs(cap_alert_id);
CREATE INDEX IF NOT EXISTS idx_fm_broadcast_logs_fm_station_id ON public.fm_broadcast_logs(fm_station_id);
CREATE INDEX IF NOT EXISTS idx_fm_broadcast_logs_status         ON public.fm_broadcast_logs(status);

-- RLS: dispatch telemetry is gov-only (control-room detail, never public).
ALTER TABLE public.fm_broadcast_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fm_broadcast_logs_gov_all ON public.fm_broadcast_logs;
CREATE POLICY fm_broadcast_logs_gov_all ON public.fm_broadcast_logs
  FOR ALL
  USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- =====================================================================
-- VERIFY:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN ('alert_audio', 'cap_alerts', 'fm_broadcast_logs');
-- All three should show rowsecurity = true.
-- =====================================================================
