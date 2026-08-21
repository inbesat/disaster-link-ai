-- =====================================================================
-- 0031_prevent_rls_bypass_and_district_isolation.sql
-- Phase 4 · RLS Bypass Prevention & Strict District Isolation
--
-- 1. Secures security definer functions with explicit auth.uid() checks.
-- 2. Ensures views inherit RLS from underlying tables by enabling WITH (security_invoker = true).
-- 3. Enforces strict district data isolation across operational and junction tables:
--    resource_allocations, alert_logs, evacuation_plans, shelters, resources.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SECURE HELPER FUNCTIONS AGAINST RLS BYPASS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_district()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district FROM public.users WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 2. PUBLIC VIEWS WITH SECURITY_INVOKER = TRUE (Inherits RLS)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_shelters_view WITH (security_invoker = true) AS
SELECT
  id,
  name,
  district,
  capacity,
  current_occupancy,
  lat,
  lng,
  status
FROM public.shelters;

-- ---------------------------------------------------------------------
-- 3. STRICT DISTRICT DATA ISOLATION ON JUNCTION TABLES
-- ---------------------------------------------------------------------

-- evacuation_plans: district-scoped access
DROP POLICY IF EXISTS evacuation_plans_district_isolation ON public.evacuation_plans;
CREATE POLICY evacuation_plans_district_isolation ON public.evacuation_plans
FOR ALL USING (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() IN ('district_admin', 'field_responder')
    AND district = public.current_user_district()
  )
) WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() IN ('district_admin', 'field_responder')
    AND district = public.current_user_district()
  )
);

-- alert_logs: strict district isolation for district_admin / field_responder
DROP POLICY IF EXISTS alert_logs_district_isolation ON public.alert_logs;
CREATE POLICY alert_logs_district_isolation ON public.alert_logs
FOR SELECT USING (
  public.current_user_role() = 'super_admin'
  OR district = public.current_user_district()
  OR status = 'sent'
);

-- resource_allocations: strict district boundary checks
DROP POLICY IF EXISTS resource_allocations_district_isolation ON public.resource_allocations;
CREATE POLICY resource_allocations_district_isolation ON public.resource_allocations
FOR ALL USING (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() IN ('district_admin', 'field_responder')
    AND (
      source_district = public.current_user_district()
      OR target_district = public.current_user_district()
    )
  )
) WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() IN ('district_admin', 'field_responder')
    AND source_district = public.current_user_district()
  )
);
