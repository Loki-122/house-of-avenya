/**
 * Middleware for the admin panel.
 *
 * A fast, unauthenticated gate for /admin/*: when there is
 * no admin session cookie at all, redirect to the login
 * page before any admin code renders.
 *
 * This is intentionally a presence check only — a cookie
 * proves nothing by itself. The authoritative check (token
 * verification against Supabase Auth + profiles.role under
 * Row Level Security) runs server-side in the
 * (dashboard) layout via requireAdmin(), so a forged or
 * stale cookie can never reach admin content.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-cookie';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page is always reachable. Whether a signed-in
  // visitor may use it (admins get sent to the dashboard,
  // customers see an access-denied notice) is decided by
  // the login page itself, server-side.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
