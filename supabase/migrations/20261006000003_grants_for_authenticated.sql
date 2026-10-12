-- House of Avenya — Grant authenticated role access to customer tables
-- Created: 2026-10-06
-- Updated: 2026-10-06 (fixed: wishlist table uses uuid_generate_v4, not a sequence)
--
-- RLS policies exist on customer tables (wishlist, addresses, cart_items, reviews)
-- to restrict access to each user's own data, but the `authenticated` role has no
-- base table privileges. In PostgreSQL, RLS is not evaluated unless the role has the
-- underlying table privilege — the INSERT/UPDATE/DELETE is rejected before the policy
-- is even checked.
--
-- The `authenticated` role inherits from `anon`, but `anon` only has SELECT on
-- public-facing tables (products, categories, etc.). Tables that store per-user data
-- need explicit grants for `authenticated`.

-- Schema usage must be granted separately (not inherited via RLS).
GRANT USAGE ON SCHEMA public TO authenticated;

-- Wishlist: customers can read, insert, and delete their own rows.
-- The table uses a UUID primary key (uuid_generate_v4), NOT a sequence.
-- The application toggles items with INSERT/DELETE only (toggle, remove, clear),
-- so UPDATE is deliberately NOT granted.
GRANT SELECT, INSERT, DELETE ON TABLE public.wishlist TO authenticated;
REVOKE UPDATE ON TABLE public.wishlist FROM authenticated;

-- Ensure RLS is enabled (idempotent).
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Addresses: same pattern — each user manages their own addresses
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;

-- Cart items: UPDATE is required because adding an existing line increments
-- the quantity rather than creating a duplicate row.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cart_items TO authenticated;

-- Reviews: users can read approved reviews + their own; insert/update their own
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;