-- =====================================================================
-- 0009_flood_prediction_risk_labels.sql
-- Phase 5 · ML: widen flood_predictions.risk_level so it accepts BOTH
-- the ML/API vocabulary (Low/Medium/High/Critical) and the UI-facing
-- labels saved by lib/ml-client.ts (Safe/Watch/Warning/Evacuate).
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- =====================================================================

ALTER TABLE public.flood_predictions DROP CONSTRAINT IF EXISTS flood_predictions_risk_level_check;

ALTER TABLE public.flood_predictions
  ADD CONSTRAINT flood_predictions_risk_level_check
  CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical',
                        'Safe', 'Watch', 'Warning', 'Evacuate'));