import type { Metadata } from 'next';
import AdminPlaceholder from '@/components/admin/AdminPlaceholder';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'House of Avenya admin — customers.',
};

export default function AdminCustomersPage() {
  return (
    <AdminPlaceholder
      name="Customers"
      icon="customers"
      description="Registered House of Avenya customers and their profile details."
      planned={[
        'Customer directory',
        'Profile and order history',
        'Customer search',
      ]}
    />
  );
}
