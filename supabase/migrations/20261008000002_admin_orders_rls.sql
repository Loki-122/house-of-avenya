-- House of Avenya — Admin RLS policies for orders
-- Created: 2026-10-08
--
-- Adds admin access to orders and order_items tables.
-- Admin users (profiles.role = 'admin') can:
--   - Read all orders
--   - Update order status, payment_status
--   - Read all order_items
--
-- Safe to re-run.

-- ===========================================================================
-- 1. orders: admin SELECT policy
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ===========================================================================
-- 2. orders: admin UPDATE policy (for status/payment_status changes)
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ===========================================================================
-- 3. order_items: admin SELECT policy
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ===========================================================================
-- 4. Grant UPDATE on orders to authenticated (needed for admin updates)
-- ===========================================================================
GRANT UPDATE ON public.orders TO authenticated;