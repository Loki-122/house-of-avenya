import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { products } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'New Arrivals — House of Avenya',
  description: 'The most recent additions to the House of Avenya collection.',
};

const newArrivals = products.filter((product) => product.isNew);

export default function NewArrivalsPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageHero
          eyebrow="Just In"
          title="New Arrivals"
          description="The latest pieces to leave our atelier — considered silhouettes and hand-finished details, newly added."
          image="https://images.pexels.com/photos/8886950/pexels-photo-8886950.jpeg?auto=compress&cs=tinysrgb&w=1600"
          imageAlt="Hands holding richly embroidered red fabric in fine detail"
        />

        <section aria-labelledby="new-arrivals-list-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 border-b border-brand-antiqueGold/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                  Freshly Added
                </p>
                <h2
                  id="new-arrivals-list-heading"
                  className="mt-4 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
                >
                  Recently Added
                </h2>
              </div>
              <p className="max-w-sm font-sans text-sm leading-relaxed text-brand-espresso/70">
                {newArrivals.length} new pieces in the collection right now.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
