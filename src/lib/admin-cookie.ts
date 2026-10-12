/**
 * Admin session cookie — shared definition.
 *
 * Deliberately free of any Next.js imports so both the
 * middleware (Edge runtime) and client components can use
 * it without pulling in server-only modules.
 *
 * The cookie mirrors the Supabase access token issued at
 * sign-in. It lets the server see who is making an admin
 * request; it is not itself an authentication mechanism —
 * every admin request still verifies the token with
 * Supabase Auth and checks profiles.role under Row Level
 * Security (see ./admin-auth).
 */

/** Name of the cookie that mirrors the Supabase access token. */
export const ADMIN_SESSION_COOKIE = 'avenya_admin_session'

function cookieAttributes(maxAge: number): string {
  return ['Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax', 'Secure'].join('; ')
}

/**
 * Mirror a freshly issued access token into the admin session
 * cookie. Supabase access tokens contain only cookie-safe
 * characters (base64url plus dots), so no encoding is needed.
 * `expiresAt` is the JWT `exp` in seconds; the cookie never
 * outlives the token it mirrors.
 */
export function writeAdminSessionCookie(
  accessToken: string,
  expiresAt?: number | null,
): void {
  if (typeof document === 'undefined') return
  const fallbackMaxAge = 30 * 24 * 60 * 60
  const maxAge = expiresAt
    ? Math.max(60, Math.floor(expiresAt - Date.now() / 1000))
    : fallbackMaxAge
  document.cookie = `${ADMIN_SESSION_COOKIE}=${accessToken}; ${cookieAttributes(maxAge)}`
}

/** Remove the admin session cookie (logout). */
export function clearAdminSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${ADMIN_SESSION_COOKIE}=; ${cookieAttributes(0)}`
}
