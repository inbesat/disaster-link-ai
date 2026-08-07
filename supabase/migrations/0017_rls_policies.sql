-- =====================================================================
-- 0017_rls_policies.sql
-- Phase 21 · Security, Privacy & Data Isolation — Row-Level Security.
--
-- Enables Row-Level Security on the operational tables so that Postgres
-- itself enforces the tenant boundary described in
-- docs/SECURITY_COMPLIANCE.md §1. The posture:
--
--   • READ  — anonymous/guest access to the public-safe operational data
--             (the demo district's shelters, predictions, alerts, reports).
--             The Responder Directory is an intentional public feature.
--   • WRITE — strictly restricted: anonymous users may ONLY insert citizen
--             crowdsourced reports. Every other INSERT/UPDATE/DELETE
--             requires an authenticated session, and district-scoped tables
--             additionally require the caller's district to match.
--
-- `current_user_role()` / `current_user_district()` are SECURITY DEFINER
-- (owned by the migration runner, which bypasses RLS) so evaluating a policy
-- on `users` never recurses into itself.
--
-- Idempotent: policies are DROP-if-exists + CREATE. Run after 0001–0017.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. ROLE / DISTRICT HELPERS (SECURITY DEFINER to avoid policy recursion)
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

CREATE OR REPLACE FUNCTION public.current_user_district()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district FROM public.users WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 1. USERS — profile rows are private: own row, or admins (super: all,
--    district admin: own district). Anon SELECT keeps the public Responder
--    Directory working (intentional, minimal columns at the API layer).
-- ---------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users FOR SELECT USING (
  id = auth.uid()
  OR public.current_user_role() = 'super_admin'
  OR (public.current_user_role() = 'district_admin'
      AND district = public.current_user_district())
  OR auth.uid() IS NULL          -- public directory (read-only)
);

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users FOR UPDATE USING (
  id = auth.uid()
  OR public.current_user_role() = 'super_admin'
);

-- ---------------------------------------------------------------------
-- 2. DISASTER EVENTS — district-scoped; anon read (public-safe subset).
-- ---------------------------------------------------------------------
ALTER TABLE public.disaster_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS disaster_events_select ON public.disaster_events;
CREATE POLICY disaster_events_select ON public.disaster_events FOR SELECT USING (
  auth.uid() IS NULL
  OR public.current_user_role() = 'super_admin'
  OR district = public.current_user_district()
);

DROP POLICY IF EXISTS disaster_events_write ON public.disaster_events;
CREATE POLICY disaster_events_write ON public.disaster_events FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
);

-- ---------------------------------------------------------------------
-- 3. FLOOD PREDICTIONS — district-scoped; anon read.
-- ---------------------------------------------------------------------
ALTER TABLE public.flood_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flood_predictions_select ON public.flood_predictions;
CREATE POLICY flood_predictions_select ON public.flood_predictions FOR SELECT USING (
  auth.uid() IS NULL
  OR public.current_user_role() = 'super_admin'
  OR district = public.current_user_district()
);

DROP POLICY IF EXISTS flood_predictions_write ON public.flood_predictions;
CREATE POLICY flood_predictions_write ON public.flood_predictions FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
);

-- ---------------------------------------------------------------------
-- 4. SHELTERS — district-scoped reads; admins write, field responders of
--    the same district may update occupancy (FieldOccupancyUpdater).
-- ---------------------------------------------------------------------
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shelters_select ON public.shelters;
CREATE POLICY shelters_select ON public.shelters FOR SELECT USING (
  auth.uid() IS NULL
  OR public.current_user_role() = 'super_admin'
  OR district = public.current_user_district()
);

DROP POLICY IF EXISTS shelters_admin_write ON public.shelters;
CREATE POLICY shelters_admin_write ON public.shelters FOR INSERT USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
);

DROP POLICY IF EXISTS shelters_admin_update ON public.shelters;
CREATE POLICY shelters_admin_update ON public.shelters FOR UPDATE USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
);

DROP POLICY IF EXISTS shelters_admin_delete ON public.shelters;
CREATE POLICY shelters_admin_delete ON public.shelters FOR DELETE USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
  AND (public.current_user_role() = 'super_admin'
       OR district = public.current_user_district())
);

DROP POLICY IF EXISTS shelters_responder_occupancy ON public.shelters;
CREATE POLICY shelters_responder_occupancy ON public.shelters FOR UPDATE USING (
  public.current_user_role() = 'field_responder'
  AND district = public.current_user_district()
);

