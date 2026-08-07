-- =====================================================================
-- 0008_flood_prediction_ml.sql
-- Phase 5 · ML predictions: reshape flood_predictions into the ML-prediction
-- store (id, lat, lng, prediction_timestamp, risk_level, confidence_score).
--
-- The Phase-1 table (0001) carried PostGIS geometry + a disaster_event FK but
-- is not wired to any UI yet, so it is safely dropped and recreated to match
-- the Prisma model used by the XGBoost integration.
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- =====================================================================

DROP TABLE IF EXISTS public.flood_predictions;

CREATE TABLE public.flood_predictions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat                  double precision NOT NULL,
  lng                  double precision NOT NULL,
  prediction_timestamp timestamptz NOT NULL,
  risk_level           text NOT NULL
                       CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  confidence_score     double precision NOT NULL
                       CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flood_predictions_risk
  ON public.flood_predictions (risk_level, prediction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flood_predictions_lat_lng
  ON public.flood_predictions (lat, lng);
