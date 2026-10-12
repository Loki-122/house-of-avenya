-- House of Avenya — Razorpay columns on orders
-- Created: 2026-10-08
--
-- Adds columns to track Razorpay payment details for TEST mode integration.
-- These columns are nullable and only populated after payment verification.
-- Safe to re-run.

-- Razorpay order ID (created server-side before checkout)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Razorpay payment ID (returned after successful payment)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Razorpay signature (for verification)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Index for faster lookup by Razorpay order ID
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id);

-- Grant update on orders for authenticated users (needed for payment verification)
GRANT UPDATE ON public.orders TO authenticated;

-- RLS policy for users to update their own orders (e.g., after payment verification)
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);