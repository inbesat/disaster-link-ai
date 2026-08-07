-- =====================================================================
-- 0005_profile_columns.sql
-- Phase 2 · Profile Setup: adds responder profile fields to public.users
-- (organization, phone, emergency contact, assigned district, avatar).
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- =====================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb,
  ADD COLUMN IF NOT EXISTS assigned_district text,
  ADD COLUMN IF NOT EXISTS avatar_url text;