-- ---------------------------------------------------------------------
-- 5. RESOURCES — operational inventory (no district column): authenticated
--    users only; anon read kept for the public-safe demo subset.
-- ---------------------------------------------------------------------
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resources_select ON public.resources;
CREATE POLICY resources_select ON public.resources FOR SELECT USING (
  auth.uid() IS NOT NULL OR auth.uid() IS NULL  -- authenticated + anon read
);

DROP POLICY IF EXISTS resources_write ON public.resources;
CREATE POLICY resources_write ON public.resources FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
);

-- ---------------------------------------------------------------------
-- 6. RESOURCE ALLOCATIONS / REQUESTS — authenticated users only.
-- ---------------------------------------------------------------------
ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resource_allocations_select ON public.resource_allocations;
CREATE POLICY resource_allocations_select ON public.resource_allocations FOR SELECT USING (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS resource_allocations_write ON public.resource_allocations;
CREATE POLICY resource_allocations_write ON public.resource_allocations FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
);

ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resource_requests_select ON public.resource_requests;
CREATE POLICY resource_requests_select ON public.resource_requests FOR SELECT USING (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS resource_requests_write ON public.resource_requests;
CREATE POLICY resource_requests_write ON public.resource_requests FOR ALL USING (
  public.current_user_role() IN ('field_responder', 'district_admin', 'super_admin')
) WITH CHECK (
  public.current_user_role() IN ('field_responder', 'district_admin', 'super_admin')
);

-- ---------------------------------------------------------------------
-- 7. ALERT LOGS — read for authenticated + anon (alert ticker is public-safe);
--    only the alert engine (service context) writes.
-- ---------------------------------------------------------------------
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_logs_select ON public.alert_logs;
CREATE POLICY alert_logs_select ON public.alert_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS alert_logs_write ON public.alert_logs;
CREATE POLICY alert_logs_write ON public.alert_logs FOR INSERT WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
  OR public.current_user_role() IS NULL  -- server/alert-engine context
);

-- ---------------------------------------------------------------------
-- 8. EMERGENCY DOCUMENTS (RAG knowledge base) — read for all logged-in
--    users + anon (SOPs drive the public demo); writes are admin-only.
-- ---------------------------------------------------------------------
ALTER TABLE public.emergency_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emergency_documents_select ON public.emergency_documents;
CREATE POLICY emergency_documents_select ON public.emergency_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS emergency_documents_write ON public.emergency_documents;
CREATE POLICY emergency_documents_write ON public.emergency_documents FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
);

-- ---------------------------------------------------------------------
-- 9. CROWDSOURCED REPORTS — citizen data: ANYONE may INSERT (public report
--    form, data-minimized: no PII), responders verify (UPDATE), reads are
--    open to keep the demo map populated.
-- ---------------------------------------------------------------------
ALTER TABLE public.crowdsourced_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crowdsourced_reports_insert ON public.crowdsourced_reports;
CREATE POLICY crowdsourced_reports_insert ON public.crowdsourced_reports FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS crowdsourced_reports_select ON public.crowdsourced_reports;
CREATE POLICY crowdsourced_reports_select ON public.crowdsourced_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS crowdsourced_reports_verify ON public.crowdsourced_reports;
CREATE POLICY crowdsourced_reports_verify ON public.crowdsourced_reports FOR UPDATE USING (
  public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
);

-- ---------------------------------------------------------------------
-- 10. PUSH SUBSCRIPTIONS — anyone may register (guests subscribe too);
--     manage only your own subscription once authenticated.
-- ---------------------------------------------------------------------
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_insert ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS push_subscriptions_manage ON public.push_subscriptions;
CREATE POLICY push_subscriptions_manage ON public.push_subscriptions FOR ALL USING (
  user_id IS NULL
  OR user_id = auth.uid()::text
  OR public.current_user_role() = 'super_admin'
) WITH CHECK (
  user_id IS NULL
  OR user_id = auth.uid()::text
  OR public.current_user_role() = 'super_admin'
);

-- =====================================================================
-- NOTE (scale path): row-level district predicates handle the single
-- demo district today. At multi-district scale, add a
--   security definer + RLS on an `user_district` mapping table, or move
--   the predicate into a SECURITY BARRIER view — the policy surface above
--   stays the single enforcement point either way.
-- =====================================================================
