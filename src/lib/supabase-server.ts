/**
 * Supabase server client.
 *
 * Used by Next.js server components and route handlers. It authenticates with
 * the anon key and carries the request's cookies so Row Level Security can
 * identify the signed-in user, if any. Never use the service role key here —
 * doing so would silently bypass every RLS policy.
 *
 * Pass the customer's access token (read from the session cookie) when you
 * need per-user RLS to work on the server side. Without it the client runs
 * as the `anon` role, where `auth.uid()` is NULL and all RLS policies
 * with `auth.uid() = …` evaluate to false.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
  );
}

export function createSupabaseServerClient(accessToken?: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  });
}