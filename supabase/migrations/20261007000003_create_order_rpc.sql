-- House of Avenya — Order creation RPC + checkout schema completion
-- Created: 2026-10-07
--
-- This migration does three things:
--   1. Adds the missing columns on public.orders that the RPC requires:
--        - order_number  (TEXT, NOT NULL, UNIQUE)
--        - payment_status (TEXT, NOT NULL, DEFAULT 'pending')
--   2. Grants authenticated role INSERT on order_items and adds the
--      corresponding RLS INSERT policy.
--   3. Creates the atomic RPC function `create_order_from_cart` with:
--        - auth.uid() security check
--        - server-side pricing and stock validation
--        - row-level locking on variants to prevent negative stock
--        - atomic stock deduction within the same transaction
--
-- Safe to re-run on a database that already has these objects.
-- Does not drop or modify any existing order data.

-- ===========================================================================
-- 1. orders.order_number
-- ===========================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Backfill any existing rows with unique placeholders using a CTE
-- (ROW_NUMBER() cannot appear directly in an UPDATE SET expression).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number IS NULL) THEN
    WITH numbered AS (
      SELECT
        id,
        'AVN-19700101-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') AS new_number
      FROM public.orders
      WHERE order_number IS NULL
    )
    UPDATE public.orders o
    SET order_number = numbered.new_number
    FROM numbered
    WHERE o.id = numbered.id;
  END IF;
END $$;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_number_unique;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- ===========================================================================
-- 2. orders.payment_status
-- ===========================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- ===========================================================================
-- 3. order_items access for authenticated role
-- ===========================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

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

-- ===========================================================================
-- 4. RPC: create_order_from_cart
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_address_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
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
BEGIN
  -- Security: caller must match authenticated user
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, email, phone INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  SELECT id, name, line1, line2, city, state, postal_code, country, phone
  INTO v_address
  FROM addresses
  WHERE id = p_address_id AND user_id = p_user_id;

  IF v_address.id IS NULL THEN
    RAISE EXCEPTION 'Invalid address';
  END IF;

  FOR v_cart_item IN
    SELECT
      ci.quantity,
      ci.data,
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.price AS product_price,
      c.name AS category_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = p_user_id
  LOOP
    -- cart_items.data is JSONB containing a JSON-stringified object.
    -- Extract the inner string first, then parse as JSON.
    v_item_data := (v_cart_item.data::jsonb #>> '{}')::jsonb;

    -- Extract size and color names from JSON data, normalize empty strings to NULL
    v_size_name := NULLIF(trim(v_item_data->>'size'), '');
    v_color_name := NULLIF(trim(v_item_data->>'color'), '');

    -- Resolve size_id: exact name match only (no fallback)
    SELECT id INTO v_size_id
    FROM product_sizes
    WHERE product_id = v_cart_item.product_id
      AND v_size_name IS NOT NULL
      AND name = v_size_name
    LIMIT 1;

    -- Resolve color_id: exact name match only (no fallback)
    SELECT id INTO v_color_id
    FROM product_colors
    WHERE product_id = v_cart_item.product_id
      AND v_color_name IS NOT NULL
      AND name = v_color_name
    LIMIT 1;

    -- Find matching variant with row lock
    SELECT pv.id, pv.stock INTO v_variant_id, v_item_stock
    FROM product_variants pv
    WHERE pv.product_id = v_cart_item.product_id
      AND pv.size_id = v_size_id
      AND pv.color_id = v_color_id
    LIMIT 1
    FOR UPDATE;

    IF v_variant_id IS NULL THEN
      RAISE EXCEPTION 'Variant not found for %', v_cart_item.product_name;
    END IF;

    IF v_item_stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_cart_item.product_name;
    END IF;

    -- Store resolved data for later order_items insert
    v_variant_ids := array_append(v_variant_ids, v_variant_id);
    v_variant_qtys := array_append(v_variant_qtys, v_cart_item.quantity);
    v_product_ids := array_append(v_product_ids, v_cart_item.product_id);
    v_product_names := array_append(v_product_names, v_cart_item.product_name);
    v_product_slugs := array_append(v_product_slugs, v_cart_item.product_slug);
    v_category_names := array_append(v_category_names, v_cart_item.category_name);
    v_prices := array_append(v_prices, v_cart_item.product_price);
    v_size_names := array_append(v_size_names, v_size_name);
    v_color_names := array_append(v_color_names, v_color_name);
    v_quantities := array_append(v_quantities, v_cart_item.quantity);

    v_subtotal := v_subtotal + v_cart_item.product_price * v_cart_item.quantity;
  END LOOP;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Your cart is empty or contains unavailable items';
  END IF;

  v_shipping := CASE WHEN v_subtotal >= 2000 THEN 0 ELSE 99 END;
  v_total := v_subtotal + v_shipping;

  PERFORM pg_advisory_xact_lock(hashtext('avenya_order_number'));

  v_today := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(RIGHT(order_number, 4) AS INTEGER)
  ), 0) + 1 INTO v_seq
  FROM orders
  WHERE order_number LIKE 'AVN-' || v_today || '-%';

  v_order_number := 'AVN-' || v_today || '-' || LPAD(v_seq::TEXT, 4, '0');

  INSERT INTO orders (
    user_id, order_number, email, phone, status, payment_status,
    subtotal, shipping_cost, discount_amount, total,
    shipping_address
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
    )
  )
  RETURNING id INTO v_order_id;

  -- Insert order_items using the resolved arrays (one per cart item, matching variant resolution)
  IF array_length(v_variant_ids, 1) IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_variant_ids, 1) LOOP
      INSERT INTO order_items (
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
        v_quantities[v_idx],
        v_prices[v_idx] * v_quantities[v_idx]
      );
    END LOOP;
  END IF;

  -- Deduct stock atomically. Variant rows are locked by the earlier
  -- FOR UPDATE, so concurrent checkouts cannot cause negative stock.
  IF array_length(v_variant_ids, 1) IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_variant_ids, 1) LOOP
      UPDATE product_variants
      SET stock = stock - v_variant_qtys[v_idx]
      WHERE id = v_variant_ids[v_idx];
    END LOOP;
  END IF;

  DELETE FROM cart_items WHERE user_id = p_user_id;

  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 5. Grants
-- ===========================================================================
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(UUID, UUID) TO authenticated;