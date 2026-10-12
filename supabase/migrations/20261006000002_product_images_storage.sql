-- House of Avenya — Supabase Storage for admin product images
-- Created: 2026-10-06
--
-- Creates the `product-images` bucket used by the admin product
-- uploader and the Storage RLS policies that let a signed-in
-- admin upload, update, delete and read product images.
--
-- The bucket is public so the storefront can render the images
-- without any auth header; writes are gated by the admin policies.
-- The service-role key is never used by the application.
--
-- Apply with the Supabase SQL Editor (or `supabase db push`).
--
-- NOTE on the path-prefix check:
--   storage.objects.name is a TEXT column, so we constrain the
--   prefix with a plain LIKE expression. There is no
--   storage.filename() function in the standard Supabase schema,
--   and subscripting a text value with [n] is rejected by
--   PostgreSQL (error 42804). Matching the bucket_id plus the
--   leading path segment is sufficient to prevent path traversal.

-- ---------------------------------------------------------------------------
-- 1. The bucket itself
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,               -- 5 MiB per file
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS
-- ---------------------------------------------------------------------------

-- Public read: anyone (including the storefront) can fetch product images.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated admins can upload into the bucket. The path must live
-- under product-images/ so a path traversal cannot escape the bucket.
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
    AND name LIKE 'product-images/%'
  );

-- Authenticated admins can update (overwrite) their uploads.
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Authenticated admins can delete product images.
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());