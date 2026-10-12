/**
 * Customer session cookie — shared definition.
 *
 * Mirrors the Supabase access token for customer sessions so the
 * server can identify the signed-in customer on every request.
 * It is not itself an authentication mechanism — the token is
 * always verified server-side against Supabase Auth (see ./auth).
 *
 * Follows the exact same pattern as the admin session cookie
 * in ../admin-cookie but with a different name so the two
 * systems never clash: a customer who is also an admin needs
 * both cookies.
 */

export const CUSTOMER_SESSION_COOKIE = 'avenya_customer_session'

function cookieAttributes(maxAge: number): string {
  return ['Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax', 'Secure'].join('; ')
}

export function writeCustomerSessionCookie(
  accessToken: string,
  expiresAt?: number | null,
): void {
  if (typeof document === 'undefined') return
  const fallbackMaxAge = 30 * 24 * 60 * 60
  const maxAge = expiresAt
    ? Math.max(60, Math.floor(expiresAt - Date.now() / 1000))
    : fallbackMaxAge
  document.cookie = `${CUSTOMER_SESSION_COOKIE}=${accessToken}; ${cookieAttributes(maxAge)}`
}

export function clearCustomerSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${CUSTOMER_SESSION_COOKIE}=; ${cookieAttributes(0)}`
}
