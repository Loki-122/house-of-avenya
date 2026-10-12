import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    default: 'Admin — House of Avenya',
    template: '%s — Admin — House of Avenya',
  },
  description: 'House of Avenya admin panel.',
  robots: { index: false, follow: false },
};

/**
 * Protected admin shell.
 *
 * `requireAdmin()` runs on the server before any admin
 * content renders: it verifies the session token with
 * Supabase Auth and checks `profiles.role` under Row
 * Level Security. Signed-out visitors and signed-in
 * customers are redirected to the login page — the
 * check is authoritative, not a client-side redirect.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return <AdminShell session={session}>{children}</AdminShell>;
}
