/**
 * Admin authentication and authorization.
 *
 * Model:
 *   1. Supabase Auth (auth.users) is the identity — email/password
 *      sign-in happens in the browser with the publishable anon key.
 *   2. After sign-in, the access token is mirrored into a cookie so
 *      the server can see the session on every admin request.
 *   3. On the server, the token is verified directly against
 *      Supabase Auth, and the caller's `profiles.role` is read under
 *      that user's Row Level Security context.
 *
 * The server-side check is the authority. A browser can never grant
 * itself admin access: the role is read through RLS as the signed-in
 * user, and the migration makes the role column immutable through
 * the public API. The service role key is never used in the app.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './admin-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type AdminSession = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
};

/* ------------------------------------------------------------------ */
/* Cookie helper — server side (next/headers)                          */
/* ------------------------------------------------------------------ */

async function readAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

/* ------------------------------------------------------------------ */
/* Server-side session verification                                    */
/* ------------------------------------------------------------------ */

type SupabaseUser = {
  id: string;
  email: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

function authHeaders(accessToken: string): HeadersInit {
  return {
    apikey: supabaseAnonKey!,
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Verify the access token with Supabase Auth. Returns null for any
 * invalid, expired or missing token — the check fails closed.
 */
async function fetchSupabaseUser(accessToken: string): Promise<SupabaseUser | null> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as SupabaseUser;
  } catch {
    return null;
  }
}

/**
 * Read the caller's own profile under Row Level Security. The
 * request carries the user's own token, so a customer can only
 * ever see their own row — and the role on that row is what
 * decides admin access.
 */
async function fetchSessionProfile(
  accessToken: string,
  userId: string,
): Promise<ProfileRow | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role&id=eq.${encodeURIComponent(userId)}`,
      { headers: authHeaders(accessToken), cache: 'no-store' },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as ProfileRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * The current request's admin session, or null when the visitor is
 * signed out, holds an invalid token, or has no profile row
 * (fail closed). The role is included so callers can distinguish
 * "signed out" from "signed in as a customer".
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const accessToken = await readAdminSessionToken();
  if (!accessToken) return null;

  const user = await fetchSupabaseUser(accessToken);
  if (!user) return null;

  const profile = await fetchSessionProfile(accessToken, user.id);
  if (!profile) return null;

  return {
    user: { id: user.id, email: user.email ?? null },
    profile,
  };
}

/**
 * Gate for every /admin page. Redirects to the login page when the
 * visitor is signed out, and to the login page with an
 * access-denied notice when a signed-in customer (non-admin) tries
 * to enter. Returns the verified admin session for rendering.
 *
 * This runs in a Server Component before any admin content is
 * rendered — it is the authoritative protection, not a
 * client-side redirect.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (session.profile.role !== 'admin') {
    redirect('/admin/login?error=access_denied');
  }

  return session;
}
