import type { Metadata } from 'next';
import AdminPlaceholder from '@/components/admin/AdminPlaceholder';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'House of Avenya admin — settings.',
};

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      name="Settings"
      icon="settings"
      description="House of Avenya panel configuration — store details, shipping rules and administrator access."
      planned={[
        'Store profile and branding',
        'Shipping and return rules',
        'Administrator access control',
      ]}
    />
  );
}
