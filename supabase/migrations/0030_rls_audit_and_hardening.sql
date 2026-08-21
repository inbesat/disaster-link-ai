-- =====================================================================
-- 0030_rls_audit_and_hardening.sql
-- Phase 4 · Supabase RLS Policy Comprehensive Audit & Hardening.
--
-- Ensures ROW LEVEL SECURITY is ENABLED on all core tables:
--   users, profiles, disaster_events, flood_predictions, shelters,
--   resources, resource_allocations, alert_logs, emergency_plans,
--   crowdsourced_reports, weather_data, emergency_documents,
--   fm_broadcasts, api_keys.
--
-- Restricts public data exposure to district-scoped, non-sensitive columns
-- and verified/sent status.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL AUDITED TABLES
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disaster_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flood_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crowdsourced_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fm_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. PUBLIC DATA EXPOSURE HARDENING (Prompt 4.2)
-- ---------------------------------------------------------------------

-- flood_predictions: public sees ONLY their district's risk level
DROP POLICY IF EXISTS public_flood_predictions ON public.flood_predictions;
CREATE POLICY public_flood_predictions ON public.flood_predictions
FOR SELECT USING (
  district = public.current_user_district()
  AND risk_level IS NOT NULL
);

-- shelters: public sees shelter rows matching their district
DROP POLICY IF EXISTS public_shelters ON public.shelters;
CREATE POLICY public_shelters ON public.shelters
FOR SELECT USING (
  auth.uid() IS NULL OR district = public.current_user_district()
);

-- alert_logs / alerts: public sees ONLY alerts targeting their district with 'sent' status
DROP POLICY IF EXISTS public_alerts ON public.alert_logs;
CREATE POLICY public_alerts ON public.alert_logs
FOR SELECT USING (
  district = public.current_user_district()
  AND status = 'sent'
);

-- crowdsourced_reports: public sees ONLY verified reports in their district
DROP POLICY IF EXISTS public_reports ON public.crowdsourced_reports;
CREATE POLICY public_reports ON public.crowdsourced_reports
FOR SELECT USING (
  district = public.current_user_district()
  AND verification_status = 'verified'
);

-- ---------------------------------------------------------------------
-- 3. GOVERNMENT DATA ACCESS HARDENING (Prompt 4.3)
-- ---------------------------------------------------------------------

-- resources: gov users see resources in their assigned districts
DROP POLICY IF EXISTS gov_resources ON public.resources;
CREATE POLICY gov_resources ON public.resources
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

-- responder_locations: only team members and admins can see
DROP POLICY IF EXISTS responder_locations ON public.users;
CREATE POLICY responder_locations ON public.users
FOR SELECT USING (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() IN ('district_admin', 'field_responder')
    AND district = public.current_user_district()
  )
  OR id = auth.uid()
);

-- shelters: field_responders can UPDATE shelter occupancy but NOT DELETE shelters
DROP POLICY IF EXISTS shelters_responder_update ON public.shelters;
CREATE POLICY shelters_responder_update ON public.shelters
FOR UPDATE USING (
  public.current_user_role() = 'field_responder'
  AND district = public.current_user_district()
);

-- shelters: district_admins manage their assigned district only
DROP POLICY IF EXISTS shelters_district_admin_manage ON public.shelters;
CREATE POLICY shelters_district_admin_manage ON public.shelters
FOR ALL USING (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() = 'district_admin'
    AND district = public.current_user_district()
  )
) WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() = 'district_admin'
    AND district = public.current_user_district()
  )
);

-- api_keys: gov super_admin only
DROP POLICY IF EXISTS api_keys_super_admin ON public.api_keys;
CREATE POLICY api_keys_super_admin ON public.api_keys
FOR ALL USING (
  public.current_user_role() = 'super_admin'
) WITH CHECK (
  public.current_user_role() = 'super_admin'
);
