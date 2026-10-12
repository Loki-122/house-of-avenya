import type { Metadata } from 'next';
import AdminPlaceholder from '@/components/admin/AdminPlaceholder';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'House of Avenya admin — reviews.',
};

export default function AdminReviewsPage() {
  return (
    <AdminPlaceholder
      name="Reviews"
      icon="reviews"
      description="Customer reviews for House of Avenya pieces, with moderation before they appear on the storefront."
      planned={[
        'Review moderation queue',
        'Approve or remove reviews',
        'Verified-purchase badges',
      ]}
    />
  );
}
