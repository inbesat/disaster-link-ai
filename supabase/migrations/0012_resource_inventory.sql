-- =====================================================================
-- 0012_resource_inventory.sql
-- Phase 12 · Resource Inventory Management.
--
-- Recreates `resources` in the new inventory shape (category, lat/lng,
-- depot_name, status: available/deployed/maintenance) and adds the
-- `resource_requests` table for field supply requests.
-- The old Phase-1 `resources` table (type + PostGIS location) was never
-- wired into any UI, so it is safely dropped and recreated.
-- Run in: Supabase Dashboard -> SQL Editor -> Run (after 0011).
-- =====================================================================

DROP TABLE IF EXISTS public.resource_requests;
DROP TABLE IF EXISTS public.resources;

CREATE TABLE public.resources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL DEFAULT 'other'
             CHECK (category IN ('boat','food','medical','personnel','water','vehicle','communication','power','other')),
  quantity   integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit       text,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  status     text NOT NULL DEFAULT 'available'
             CHECK (status IN ('available','deployed','maintenance')),
  depot_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_category
  ON public.resources (category, status);

CREATE TABLE public.resource_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by    text NOT NULL,
  category        text NOT NULL,
  quantity_needed integer NOT NULL DEFAULT 0 CHECK (quantity_needed >= 0),
  urgency         text NOT NULL DEFAULT 'low'
                  CHECK (urgency IN ('low','high','critical')),
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','fulfilled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_requests_status
  ON public.resource_requests (status, urgency);
