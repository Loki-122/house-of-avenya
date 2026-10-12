import type { Metadata } from 'next';
import { requireCustomer } from '@/lib/auth';
import ProfileForm from './ProfileForm';

export const metadata: Metadata = {
  title: 'Profile — House of Avenya',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requireCustomer();

  return (
    <ProfileForm
      initialProfile={{
        full_name: session.profile.full_name,
        phone: session.profile.phone,
      }}
    />
  );
}
