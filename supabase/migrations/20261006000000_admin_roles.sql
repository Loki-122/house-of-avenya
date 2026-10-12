-- House of Avenya — Admin roles & profile authorization
-- Created: 2026-10-06
--
-- Phase 1 of the admin system. Adds the authorization layer on top
-- of the existing schema without touching the original migrations:
--
--   1. profiles.role ('customer' | 'admin'), defaulting to 'customer'
--   2. A trigger that auto-creates a 'customer' profile for every
--      new Supabase auth user (new users are never admins)
--   3. Hardened own-profile policies so no signed-in user can
--      grant themselves the admin role through the public API
--   4. is_admin() helper + an admin-only read-all policy on profiles
--
-- Apply with the Supabase SQL Editor (or `supabase db push`) BEFORE
-- creating the first admin account with scripts/create-admin.mjs.

-- ---------------------------------------------------------------------------
-- 1. Role column on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'));

-- ---------------------------------------------------------------------------
-- 2. Privileges
--
-- The admin session check reads the signed-in user's own profile with
-- the anon key while carrying the user's JWT, which PostgREST
-- evaluates as the `authenticated` role. Both roles therefore need
-- SELECT on profiles; the RLS policies below still limit each user
-- to their own row (admins additionally pass the admin policy).
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Hardened own-profile policies
--
-- The original policies allowed any signed-in user to insert or
-- update their own profile with no restriction on `role`, which
-- would let a customer write role = 'admin' for themselves. The
-- policies below keep self-service profile management but make the
-- role column immutable through the public API: it can only ever be
-- set by server-side code (the trigger below, migrations, or the
-- service role key used by scripts/create-admin.mjs).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'customer');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Auto-create a profile for every new auth user
--
-- SECURITY DEFINER runs the insert as the function owner, bypassing
-- RLS, so a profile row exists even for users who sign up through
-- flows that never touch the public API. The default role is always
-- 'customer' — nobody becomes an admin automatically.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Admin identification
--
-- SECURITY DEFINER bypasses RLS inside the function, so this can
-- safely read the caller's own profile row without recursive
-- policy evaluation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admins can read every profile (used by the Customers section once
-- it is built; harmless now because nothing in the storefront calls it).
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT
  USING (public.is_admin());
