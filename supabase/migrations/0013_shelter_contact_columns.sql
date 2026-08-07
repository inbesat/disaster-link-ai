-- =====================================================================
-- 0013_shelter_contact_columns.sql
-- Phase 8 · Add the shelter contact & facility columns that the Prisma
-- schema / UI reference but no migration had created yet:
--   • facilities       — JSON map { water, food, medical, electricity }
--   • contact_person   — name of the on-site contact
--   • phone            — contact number for the shelter
--   • image_url        — optional photo verification (Supabase Storage)
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS).
-- Run in: Supabase Dashboard -> SQL Editor -> Run (after 0010–0012).
-- =====================================================================

ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS facilities jsonb;

ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS contact_person text;

ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS image_url text;