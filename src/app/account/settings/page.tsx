import type { Metadata } from 'next';
import { requireCustomer } from '@/lib/auth';
import SettingsForm from './SettingsForm';

export const metadata: Metadata = {
  title: 'Settings — House of Avenya',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireCustomer();

  return <SettingsForm />;
}
