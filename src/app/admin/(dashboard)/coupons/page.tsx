import type { Metadata } from 'next';
import AdminPlaceholder from '@/components/admin/AdminPlaceholder';

export const metadata: Metadata = {
  title: 'Coupons',
  description: 'House of Avenya admin — coupons.',
};

export default function AdminCouponsPage() {
  return (
    <AdminPlaceholder
      name="Coupons"
      icon="coupons"
      description="Discount codes for the House of Avenya — percentage and fixed-value offers with usage limits."
      planned={[
        'Create and retire discount codes',
        'Percentage and fixed-value discounts',
        'Usage limits and expiry dates',
      ]}
    />
  );
}
