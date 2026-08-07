-- =====================================================================
-- 0014_plan_feedback.sql
-- Phase 11 · Persist thumbs up/down RLHF feedback on AI-generated plans
-- so quality signals can be reviewed per message / query.
-- Idempotent; run after 0010–0013.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.plan_feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  rating     text NOT NULL CHECK (rating IN ('up', 'down')),
  user_id    text,
  district   text,
  prompt     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_feedback_message
  ON public.plan_feedback (message_id);

CREATE INDEX IF NOT EXISTS idx_plan_feedback_rating
  ON public.plan_feedback (rating, created_at DESC);