import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — House of Avenya Admin',
  description:
    'Sign in to the House of Avenya admin panel to manage the catalogue.',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminSession();

  // Already an admin? Straight to the dashboard.
  if (session?.profile.role === 'admin') {
    redirect('/admin');
  }

  const params = await searchParams;
  const accessDenied = params.error === 'access_denied';
  const isCustomer = session !== null && session.profile.role !== 'admin';

  return (
    <LoginForm
      accessDenied={accessDenied || Boolean(session)}
      signedInEmail={session?.user.email ?? null}
      isCustomer={isCustomer}
    />
  );
}
