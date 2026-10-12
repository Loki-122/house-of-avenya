/**
 * Customer authentication and authorization.
 *
 * Model:
 *   1. Supabase Auth (auth.users) is the identity — email/password
 *      sign-in happens in the browser with the publishable anon key.
 *   2. After sign-in, the access token is mirrored into a cookie so
 *      the server can see the session on every customer request.
 *   3. On the server, the token is verified directly against
 *      Supabase Auth, and the caller's `profiles.role` is read under
 *      that user's Row Level Security context.
 *
 * The server-side check is the authority. Authorization is never
 * decided client-side.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CUSTOMER_SESSION_COOKIE } from './customer-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type CustomerSession = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
  };
};

type SupabaseUser = {
  id: string;
  email: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
};

function authHeaders(accessToken: string): HeadersInit {
  return {
    apikey: supabaseAnonKey!,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function readCustomerSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value ?? null;
}

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

async function fetchSessionProfile(
  accessToken: string,
  userId: string,
): Promise<ProfileRow | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,phone,role&id=eq.${encodeURIComponent(userId)}`,
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
 * Check if a profile has admin role.
 */
function isAdminProfile(profile: ProfileRow): boolean {
  return profile.role === 'admin';
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const session = await getCustomerSessionWithToken();
  return session ? { user: session.user, profile: session.profile } : null;
}

/**
 * Variant of getCustomerSession that also returns the raw access token.
 *
 * The token is needed by checkout route handlers and any other server-side
 * code that must query Supabase with the caller's own JWT so Row Level
 * Security resolves auth.uid() to the signed-in customer. Without it the
 * server client runs as `anon`, where auth.uid() is NULL and every
 * `auth.uid() = …` policy evaluates to false.
 *
 * The token is never written to the response body or logs.
 */
export async function getCustomerSessionWithToken(): Promise<
  (CustomerSession & { accessToken: string }) | null
> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const accessToken = await readCustomerSessionToken();
  if (!accessToken) return null;

  const user = await fetchSupabaseUser(accessToken);
  if (!user) return null;

  const profile = await fetchSessionProfile(accessToken, user.id);
  if (!profile) return null;

  // Admin users must never be treated as customer accounts.
  if (isAdminProfile(profile)) {
    return null;
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    profile,
    accessToken,
  };
}

/**
 * Gate for every customer account page. Redirects to the login
 * page when the visitor is signed out, holds an invalid token,
 * or is an admin (admins are never customer accounts).
 *
 * Returns the verified session including the raw access token,
 * so server-side data layers can query Supabase with the
 * caller's own JWT and have Row Level Security resolve
 * auth.uid() to the signed-in customer. The token is never
 * written to the response body or logs.
 */
export async function requireCustomer(): Promise<
  CustomerSession & { accessToken: string }
> {
  const session = await getCustomerSessionWithToken();
  if (!session) {
    redirect('/login');
  }
  return session;
}
