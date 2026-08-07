-- =====================================================================
-- 0006_weather_schema.sql
-- Phase 4 · Data Ingestion: weather observations + upstream data sources.
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.weather_data (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id   text,
  timestamp    timestamptz NOT NULL,
  rainfall_mm  double precision NOT NULL DEFAULT 0,
  river_level_m double precision,
  district     text,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp
  ON public.weather_data (timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_data_district
  ON public.weather_data (district);

CREATE TABLE IF NOT EXISTS public.data_source (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  endpoint        text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_fetch_time timestamptz,
  status          text NOT NULL DEFAULT 'green'
                  CHECK (status IN ('green', 'amber', 'red')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
