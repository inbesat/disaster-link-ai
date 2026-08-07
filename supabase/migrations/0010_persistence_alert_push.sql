-- =====================================================================
-- 0010_persistence_alert_push.sql
-- Phase 7/8/9 · persistence layer + web push.
--
-- Adds the tables referenced by the Prisma schema but missing from the
-- running database, so the planning / alert / web-push features actually
-- persist instead of degrading to in-memory state:
--   • alert_rules / alert_templates  — declarative alert orchestration
--   • evacuation_plans / road_closures — persisted routing layer
--   • push_subscriptions            — Web Push (VAPID) receivers
-- All statements are idempotent / IF NOT EXISTS.
-- Run in: Supabase Dashboard -> SQL Editor -> Run (after 0001–0009).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALERT RULES — declarative routing for the alert engine
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_condition  text NOT NULL,               -- e.g. critical_flood
  target_roles       text NOT NULL,               -- comma-separated roles
  channels           text NOT NULL,               -- e.g. '["sms","in_app","push"]'
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. ALERT TEMPLATES — message bodies with {variable} placeholders
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  message_body text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. EVACUATION PLANS — one row per village routed to a shelter.
-- route_geojson may be NULL when route geometry is not stored.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evacuation_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_name        text NOT NULL,
  assigned_shelter_id uuid NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  estimated_evacuees  integer NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'in_transit', 'completed')),
  route_geojson       text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evacuation_plans_status
  ON public.evacuation_plans (status);

-- ---------------------------------------------------------------------
-- 4. ROAD CLOSURES — points blocking evacuation routes.
-- Handled by the admin RoadClosureTool and checked during route safety.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.road_closures (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  reason     text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_road_closures_active
  ON public.road_closures (is_active);

-- ---------------------------------------------------------------------
-- 5. PUSH SUBSCRIPTIONS — Web Push (VAPID) receivers keyed to a user.
-- endpoint is unique so re-subscribing is idempotent (upsert).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------
-- 6. GUARANTEE shelter lat/lng columns (idempotent) so Prisma and raw
--    PostGIS queries both read usable coordinates.
-- ---------------------------------------------------------------------
ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS lng double precision;

-- ---------------------------------------------------------------------
-- 7. SEED default alert rule + template so the engine works out of the box
--    (idempotent — only inserts when missing).
-- ---------------------------------------------------------------------
INSERT INTO public.alert_templates (name, message_body)
SELECT 'critical_flood',
       '⚠️ {risk_level} {disaster_type} warning for {district} at {predicted_time}. Evacuate zones: {evacuation_zones}.'
WHERE NOT EXISTS (SELECT 1 FROM public.alert_templates WHERE name = 'critical_flood');

INSERT INTO public.alert_templates (name, message_body)
SELECT 'warning_flood',
       '⚠️ High {disaster_type} watch for {district} at {predicted_time}. Prepare supplies and standby.'
WHERE NOT EXISTS (SELECT 1 FROM public.alert_templates WHERE name = 'warning_flood');

INSERT INTO public.alert_rules (trigger_condition, target_roles, channels)
SELECT 'critical_flood', 'super_admin,district_admin,field_responder', '["sms","in_app","push"]'
WHERE NOT EXISTS (SELECT 1 FROM public.alert_rules WHERE trigger_condition = 'critical_flood');

INSERT INTO public.alert_rules (trigger_condition, target_roles, channels)
SELECT 'warning_flood', 'district_admin,super_admin', '["in_app","push"]'
WHERE NOT EXISTS (SELECT 1 FROM public.alert_rules WHERE trigger_condition = 'warning_flood');