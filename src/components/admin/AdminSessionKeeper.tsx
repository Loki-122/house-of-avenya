'use client';

/**
 * Keeps the server-side admin session cookie in sync with
 * the Supabase Auth session held by the browser client.
 *
 * The browser client keeps the session in its standard
 * Supabase storage and auto-refreshes the access token.
 * This component mirrors the current token into the
 * `avenya_admin_session` cookie (and re-mirrors it on
 * every refresh) so the server's verification in
 * `requireAdmin()` always sees a live token. Renders
 * nothing.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  clearAdminSessionCookie,
  writeAdminSessionCookie,
} from '@/lib/admin-cookie';

export default function AdminSessionKeeper() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const syncCookie = (
      session: {
        access_token: string;
        expires_at?: number | null;
      } | null,
    ) => {
      if (!active) return;
      if (session) {
        writeAdminSessionCookie(session.access_token, session.expires_at);
      } else {
        clearAdminSessionCookie();
      }
    };

    // Mirror whatever session the SDK already holds (for
    // example, a sign-in completed in another tab).
    void supabase.auth.getSession().then(({ data: { session } }) => {
      syncCookie(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          syncCookie(session);
          // Let the server re-verify with the fresh token.
          void router.refresh();
        } else if (event === 'SIGNED_IN') {
          syncCookie(session);
        } else if (event === 'SIGNED_OUT') {
          syncCookie(null);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
