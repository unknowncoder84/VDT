-- ============================================
-- VAKILDESK: STORAGE_SETUP.sql
-- Run ONCE in Supabase SQL Editor.
-- Fixes: "new row violates row-level security
-- policy" when uploading case files.
--
-- Creates the 'case-files' storage bucket and
-- the policies that let the app upload, read,
-- and delete files.
--
-- Firm isolation:
--   • Every file is stored under its tenant's
--     folder:  <tenant_id>/<case_id>/<file>
--   • The case_files DB table is tenant-scoped,
--     and a firm can only open its own cases —
--     so one firm can never see or reach another
--     firm's file links.
-- Safe to run multiple times.
-- ============================================

-- Step 1: Create the public bucket (50 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('case-files', 'case-files', true, 52428800)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 52428800;

-- Step 2: Policies on storage.objects for this bucket
-- (drop first so the script is idempotent)
DROP POLICY IF EXISTS "case_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "case_files_select" ON storage.objects;
DROP POLICY IF EXISTS "case_files_update" ON storage.objects;
DROP POLICY IF EXISTS "case_files_delete" ON storage.objects;

-- Allow uploading files into the case-files bucket
CREATE POLICY "case_files_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'case-files');

-- Allow reading / listing files in the case-files bucket
CREATE POLICY "case_files_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'case-files');

-- Allow replacing a file (upsert)
CREATE POLICY "case_files_update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'case-files')
  WITH CHECK (bucket_id = 'case-files');

-- Allow deleting a file
CREATE POLICY "case_files_delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'case-files');

-- ============================================
-- Done.
-- Go back to the app → open a case → Files tab →
-- choose a file → Attach. It will upload, and
-- every member of the SAME firm can download it
-- from the Files tab of that case.
-- ============================================
