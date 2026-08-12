-- =====================================================================
-- 0023_fix_auth_trigger_default_role.sql
-- Phase 21 · Security hardening — fix privilege escalation.
--
-- BUG: handle_new_user() trigger assigned EVERY new user the role
--   `field_responder` by default. This granted government responder
--   privileges to anyone who signed up via Supabase Auth.
--
-- FIX: New users now default to `public` (citizen). Government roles
--   (field_responder, district_admin, super_admin) must be granted
--   explicitly by an existing admin via the Admin Panel.
--
-- Also aligns the users_role_check constraint with the current
-- UserRole enum (adds 'public' and 'district_admin').
-- =====================================================================

-- 1. Fix the role CHECK constraint to include all valid roles.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('public', 'field_responder', 'district_admin', 'super_admin'));

-- 2. Fix the trigger function — default role is now 'public'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'public')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Ensure the trigger still exists (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
