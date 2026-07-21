-- Adds an optional link/URL column to Library and Storage items.
-- This lets firms attach a link to an already-existing digital file
-- (Google Drive, Dropbox, a PDF URL, etc.) alongside the physical
-- location tracking that already exists.
--
-- Run this once in the Supabase SQL Editor.

ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS link_url text;

ALTER TABLE public.storage_items
  ADD COLUMN IF NOT EXISTS link_url text;
