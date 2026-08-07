-- =====================================================================
-- 0004_auth_trigger.sql
-- Phase 2 · Auth: auto-sync Supabase auth users into public.users
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard -> SQL Editor -> "New query".
--   2. Paste this entire file and press "Run" (or Cmd/Ctrl+Enter).
--   3. Verify: run a SELECT on auth.users after signing up a user, then
--      `SELECT * FROM public.users;` should show the new row.
--
-- The trigger fires AFTER INSERT on the hidden auth.users table (owned by
-- Supabase) and copies id + email into our public.users table.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. WIDEN THE ROLE CONSTRAINT
--    0001 defined the CHECK inline (auto-named users_role_check), which
--    does NOT include 'field_responder'. Recreate it to allow the role
--    this trigger assigns by default.
-- ---------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'responder', 'viewer', 'field_responder'));

-- ---------------------------------------------------------------------
-- 2. TRIGGER FUNCTION
--    SECURITY DEFINER lets this run with table-owner privileges (the
--    auth trigger runs as the Supabase internal role). An empty
--    search_path prevents search-path hijacking.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'field_responder')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. TRIGGER ON auth.users
--    DROP IF EXISTS keeps this migration idempotent / re-runnable.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
