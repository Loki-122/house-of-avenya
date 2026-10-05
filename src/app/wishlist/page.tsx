import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import WishlistView from '@/components/WishlistView';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { products } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Wishlist — House of Avenya',
  description: 'The House of Avenya pieces you have saved — return to them whenever you are ready.',
};

export default function WishlistPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="Saved Pieces"
          title="Your Wishlist"
          description="Everything you have set aside, kept together while you decide. Saved on this device, and waiting whenever you come back."
        />

        <section aria-labelledby="wishlist-list-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <WishlistView products={products} />
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}