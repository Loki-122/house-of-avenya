'use client';

/**
 * Admin sign-out.
 *
 * Ends the Supabase Auth session, removes the mirrored
 * admin session cookie, and returns to the admin login
 * page. The server-side checks in `requireAdmin()` then
 * fail closed on the next request.
 */
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clearAdminSessionCookie } from '@/lib/admin-cookie';
import { AdminIcon } from './AdminIcon';

export default function AdminLogoutButton({
  disabled = false,
  onSigningOutChange,
}: {
  disabled?: boolean;
  onSigningOutChange?: (signingOut: boolean) => void;
}) {
  const router = useRouter();

  async function handleSignOut() {
    onSigningOutChange?.(true);
    try {
      await supabase.auth.signOut();
    } finally {
      clearAdminSessionCookie();
      onSigningOutChange?.(false);
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-md border border-white/10 px-3 py-2.5 text-sm text-brand-ivory/60 transition-colors hover:border-brand-antiqueGold/40 hover:text-brand-ivory disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AdminIcon name="logout" size={16} className="text-brand-ivory/40" />
      <span>Sign out</span>
    </button>
  );
}
