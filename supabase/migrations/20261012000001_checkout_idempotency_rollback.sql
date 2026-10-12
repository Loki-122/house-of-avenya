-- ===========================================================================
-- ROLLBACK: Revert checkout idempotency migration
-- Source: supabase/migrations/20261007000003_create_order_rpc.sql (lines 88-305)
-- ===========================================================================

-- 1. Drop the new 3-argument function
DROP FUNCTION IF EXISTS public.create_order_from_cart(UUID, UUID, TEXT);

-- 2. Recreate the original two-argument function (exact copy from 20261007000003)
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
    v_item_data := (v_cart_item.data::jsonb #>> '{}')::jsonb;
    v_size_name := NULLIF(trim(v_item_data->>'size'), '');
    v_color_name := NULLIF(trim(v_item_data->>'color'), '');

    SELECT id INTO v_size_id
    FROM product_sizes
    WHERE product_id = v_cart_item.product_id
      AND v_size_name IS NOT NULL
      AND name = v_size_name
    LIMIT 1;

    SELECT id INTO v_color_id
    FROM product_colors
    WHERE product_id = v_cart_item.product_id
      AND v_color_name IS NOT NULL
      AND name = v_color_name
    LIMIT 1;

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

-- 3. Restore original grant
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(UUID, UUID) TO authenticated;

-- 4. Drop idempotency column and index
DROP INDEX IF EXISTS orders_user_idempotency_key_unique;
ALTER TABLE public.orders DROP COLUMN IF EXISTS idempotency_key;