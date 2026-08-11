-- =====================================================================
-- 0020_rls_policies.sql
-- Phase 12 · Step 2 · Supabase Row-Level Security (RLS) Policies
--
-- NOTE: numbered 0020 (not 005) because this file enables RLS on tables
-- created in later migrations (resources @0012, crowdsourced_reports
-- @0016) — a lower number would break `supabase db push` ordering.
--
-- Secures the shared Phase 12 backend at the Postgres level so PUBLIC
-- (anon / citizen) sessions can never scrape government data. RLS is
-- enforced by Postgres itself for EVERY query path — REST, GraphQL, the
-- data bridge, or a raw SQL console — never just by the app.
--
-- Posture (per table):
--
--   shelters             Public = SELECT only. Admins  = ALL.
--                         Responders = UPDATE occupancy only.
--   resources            Public = DENIED all access. Gov  = ALL.
--   crowdsourced_reports Public = INSERT. Gov  = SELECT / UPDATE.
--
-- HOW TO RUN
--   Option A — Supabase SQL editor (recommended): open your project's
--     SQL Editor, paste this whole file, click "Run". Idempotent, safe to
--     re-run.
--   Option B — CLI:  supabase db push
--     (rub through local first:  supabase start, supabase db reset).
--   Option C — psql:  psql "$SUPABASE_DB_URL" -f 0020_rls_policies.sql
--
-- Requires a `role` column on public.users (0005_profile_columns.sql) and
-- an auth.uid() source (Supabase Auth). Policies are DROP-if-exists,
-- so re-running never stacks duplicate policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. ROLE HELPER (SECURITY DEFINER avoids policy-on-users recursion)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 1. SHELTERS — public (anon) SELECT only; admins ALL; responders UPDATE
--    occupancy only.
-- ---------------------------------------------------------------------
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

-- Public / anon citizens: read-only.
DROP POLICY IF EXISTS shelters_public_select ON public.shelters;
CREATE POLICY shelters_public_select ON public.shelters
  FOR SELECT USING (
    auth.uid() IS NULL                           -- public viewers
    OR public.current_user_role() IN ('super_admin', 'district_admin')
    OR public.current_user_role() = 'field_responder'
  );

-- Admins: full CRUD.
DROP POLICY IF EXISTS shelters_admin_all ON public.shelters;
CREATE POLICY shelters_admin_all ON public.shelters
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- Responders: may touch occupancy ONLY (name/capacity/gov fields are
-- out of scope — WITH CHECK forbids writing them).
DROP POLICY IF EXISTS shelters_responder_occupancy ON public.shelters;
CREATE POLICY shelters_responder_occupancy ON public.shelters
  FOR UPDATE USING (
    public.current_user_role() = 'field_responder'
  )
  WITH CHECK (
    public.current_user_role() = 'field_responder'
    AND current_occupancy IS NOT NULL
    AND name  = (SELECT name  FROM public.shelters WHERE id = shelters.id)
    AND capacity   = (SELECT capacity   FROM public.shelters WHERE id = shelters.id)
    AND facilities = (SELECT facilities FROM public.shelters WHERE id = shelters.id)
    AND contact_person = (SELECT contact_person FROM public.shelters WHERE id = shelters.id)
  );

-- ---------------------------------------------------------------------
-- 2. RESOURCES — gov-only inventory: public is DENIED ALL access
--    (no policy for anon ⇒ RLS blocks every anon statement).
-- ---------------------------------------------------------------------
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resources_gov_all ON public.resources;
CREATE POLICY resources_gov_all ON public.resources
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 3. CROWDSOURCED REPORTS — the public signal: ANY citizen may INSERT
--    (data-minimized: no PII). Only gov may SELECT / UPDATE (verify).
-- ---------------------------------------------------------------------
ALTER TABLE public.crowdsourced_reports ENABLE ROW LEVEL SECURITY;

-- Public: insert from the citizen Report Incident form.
DROP POLICY IF EXISTS reports_public_insert ON public.crowdsourced_reports;
CREATE POLICY reports_public_insert ON public.crowdsourced_reports
  FOR INSERT WITH CHECK (true);

-- Gov: read + UPDATE (verification_status promotion).
DROP POLICY IF EXISTS reports_gov_select ON public.crowdsourced_reports;
CREATE POLICY reports_gov_select ON public.crowdsourced_reports
  FOR SELECT USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS reports_gov_update ON public.crowdsourced_reports;
CREATE POLICY reports_gov_update ON public.crowdsourced_reports
  FOR UPDATE USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- =====================================================================
-- DONE. Verify in the Supabase SQL editor:
--   SELECT policyname, tablename, cmd, roles
--   FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
-- Public (anon) statements against `resources` now return 0 rows.
-- =====================================================================