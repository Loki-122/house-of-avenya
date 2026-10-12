-- Admin product management — schema extension and RLS
-- Created: 2026-10-06
--
-- Adds the is_active column to products and the admin RLS
-- policies needed for the /admin/products management page.
-- Existing public-read policies are preserved so the
-- storefront continues to work for active products only.

-- 1. is_active on products (defaults to TRUE so seed data stays visible)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. Re-create is_admin() idempotently (needed by the policies below)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Public read products: only active products are visible to the storefront
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products
  FOR SELECT
  USING (is_active = TRUE);

-- 4. Admin can read every product regardless of is_active
DROP POLICY IF EXISTS "Admins can read all products" ON products;
CREATE POLICY "Admins can read all products" ON products
  FOR SELECT
  USING (public.is_admin());

-- 5. Admin write policies on products
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE
  USING (public.is_admin());

-- 6. Admin policies for all product-related tables
CREATE POLICY "Admins can manage product_images" ON product_images
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage product_colors" ON product_colors
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage product_sizes" ON product_sizes
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage product_variants" ON product_variants
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage product_details" ON product_details
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage product_care" ON product_care
  FOR ALL
  USING (public.is_admin());
