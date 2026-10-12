-- House of Avenya — Fix Admin Orders RLS policies
-- Created: 2026-10-08
--
-- Replaces inline EXISTS subqueries with public.is_admin() SECURITY DEFINER
-- helper to match the working pattern used by admin product policies.
-- The inline subqueries were evaluated under profiles RLS and failed to
-- confirm admin status, returning zero rows for admin users.

-- ===========================================================================
-- 1. orders: admin SELECT policy
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders
  FOR SELECT
  USING (public.is_admin());

-- ===========================================================================
-- 2. orders: admin UPDATE policy (for status/payment_status changes)
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===========================================================================
-- 3. order_items: admin SELECT policy
-- ===========================================================================
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items" ON public.order_items
  FOR SELECT
  USING (public.is_admin());