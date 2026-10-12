import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin-auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — House of Avenya',
  description: 'Sign in to your House of Avenya account.',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const customerSession = await getCustomerSession();
  const adminSession = await getAdminSession();
  const isAdmin = adminSession?.profile.role === 'admin';

  if (customerSession) {
    redirect('/account');
  }

  return <LoginForm isAdmin={isAdmin} adminEmail={adminSession?.user.email ?? null} />;
}
