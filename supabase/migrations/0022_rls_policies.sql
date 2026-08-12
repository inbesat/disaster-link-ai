-- =====================================================================
-- 0022_rls_policies.sql
-- Phase 21 · Security hardening — enable RLS on 8 previously unsecured
-- tables AND fix the tautology bug on resources / resource_movements.
--
-- Tables secured: alert_rules, alert_templates, evacuation_plans,
--   road_closures, weather_data, data_source, emergency_plans, plan_feedback
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
--   Option C — psql: psql "$SUPABASE_DB_URL" -f 0022_rls_policies.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. FIX tautology on resources (0017 left an allow-all SELECT policy)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS resources_select ON public.resources;
DROP POLICY IF EXISTS resource_movements_select ON public.resource_movements;

-- ---------------------------------------------------------------------
-- 1. ALERT_RULES — gov-only config table. Public has NO access.
-- ---------------------------------------------------------------------
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_rules_gov_all ON public.alert_rules;
CREATE POLICY alert_rules_gov_all ON public.alert_rules
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- ---------------------------------------------------------------------
-- 2. ALERT_TEMPLATES — gov-only config table. Public has NO access.
-- ---------------------------------------------------------------------
ALTER TABLE public.alert_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_templates_gov_all ON public.alert_templates;
CREATE POLICY alert_templates_gov_all ON public.alert_templates
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- ---------------------------------------------------------------------
-- 3. EVACUATION_PLANS — gov-only operational data. Public has NO access.
-- ---------------------------------------------------------------------
ALTER TABLE public.evacuation_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evacuation_plans_gov_all ON public.evacuation_plans;
CREATE POLICY evacuation_plans_gov_all ON public.evacuation_plans
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 4. ROAD_CLOSURES — public SELECT (for routing safety), gov ALL.
-- ---------------------------------------------------------------------
ALTER TABLE public.road_closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS road_closures_public_select ON public.road_closures;
CREATE POLICY road_closures_public_select ON public.road_closures
  FOR SELECT USING (
    auth.uid() IS NULL                           -- public viewers
    OR public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS road_closures_gov_all ON public.road_closures;
CREATE POLICY road_closures_gov_all ON public.road_closures
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- ---------------------------------------------------------------------
-- 5. WEATHER_DATA — public SELECT (for public weather widget), gov ALL.
-- ---------------------------------------------------------------------
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS weather_data_public_select ON public.weather_data;
CREATE POLICY weather_data_public_select ON public.weather_data
  FOR SELECT USING (
    auth.uid() IS NULL                           -- public viewers
    OR public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS weather_data_gov_all ON public.weather_data;
CREATE POLICY weather_data_gov_all ON public.weather_data
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- ---------------------------------------------------------------------
-- 6. DATA_SOURCE — gov-only config table. Public has NO access.
-- ---------------------------------------------------------------------
ALTER TABLE public.data_source ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS data_source_gov_all ON public.data_source;
CREATE POLICY data_source_gov_all ON public.data_source
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- ---------------------------------------------------------------------
-- 7. EMERGENCY_PLANS — gov-only operational data. Public has NO access.
-- ---------------------------------------------------------------------
ALTER TABLE public.emergency_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emergency_plans_gov_all ON public.emergency_plans;
CREATE POLICY emergency_plans_gov_all ON public.emergency_plans
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 8. PLAN_FEEDBACK — gov-only. Citizens submit via separate endpoint.
-- ---------------------------------------------------------------------
ALTER TABLE public.plan_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_feedback_gov_all ON public.plan_feedback;
CREATE POLICY plan_feedback_gov_all ON public.plan_feedback
  FOR ALL USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- =====================================================================
-- VERIFY:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN (
--     'alert_rules','alert_templates','evacuation_plans','road_closures',
--     'weather_data','data_source','emergency_plans','plan_feedback',
--     'resources','resource_movements'
--   ) ORDER BY tablename;
-- All should show rowsecurity = true.
-- =====================================================================
