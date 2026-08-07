-- =====================================================================
-- 0007_role_alignment_and_river_name.sql
-- Fixes two Phase 2/4 gaps:
--   1. Align public.users.role with the Zod RBAC enum
--      (lib/validations/user.ts): super_admin | district_admin |
--      field_responder | viewer. The 0001/0004 CHECK still allowed the
--      legacy 'admin'/'responder' values and rejected the Zod values.
--   2. Add the river_name column to weather_data (Phase 4 checklist).
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ROLE ALIGNMENT
--    Map legacy values onto the closest Zod role before swapping the
--    constraint, otherwise the UPDATE itself would violate the CHECK.
--    'admin'      -> district_admin (least-privilege mapping)
--    'responder'  -> field_responder
--    'viewer'     -> viewer (unchanged)
-- ---------------------------------------------------------------------
UPDATE public.users SET role = 'district_admin' WHERE role = 'admin';
UPDATE public.users SET role = 'field_responder' WHERE role = 'responder';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'district_admin', 'field_responder', 'viewer'));

ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'field_responder';

-- ---------------------------------------------------------------------
-- 2. WEATHER DATA — RIVER NAME
-- ---------------------------------------------------------------------
ALTER TABLE public.weather_data
  ADD COLUMN IF NOT EXISTS river_name text;
