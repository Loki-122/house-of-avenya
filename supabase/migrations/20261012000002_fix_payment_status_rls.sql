-- House of Avenya — Fix payment-status authorization vulnerability
-- Created: 2026-10-12
--
-- This migration fixes the vulnerability where authenticated customers could
-- UPDATE any column on their own orders, including payment_status, totals,
-- and Razorpay fields.
--
-- The vulnerability: migration 20261008000001_razorpay_columns.sql granted
-- UPDATE on orders to authenticated and created a policy allowing users to
-- update their own orders with no column restrictions.
--
-- This migration:
--   1. Drops the vulnerable "Users can update own orders" policy
--   2. Keeps GRANT UPDATE ON public.orders TO authenticated (admins need it)
--   3. Creates a BEFORE UPDATE trigger that blocks changes to payment-sensitive
--      fields for non-admin, non-service-role users
--   4. Preserves admin UPDATE policy and all other grants/policies
--
-- After this migration:
--   - Customers: Cannot modify payment_status, totals, Razorpay fields.
--     RLS has no customer UPDATE policy, so direct UPDATEs are blocked.
--   - Admins: Can update orders via "Admins can update orders" RLS policy.
--     Trigger allows them via public.is_admin() check.
--   - Service-role (Razorpay verification): Bypasses RLS entirely.
--     Trigger allows via session_user = 'service_role' check.
--
-- Safe to re-run. Does not drop or modify existing order data.

-- ===========================================================================
-- 1. Drop the vulnerable customer UPDATE policy
-- ===========================================================================
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- ===========================================================================
-- 2. Keep GRANT UPDATE ON public.orders TO authenticated
--    (Required for admin updates via authenticated role with admin JWT)
--    The grant was added in 20261008000001 and 20261008000002.
--    We do NOT revoke it.
-- ===========================================================================
-- GRANT UPDATE ON public.orders TO authenticated;  -- already exists, preserved

-- ===========================================================================
-- 3. Create trigger to protect payment-sensitive fields
-- ===========================================================================
-- This trigger runs for every UPDATE on orders and enforces field-level
-- protection at the database level, which cannot be bypassed by RLS policy
-- gaps or client-side manipulation.
--
-- Protected fields (customers cannot modify):
--   - payment_status
--   - total, subtotal, shipping_cost, discount_amount
--   - razorpay_order_id, razorpay_payment_id, razorpay_signature
--
-- Allowed updaters:
--   - service_role (server-side Razorpay verification)
--   - Admins (via public.is_admin() SECURITY DEFINER check)
--   - Customers: can only modify non-protected fields (currently none,
--     but trigger allows future safe extensions)

CREATE OR REPLACE FUNCTION public.protect_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allow service_role (used by server-side payment verification routes)
  -- service_role bypasses RLS but triggers still fire
  IF session_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow admins (authenticated users with admin role)
  -- public.is_admin() is SECURITY DEFINER and reads profiles.role
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- For regular customers, reject changes to payment-sensitive fields
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
     OR (OLD.total IS DISTINCT FROM NEW.total)
     OR (OLD.subtotal IS DISTINCT FROM NEW.subtotal)
     OR (OLD.shipping_cost IS DISTINCT FROM NEW.shipping_cost)
     OR (OLD.discount_amount IS DISTINCT FROM NEW.discount_amount)
     OR (OLD.razorpay_order_id IS DISTINCT FROM NEW.razorpay_order_id)
     OR (OLD.razorpay_payment_id IS DISTINCT FROM NEW.razorpay_payment_id)
     OR (OLD.razorpay_signature IS DISTINCT FROM NEW.razorpay_signature)
  THEN
    RAISE EXCEPTION 'Cannot modify payment-sensitive fields: payment_status, totals, or Razorpay fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_payment_fields_trigger ON public.orders;
CREATE TRIGGER protect_payment_fields_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_payment_fields();

-- ===========================================================================
-- 4. Verify remaining policies on orders
-- ===========================================================================
-- After this migration, the orders table should have:
--   - "Users can read own orders" (SELECT)
--   - "Users can insert own orders" (INSERT)
--   - "Admins can read all orders" (SELECT)
--   - "Admins can update orders" (UPDATE)
--   - NO customer UPDATE policy (RLS blocks direct customer UPDATEs)
--   - BEFORE UPDATE trigger protects payment-sensitive fields for all roles