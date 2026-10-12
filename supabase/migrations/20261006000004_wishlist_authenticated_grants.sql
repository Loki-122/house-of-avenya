-- House of Avenya — Grant authenticated role access to the wishlist table
-- Created: 2026-10-06
--
-- Root cause:
--   The `authenticated` role had NO table-level privileges on
--   `public.wishlist`. PostgreSQL checks table privileges BEFORE
--   evaluating Row Level Security policies, so every authenticated
--   customer received:
--
--     permission denied for table wishlist  (SQLSTATE 42501)
--
--   even though the RLS policies were already correct:
--
--     SELECT … auth.uid() = user_id
--     INSERT … auth.uid() = user_id
--     DELETE … auth.uid() = user_id
--
-- Fix:
--   Grant only the privileges the application actually uses.
--   The wishlist provider only INSERTs and DELETEs rows (toggle/remove/clear);
--   it never UPDATEs them, so UPDATE is deliberately NOT granted.
--
-- Apply with the Supabase SQL Editor (or `supabase db push`).
-- This migration is idempotent — re-running it is safe.

-- Schema usage must be granted separately (not inherited via RLS).
GRANT USAGE ON SCHEMA public TO authenticated;

-- The authenticated role needs table-level privileges to reach the
-- RLS policy evaluator. RLS still restricts rows to auth.uid() = user_id,
-- so this grant does NOT bypass per-user isolation.
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;

-- UPDATE is deliberately NOT granted: the application toggles wishlist
-- items with INSERT/DELETE only (toggle, remove, clear). The guest-to-Supabase
-- merge on login uses INSERT with unique-violation handling, not UPSERT,
-- so UPDATE privilege is never required.
REVOKE UPDATE ON public.wishlist FROM authenticated;

-- Ensure RLS is enabled (it should already be, but this is idempotent).
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
