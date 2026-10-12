-- House of Avenya — Cart synchronization support
-- Created: 2026-10-07
--
-- Extends the existing cart_items table to support server-side cart
-- persistence for authenticated customers.
--
-- The cart_items table already has RLS policies that restrict access to
-- auth.uid() = user_id (see 20261005000000_initial_schema.sql). This
-- migration adds the denormalized columns needed to store the storefront
-- CartItem shape without requiring expensive joins on every render.
--
-- This migration is idempotent — re-running it is safe.
-- Apply with the Supabase SQL Editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- 1. Denormalized columns
--
-- The `data` JSONB column stores the full CartItem snapshot (slug, name,
-- price, image, size_name, color_name, etc.) so the UI can render without
-- additional product lookups. The `line_key` column carries the storefront's
-- composite identity (productId::size::color) used for upsert deduplication.
-- `product_id` stays as a UUID foreign key for relational integrity.
-- ---------------------------------------------------------------------------
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS line_key TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB;

-- ---------------------------------------------------------------------------
-- 2. Unique constraint on (user_id, line_key)
--
-- `cart_items_line_unique` may already exist (created by a prior partial run).
-- We use CREATE UNIQUE INDEX IF NOT EXISTS so the statement is a no-op when
-- the index already exists and a safe first-time creation on fresh databases.
--
-- The old constraint based on (user_id, product_id, size_id, color_id) is
-- dropped if it still exists — PostgreSQL treats NULLs as distinct in unique
-- constraints, so it could allow duplicate lines when size_id/color_id are
-- NULL. Dropping it is safe: it only removes the old rule, never the new one.
-- ---------------------------------------------------------------------------
DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_size_id_color_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_line_unique
  ON cart_items (user_id, line_key);

-- ---------------------------------------------------------------------------
-- 3. Grants
--
-- UPDATE is required here (unlike wishlist) because adding an existing line
-- increments the quantity rather than creating a duplicate row.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
