import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account — House of Avenya',
  description: 'Create your House of Avenya account.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const session = await getCustomerSession();

  if (session) {
    redirect('/account');
  }

  return <RegisterForm />;
}
