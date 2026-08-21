-- ---------------------------------------------------------------------
-- supabase/migrations/0032_storage_rls_and_policies.sql
-- Phase 8 · Storage RLS Policies & Bucket Security Hardening
-- ---------------------------------------------------------------------

-- Enable Row Level Security on storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;

-- Disable public bucket listing for unauthenticated users
DROP POLICY IF EXISTS "Public bucket listing disabled" ON storage.buckets;
CREATE POLICY "Public bucket listing disabled" ON storage.buckets
FOR SELECT USING (
  auth.role() = 'authenticated' OR id = 'public-sops'
);

-- 1. Avatars: users can only manage their own files
DROP POLICY IF EXISTS "avatar_access" ON storage.objects;
CREATE POLICY "avatar_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'user-avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR name LIKE auth.uid()::text || '_%')
);

-- 2. Documents: role-based access for district_admin and super_admin
DROP POLICY IF EXISTS "document_access" ON storage.objects;
CREATE POLICY "document_access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'document-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('district_admin', 'super_admin')
  )
);

-- 3. Reports & Sensitive responder files: responder / admin access
DROP POLICY IF EXISTS "reports_access" ON storage.objects;
CREATE POLICY "reports_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'field-reports'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('field_responder', 'district_admin', 'super_admin')
  )
);

-- 4. Public emergency SOPs: readable by all, writable by admin only
DROP POLICY IF EXISTS "public_sops_read" ON storage.objects;
CREATE POLICY "public_sops_read" ON storage.objects
FOR SELECT USING (bucket_id = 'public-sops');

DROP POLICY IF EXISTS "public_sops_write" ON storage.objects;
CREATE POLICY "public_sops_write" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'public-sops'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('district_admin', 'super_admin')
  )
);
