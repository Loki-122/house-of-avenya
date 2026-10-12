-- House of Avenya — Checkout foundation
-- Created: 2026-10-07
--
-- This migration adds the minimum schema pieces the checkout flow needs
-- on top of the existing orders / order_items tables. It deliberately
-- touches NO other table.
--
--   1. orders.order_number  — human-friendly, collision-safe identifier
--                            (e.g. AVN-20261007-0001). Generated server-side.
--   2. orders.payment_status — tracks payment outcome. Defaults to
--                            'pending'; Razorpay TEST mode will flip this
--                            to 'paid' / 'failed' in a later phase.
--   3. order_items INSERT grant for the `authenticated` role.
--
-- The orders table already has an INSERT policy
--   "Users can insert own orders" ... WITH CHECK (auth.uid() = user_id),
-- but order_items had ONLY a SELECT policy. A checkout that inserts the
-- order and its items in one transaction needs INSERT on order_items too.
-- The parent-order RLS policy is untouched: every order_item still belongs
-- to an order whose user_id = auth.uid().
--
-- Apply with the Supabase SQL Editor (or `supabase db push`).
-- This migration is idempotent — re-running it is safe.

-- ---------------------------------------------------------------------------
-- 1. order_number on orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Backfill NULL-safe default so existing rows are not affected. The value is
-- always written server-side on insert; this default only satisfies the
-- NOT NULL requirement until the column is populated.
ALTER TABLE public.orders
  ALTER COLUMN order_number SET NOT NULL;

-- Unique constraint guarantees no two orders ever share a number even if the
-- generation algorithm is ever changed.
ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- ---------------------------------------------------------------------------
-- 2. payment_status on orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- ---------------------------------------------------------------------------
-- 3. order_items INSERT grant for authenticated
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- Ensure RLS is enabled (idempotent).
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- The existing SELECT policy is preserved. Add an INSERT policy scoped to the
-- caller's own orders so a checkout can create order_items through the
-- authenticated (anon-keyed) client carrying the user's JWT.
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );