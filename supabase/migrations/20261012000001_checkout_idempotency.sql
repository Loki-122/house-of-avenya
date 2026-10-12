-- House of Avenya — Checkout idempotency, concurrency safety, and server-side validation
-- Created: 2026-10-12
--
-- This migration adds:
--   1. idempotency_key column on orders with unique partial index per user
--   2. Replaces create_order_from_cart RPC with concurrency-safe idempotency,
--      robust cart data parsing, and authoritative server-side quantity validation
--   3. SECURITY DEFINER hardening: fixed search_path (pg_catalog, public), fully qualified table references
--   4. Proper 64-bit advisory locking for idempotency keys
--   5. Explicitly revokes PUBLIC execute on the new function, grants only to authenticated
--   6. Removes redundant grants (preserves existing RLS and permissions)
--
-- Safe to re-run. Does not drop or modify existing order data.

-- ===========================================================================
-- 1. orders.idempotency_key
-- ===========================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique index to prevent duplicate orders per user per idempotency key
-- Partial index: only enforces uniqueness when key is provided
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_key_unique
  ON public.orders (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ===========================================================================
-- 2. Replace RPC: create_order_from_cart (drop old 2-param overload first)
-- ===========================================================================
-- The existing function has signature (UUID, UUID). CREATE OR REPLACE with
-- a different parameter count would create an overload, not replace it.
-- Explicitly drop the old signature to avoid ambiguity.
DROP FUNCTION IF EXISTS public.create_order_from_cart(UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_address_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result JSONB;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal INTEGER := 0;
  v_shipping INTEGER := 0;
  v_total INTEGER := 0;
  v_cart_item RECORD;
  v_profile RECORD;
  v_address RECORD;
  v_seq INTEGER;
  v_today TEXT;
  v_item_stock INTEGER;
  v_variant_id UUID;
  v_variant_ids UUID[];
  v_variant_qtys INTEGER[];
  v_product_ids UUID[];
  v_product_names TEXT[];
  v_product_slugs TEXT[];
  v_category_names TEXT[];
  v_prices INTEGER[];
  v_size_names TEXT[];
  v_color_names TEXT[];
  v_quantities INTEGER[];
  v_idx INTEGER;
  v_item_data JSONB;
  v_size_name TEXT;
  v_color_name TEXT;
  v_size_id UUID;
  v_color_id UUID;
  v_existing_order_id UUID;
  -- Aggregation arrays (declared in outer scope for use after loop)
  v_agg_variant_ids UUID[];
  v_agg_qtys INTEGER[];
  v_agg_product_ids UUID[];
  v_agg_product_names TEXT[];
  v_agg_product_slugs TEXT[];
  v_agg_category_names TEXT[];
  v_agg_prices INTEGER[];
  v_agg_size_names TEXT[];
  v_agg_color_names TEXT[];
  v_found BOOLEAN;
  v_agg_idx INTEGER;
BEGIN
  -- Security: caller must match authenticated user
  -- Reject NULL auth.uid() (unauthenticated callers) and mismatched p_user_id
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user ID mismatch';
  END IF;

  -- Idempotency: reject missing or empty key for this checkout flow
  IF p_idempotency_key IS NULL OR trim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'Idempotency key is required';
  END IF;

  -- Concurrency control: serialize all requests for this (user, idempotency_key)
  -- Use two-argument pg_advisory_xact_lock with two salted hashtext calls.
  -- This provides a deterministic 64-bit lock space without relying on md5 casting.
  -- The lock is held until transaction end, blocking concurrent callers with the same key.
  -- Different keys/users proceed in parallel.
  PERFORM pg_advisory_xact_lock(
    hashtext('idempotency:v1:' || p_user_id::text || ':' || p_idempotency_key),
    hashtext('idempotency:v2:' || p_user_id::text || ':' || p_idempotency_key)
  );

  -- Idempotency check: look for existing order with same key for this user
  -- Done INSIDE the advisory lock so concurrent requests see the same state.
  SELECT id INTO v_existing_order_id
  FROM public.orders
  WHERE user_id = p_user_id
    AND idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_order_id IS NOT NULL THEN
    -- Return existing order without creating a duplicate, without deducting stock,
    -- and without clearing the cart again.
    SELECT id, order_number INTO v_order_id, v_order_number
    FROM public.orders
    WHERE id = v_existing_order_id;

    v_result := jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'already_exists', true
    );
    RETURN v_result;
  END IF;

  -- Fetch user profile
  SELECT id, email, phone INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Fetch and verify address ownership
  SELECT id, name, line1, line2, city, state, postal_code, country, phone
  INTO v_address
  FROM public.addresses
  WHERE id = p_address_id AND user_id = p_user_id;

  IF v_address.id IS NULL THEN
    RAISE EXCEPTION 'Invalid address';
  END IF;

  -- Initialize aggregation arrays
  v_agg_variant_ids := ARRAY[]::UUID[];
  v_agg_qtys := ARRAY[]::INTEGER[];
  v_agg_product_ids := ARRAY[]::UUID[];
  v_agg_product_names := ARRAY[]::TEXT[];
  v_agg_product_slugs := ARRAY[]::TEXT[];
  v_agg_category_names := ARRAY[]::TEXT[];
  v_agg_prices := ARRAY[]::INTEGER[];
  v_agg_size_names := ARRAY[]::TEXT[];
  v_agg_color_names := ARRAY[]::TEXT[];

  -- Aggregate cart items by resolved variant to handle any duplicate lines
  -- (should not happen due to unique constraint on cart_items, but defensive).
  FOR v_cart_item IN
    SELECT
      ci.quantity,
      ci.data,
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.price AS product_price,
      c.name AS category_name
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    JOIN public.categories c ON c.id = p.category_id
    WHERE ci.user_id = p_user_id
  LOOP
    -- Robust parsing of cart_items.data:
    -- The column is JSONB. It may contain:
    --   (a) a JSONB object (normal case from upsertCartItem)
    --   (b) a JSON string (legacy or edge case from client localStorage sync)
    -- Normalize both to a JSONB object.
    IF jsonb_typeof(v_cart_item.data) = 'string' THEN
      -- Extract the inner text from the JSONB string, then parse as JSONB
      v_item_data := (v_cart_item.data #>> '{}')::jsonb;
    ELSE
      v_item_data := v_cart_item.data::jsonb;
    END IF;

    -- Extract size and color names, normalize empty strings to NULL
    v_size_name := NULLIF(trim(v_item_data->>'size'), '');
    v_color_name := NULLIF(trim(v_item_data->>'color'), '');

    -- Resolve size_id: exact name match only (no fallback)
    SELECT id INTO v_size_id
    FROM public.product_sizes
    WHERE product_id = v_cart_item.product_id
      AND v_size_name IS NOT NULL
      AND name = v_size_name
    LIMIT 1;

    -- Resolve color_id: exact name match only (no fallback)
    SELECT id INTO v_color_id
    FROM public.product_colors
    WHERE product_id = v_cart_item.product_id
      AND v_color_name IS NOT NULL
      AND name = v_color_name
    LIMIT 1;

    -- Find matching variant with row lock (FOR UPDATE)
    -- This locks the variant row for the transaction, preventing
    -- concurrent checkouts from overselling the same stock.
    SELECT pv.id, pv.stock INTO v_variant_id, v_item_stock
    FROM public.product_variants pv
    WHERE pv.product_id = v_cart_item.product_id
      AND pv.size_id = v_size_id
      AND pv.color_id = v_color_id
    LIMIT 1
    FOR UPDATE;

    IF v_variant_id IS NULL THEN
      RAISE EXCEPTION 'Variant not found for %', v_cart_item.product_name;
    END IF;

    -- Server-side quantity validation:
    -- 1. Quantity must be a positive integer (enforced by cart_items CHECK quantity > 0)
    -- 2. Quantity must not exceed available variant stock (authoritative)
    IF v_item_stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_cart_item.product_name;
    END IF;

    -- Aggregate by variant_id to handle potential duplicate cart lines
    v_found := FALSE;
    IF array_length(v_agg_variant_ids, 1) IS NOT NULL THEN
      FOR v_agg_idx IN 1..array_length(v_agg_variant_ids, 1) LOOP
        IF v_agg_variant_ids[v_agg_idx] = v_variant_id THEN
          v_agg_qtys[v_agg_idx] := v_agg_qtys[v_agg_idx] + v_cart_item.quantity;
          -- Re-validate aggregate quantity against stock
          IF v_item_stock < v_agg_qtys[v_agg_idx] THEN
            RAISE EXCEPTION 'Insufficient stock for % (aggregate)', v_cart_item.product_name;
          END IF;
          v_found := TRUE;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT v_found THEN
      v_agg_variant_ids := array_append(v_agg_variant_ids, v_variant_id);
      v_agg_qtys := array_append(v_agg_qtys, v_cart_item.quantity);
      v_agg_product_ids := array_append(v_agg_product_ids, v_cart_item.product_id);
      v_agg_product_names := array_append(v_agg_product_names, v_cart_item.product_name);
      v_agg_product_slugs := array_append(v_agg_product_slugs, v_cart_item.product_slug);
      v_agg_category_names := array_append(v_agg_category_names, v_cart_item.category_name);
      v_agg_prices := array_append(v_agg_prices, v_cart_item.product_price);
      v_agg_size_names := array_append(v_agg_size_names, v_size_name);
      v_agg_color_names := array_append(v_agg_color_names, v_color_name);
    END IF;

    v_subtotal := v_subtotal + v_cart_item.product_price * v_cart_item.quantity;
  END LOOP;

  -- Transfer aggregated arrays to outer scope variables for later use
  v_variant_ids := v_agg_variant_ids;
  v_variant_qtys := v_agg_qtys;
  v_product_ids := v_agg_product_ids;
  v_product_names := v_agg_product_names;
  v_product_slugs := v_agg_product_slugs;
  v_category_names := v_agg_category_names;
  v_prices := v_agg_prices;
  v_size_names := v_agg_size_names;
  v_color_names := v_agg_color_names;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Your cart is empty or contains unavailable items';
  END IF;

  -- Shipping calculation: aligned with checkout-shipping.ts and format.ts
  -- Free shipping on orders >= ₹2,000; otherwise flat ₹99
  v_shipping := CASE WHEN v_subtotal >= 2000 THEN 0 ELSE 99 END;
  v_total := v_subtotal + v_shipping;

  -- Generate unique order number (serialized per day via advisory lock)
  -- Uses two-argument pg_advisory_xact_lock with salted hashtext calls.
  PERFORM pg_advisory_xact_lock(
    hashtext('avenya_order_number:v1'),
    hashtext('avenya_order_number:v2')
  );

  v_today := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(RIGHT(order_number, 4) AS INTEGER)
  ), 0) + 1 INTO v_seq
  FROM public.orders
  WHERE order_number LIKE 'AVN-' || v_today || '-%';

  v_order_number := 'AVN-' || v_today || '-' || LPAD(v_seq::TEXT, 4, '0');

  -- Insert order with idempotency_key
  INSERT INTO public.orders (
    user_id, order_number, email, phone, status, payment_status,
    subtotal, shipping_cost, discount_amount, total,
    shipping_address, idempotency_key
  ) VALUES (
    p_user_id, v_order_number, v_profile.email, v_profile.phone,
    'pending', 'pending',
    v_subtotal, v_shipping, 0, v_total,
    jsonb_build_object(
      'name', v_address.name,
      'line1', v_address.line1,
      'line2', v_address.line2,
      'city', v_address.city,
      'state', v_address.state,
      'postal_code', v_address.postal_code,
      'country', v_address.country,
      'phone', v_address.phone
    ),
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Insert order_items using aggregated arrays (one per unique variant)
  IF array_length(v_variant_ids, 1) IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_variant_ids, 1) LOOP
      INSERT INTO public.order_items (
        order_id, product_id, product_name, product_slug, category,
        size, color, price, quantity, total
      ) VALUES (
        v_order_id,
        v_product_ids[v_idx],
        v_product_names[v_idx],
        v_product_slugs[v_idx],
        v_category_names[v_idx],
        v_size_names[v_idx],
        v_color_names[v_idx],
        v_prices[v_idx],
        v_variant_qtys[v_idx],
        v_prices[v_idx] * v_variant_qtys[v_idx]
      );
    END LOOP;
  END IF;

  -- Deduct stock atomically. Variant rows are locked by the earlier
  -- FOR UPDATE, so concurrent checkouts cannot cause negative stock.
  -- Uses aggregated quantities so each variant is deducted exactly once.
  IF array_length(v_variant_ids, 1) IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_variant_ids, 1) LOOP
      UPDATE public.product_variants
      SET stock = stock - v_variant_qtys[v_idx]
      WHERE id = v_variant_ids[v_idx];
    END LOOP;
  END IF;

  -- Clear the user's cart (only on successful order creation)
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'already_exists', false
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 3. Security: revoke PUBLIC and anon execute, grant only to authenticated
-- ===========================================================================
-- SECURITY DEFINER functions default to EXECUTE for PUBLIC.
-- Explicitly revoke from PUBLIC and anon, grant only to the intended role.
REVOKE EXECUTE ON FUNCTION public.create_order_from_cart(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order_from_cart(UUID, UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(UUID, UUID, TEXT) TO authenticated;

-- ===========================================================================
-- 4. Grants (existing table grants preserved)
-- ===========================================================================
-- Existing grants from prior migrations (preserved, not re-granted here):
--   GRANT SELECT, INSERT ON public.orders TO authenticated;        -- 20261007000003
--   GRANT UPDATE ON public.orders TO authenticated;                -- 20261008000001, 20261008000002
--   GRANT SELECT, INSERT ON public.order_items TO authenticated;   -- 20261007000003
--   RLS policies on orders, order_items, cart_items, addresses unchanged.