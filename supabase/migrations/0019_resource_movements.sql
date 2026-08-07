-- =====================================================================
-- 0019_resource_movements.sql
-- Phase 12 · Resource Inventory Management — Movement Tracking.
--
-- Immutable trail of where resources went (depot → disaster site) with
-- timestamps, so district admins can audit dispatch/delivery history.
-- Written on every dispatch (server action approveRequest) and via the
-- Record Movement form on the inventory page.
--
-- RLS posture mirrors the `resources` table (0017 §5): read is open for
-- the public-safe operational subset; writes are admin-only
-- (super_admin / district_admin).
--
-- Idempotent: table + policies are DROP-if-exists + CREATE. Run after
-- 0001–0017.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.resource_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   uuid,                          -- nullable: row may be deleted
  resource_name text NOT NULL,                 -- denormalised snapshot
  action        text NOT NULL,                 -- dispatched | delivered | returned | adjusted
  from_label    text,
  to_label      text NOT NULL,
  to_lat        double precision NOT NULL,
  to_lng        double precision NOT NULL,
  quantity      integer NOT NULL DEFAULT 0,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_movements_resource_id_idx
  ON public.resource_movements (resource_id);
CREATE INDEX IF NOT EXISTS resource_movements_action_created_at_idx
  ON public.resource_movements (action, created_at);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (mirrors resources, 0017 §5)
-- ---------------------------------------------------------------------
ALTER TABLE public.resource_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resource_movements_select ON public.resource_movements;
CREATE POLICY resource_movements_select ON public.resource_movements FOR SELECT USING (
  auth.uid() IS NOT NULL OR auth.uid() IS NULL  -- authenticated + anon read
);

DROP POLICY IF EXISTS resource_movements_write ON public.resource_movements;
CREATE POLICY resource_movements_write ON public.resource_movements FOR ALL USING (
  public.current_user_role() IN ('super_admin', 'district_admin')
) WITH CHECK (
  public.current_user_role() IN ('super_admin', 'district_admin')
);
