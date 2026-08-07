-- =====================================================================
-- 0015_emergency_plans_and_embedding_versioning.sql
-- Phase 1 gap: add the `emergency_plans` table originally specified in the
-- initial schema (the prior model only exposed `evacuation_plans`). This
-- stores a structured, AI-generated emergency plan per disaster event.
--
-- Phase 15: add explicit embedding versioning to `emergency_documents` so a
-- re-uploaded document cleanly replaces stale vectors instead of silently
-- mixing old + new chunks together.
--
-- Idempotent; run after 0014.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. emergency_plans (Phase 1 spec table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_event_id uuid REFERENCES public.disaster_events(id) ON DELETE CASCADE,
  district        text,
  title           text NOT NULL,
  content         text NOT NULL,
  plan_json       jsonb,
  status          text NOT NULL DEFAULT 'draft',   -- draft | active | approved | completed
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_plans_event
  ON public.emergency_plans (disaster_event_id);

CREATE INDEX IF NOT EXISTS idx_emergency_plans_status
  ON public.emergency_plans (status);

-- ---------------------------------------------------------------------
-- 2. Embedding versioning for emergency_documents
-- Composed as `embedding_source` (a content hash) + `embedding_version`
-- (a monotonically-increasing integer bumped on every re-embed). New uploads
-- with the same source hash replace rows whose version is stale.
-- ---------------------------------------------------------------------
ALTER TABLE public.emergency_documents
  ADD COLUMN IF NOT EXISTS embedding_version integer NOT NULL DEFAULT 0;

ALTER TABLE public.emergency_documents
  ADD COLUMN IF NOT EXISTS embedding_source text;

CREATE INDEX IF NOT EXISTS idx_emergency_documents_version
  ON public.emergency_documents (embedding_source, embedding_version);

-- ---------------------------------------------------------------------
-- 3. Auto-bump updated_at on emergency_plans
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at_emergency_plans()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_emergency_plans ON public.emergency_plans;
CREATE TRIGGER set_updated_at_emergency_plans
BEFORE UPDATE ON public.emergency_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_emergency_plans();